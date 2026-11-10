import { Router } from 'express';
import { body }   from 'express-validator';
import { q }      from '../../db/postgres.js';
import { grantAccess, cacheDel } from '../../db/redis.js';
import { asyncHandler, ok, created, AppError } from '../../utils/response.js';
import { authenticate, requireRole, validate } from '../../middleware/index.js';

const router = Router();

// GET /users/me/subscriptions
router.get('/me/subscriptions', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT us.*,jf.name AS field_name,jf.category,jf.icon
     FROM user_subscriptions us JOIN job_fields jf ON jf.id=us.job_field_id
     WHERE us.user_id=$1 AND us.is_active=true`,
    [req.user.id]
  );
  ok(res, rows);
}));

// POST /users/me/subscriptions  — add paid field access
router.post('/me/subscriptions', authenticate,
  body('job_field_id').isUUID(),
  body('plan').isIn(['monthly','annual','lifetime']),
  body('amount_paid_inr').isInt({ min: 0 }),
  validate,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const expires = {
      monthly:  new Date(Date.now() + 30  * 86400000),
      annual:   new Date(Date.now() + 365 * 86400000),
      lifetime: null,
    }[b.plan];

    const { rows } = await q(
      `INSERT INTO user_subscriptions (user_id,job_field_id,plan,expires_at,amount_paid_inr,payment_ref,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true)
       ON CONFLICT (user_id,job_field_id) DO UPDATE SET plan=EXCLUDED.plan,expires_at=EXCLUDED.expires_at,is_active=true
       RETURNING *`,
      [req.user.id, b.job_field_id, b.plan, expires, b.amount_paid_inr, b.payment_ref||null]
    );

    // Update PG user.paid_areas array
    await q(
      `UPDATE users SET paid_areas=array_append(COALESCE(paid_areas,'{}'), $1::uuid) WHERE id=$2 AND NOT ($1::uuid=ANY(COALESCE(paid_areas,'{}')))`,
      [b.job_field_id, req.user.id]
    );

    // Grant Redis access (30 days cache)
    await grantAccess(req.user.id, b.job_field_id);

    created(res, rows[0], 'Subscription activated');
  })
);

// GET /users/me/saved-jobs
router.get('/me/saved-jobs', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT usj.saved_at,jc.id,jc.slug,jc.title,jc.summary,jf.category,jf.icon
     FROM user_saved_jobs usj
     JOIN job_cards jc ON jc.id=usj.job_card_id
     JOIN job_fields jf ON jf.id=jc.field_id
     WHERE usj.user_id=$1 ORDER BY usj.saved_at DESC`,
    [req.user.id]
  );
  ok(res, rows);
}));

// POST /users/me/saved-jobs/:jobCardId
router.post('/me/saved-jobs/:jobCardId', authenticate, asyncHandler(async (req, res) => {
  await q(
    'INSERT INTO user_saved_jobs (user_id,job_card_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [req.user.id, req.params.jobCardId]
  );
  ok(res, null, { message: 'Saved' });
}));

// DELETE /users/me/saved-jobs/:jobCardId
router.delete('/me/saved-jobs/:jobCardId', authenticate, asyncHandler(async (req, res) => {
  await q('DELETE FROM user_saved_jobs WHERE user_id=$1 AND job_card_id=$2', [req.user.id, req.params.jobCardId]);
  ok(res, null, { message: 'Removed from saved' });
}));

// GET /users/me/agenda  — personal roadmap agendas
router.get('/me/agenda', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT upa.*,r.title AS roadmap_title,r.difficulty,r.estimated_months,
            rs.title AS current_step_title
     FROM user_personal_agenda upa
     JOIN roadmaps r ON r.id=upa.roadmap_id
     LEFT JOIN roadmap_steps rs ON rs.id=upa.current_step_id
     WHERE upa.user_id=$1 ORDER BY upa.last_checkin_at DESC NULLS LAST`,
    [req.user.id]
  );
  ok(res, rows);
}));

// PATCH /users/:id/role  (admin only)
router.patch('/:id/role', authenticate, requireRole('admin'),
  body('role').isIn(['user','mentor','creator','admin','moderator']),
  validate,
  asyncHandler(async (req, res) => {
    await q('UPDATE users SET role=$1 WHERE id=$2', [req.body.role, req.params.id]);
    ok(res, null, { message: `Role updated to ${req.body.role}` });
  })
);

export default router;
