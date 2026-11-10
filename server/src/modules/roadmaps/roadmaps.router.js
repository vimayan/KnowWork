import { Router } from 'express';
import { body }   from 'express-validator';
import { q, withTx } from '../../db/postgres.js';
import { cacheAside, cacheDel, incr } from '../../db/redis.js';
import { asyncHandler, ok, created, paginate, pageInfo, AppError } from '../../utils/response.js';
import { authenticate, optionalAuth, requireRole, validate } from '../../middleware/index.js';

const router = Router();

// GET /roadmaps?job_card_id=&trajectory_type=&difficulty=
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const conds = ["r.status='published'"], vals = [];
  let i = 1;
  if (req.query.job_card_id)    { conds.push(`r.job_card_id=$${i++}`);     vals.push(req.query.job_card_id); }
  if (req.query.trajectory_type){ conds.push(`r.trajectory_type=$${i++}`); vals.push(req.query.trajectory_type); }
  if (req.query.difficulty)     { conds.push(`r.difficulty=$${i++}`);      vals.push(req.query.difficulty); }
  if (req.query.official)       { conds.push('r.is_official=true'); }
  const where = 'WHERE ' + conds.join(' AND ');
  const sort = req.query.sort === 'likes' ? 'r.likes DESC' : 'r.created_at DESC';

  const [data, cnt] = await Promise.all([
    q(`SELECT r.id,r.title,r.trajectory_type,r.estimated_months,r.difficulty,
              r.is_official,r.likes,r.views,r.created_at,
              jc.title AS job_card_title, jc.slug AS job_card_slug,
              u.name AS creator_name
       FROM roadmaps r
       LEFT JOIN job_cards jc ON jc.id=r.job_card_id
       LEFT JOIN users u ON u.id=r.created_by
       ${where} ORDER BY ${sort} LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]),
    q(`SELECT COUNT(*) FROM roadmaps r ${where}`, vals),
  ]);
  ok(res, data.rows, { meta: pageInfo(parseInt(cnt.rows[0].count), page, limit) });
}));

// GET /roadmaps/:id  — full roadmap with all steps + resources
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const cacheKey = `roadmap:${req.params.id}`;
  const data = await cacheAside(cacheKey, async () => {
    const { rows } = await q(
      `SELECT r.*,jc.title AS job_card_title,jc.slug AS job_card_slug,u.name AS creator_name
       FROM roadmaps r
       LEFT JOIN job_cards jc ON jc.id=r.job_card_id
       LEFT JOIN users u ON u.id=r.created_by
       WHERE r.id=$1 AND r.status='published'`,
      [req.params.id]
    );
    if (!rows[0]) throw AppError.notFound('Roadmap not found');
    const rm = rows[0];

    const { rows: steps } = await q(
      `SELECT rs.*,
              ARRAY(SELECT row_to_json(rr) FROM roadmap_resources rr WHERE rr.step_id=rs.id) AS resources
       FROM roadmap_steps rs WHERE rs.roadmap_id=$1 ORDER BY rs.position`,
      [rm.id]
    );
    return { ...rm, steps };
  }, 600);

  await incr(`roadmap:views:${req.params.id}`).catch(()=>{});
  ok(res, data);
}));

// POST /roadmaps
router.post('/', authenticate,
  body('job_card_id').isUUID(),
  body('title').trim().isLength({ min: 5, max: 180 }),
  body('steps').isArray({ min: 1 }),
  body('steps.*.title').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const roadmap = await withTx(async client => {
      const { rows } = await client.query(
        `INSERT INTO roadmaps (job_card_id,created_by,title,description,trajectory_type,target_audience,estimated_months,difficulty,is_official)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [b.job_card_id, req.user.id, b.title, b.description||null,
         b.trajectory_type||'balanced', b.target_audience||null, b.estimated_months||null,
         b.difficulty||'medium', req.user.role==='admin' && b.is_official===true]
      );
      const rm = rows[0];
      for (let pos = 0; pos < b.steps.length; pos++) {
        const s = b.steps[pos];
        const { rows: stepRows } = await client.query(
          `INSERT INTO roadmap_steps (roadmap_id,position,phase,title,description,duration_weeks,is_milestone,skills_gained,skill_hours_required)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [rm.id, pos+1, s.phase||null, s.title, s.description||null, s.duration_weeks||null,
           s.is_milestone||false, s.skills_gained||[], s.skill_hours_required||null]
        );
        for (const r of (s.resources||[])) {
          await client.query(
            `INSERT INTO roadmap_resources (step_id,resource_type,title,url,provider,is_free,cost_inr,duration_hours)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [stepRows[0].id, r.resource_type||'course', r.title, r.url||null,
             r.provider||null, r.is_free||false, r.cost_inr||null, r.duration_hours||null]
          );
        }
      }
      return rm;
    });
    created(res, roadmap, 'Roadmap created');
  })
);

// POST /roadmaps/:id/like
router.post('/:id/like', authenticate, asyncHandler(async (req, res) => {
  await q('UPDATE roadmaps SET likes=likes+1 WHERE id=$1 AND status=$2', [req.params.id, 'published']);
  await cacheDel(`roadmap:${req.params.id}`);
  ok(res, null, { message: 'Liked' });
}));

// GET /roadmaps/:id/progress  — user's personal agenda on this roadmap
router.get('/:id/progress', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await q(
    'SELECT * FROM user_personal_agenda WHERE roadmap_id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  ok(res, rows[0] || null);
}));

// POST /roadmaps/:id/progress  — start or update agenda
router.post('/:id/progress', authenticate,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const { rows } = await q(
      `INSERT INTO user_personal_agenda (user_id,roadmap_id,target_completion,current_step_id,week_targets,hours_spent)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id,roadmap_id) DO UPDATE SET
         current_step_id=EXCLUDED.current_step_id, week_targets=EXCLUDED.week_targets,
         hours_spent=EXCLUDED.hours_spent, last_checkin_at=now()
       RETURNING *`,
      [req.user.id, req.params.id, b.target_completion||null, b.current_step_id||null,
       b.week_targets||null, b.hours_spent||null]
    );
    ok(res, rows[0], { message: 'Progress saved' });
  })
);

export default router;
