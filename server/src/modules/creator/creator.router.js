import { Router } from 'express';
import { body }   from 'express-validator';
import { q, withTx } from '../../db/postgres.js';
import { asyncHandler, ok, created, paginate, pageInfo, AppError } from '../../utils/response.js';
import { authenticate, requireRole, validate, upload, uploadLimiter } from '../../middleware/index.js';

const router = Router();

// GET /creator/:profileId  — creator profile
router.get('/:profileId', asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT cp.*,p.display_name,p.headline,p.avatar_initials,p.city,p.country,
            jc.title AS primary_job_title
     FROM creator_profiles cp
     JOIN profiles p ON p.id=cp.profile_id
     LEFT JOIN job_cards jc ON jc.slug=ANY(
       SELECT jc2.slug FROM job_cards jc2 WHERE jc2.id=ANY(cp.speciality_job_cards) LIMIT 1
     )
     WHERE cp.profile_id=$1`,
    [req.params.profileId]
  );
  if (!rows[0]) throw AppError.notFound('Creator not found');
  ok(res, rows[0]);
}));

// POST /creator  — become a creator
router.post('/', authenticate,
  body('creator_name').trim().isLength({ min: 2, max: 100 }),
  validate,
  asyncHandler(async (req, res) => {
    const { rows: prof } = await q('SELECT id FROM profiles WHERE user_id=$1', [req.user.id]);
    if (!prof[0]) throw AppError.badRequest('Create a profile first');

    const { rows } = await q(
      `INSERT INTO creator_profiles (profile_id,creator_name,bio_creator,speciality_job_cards)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (profile_id) DO UPDATE SET creator_name=EXCLUDED.creator_name RETURNING *`,
      [prof[0].id, req.body.creator_name, req.body.bio_creator||null, req.body.speciality_job_cards||[]]
    );
    await q("UPDATE users SET role='creator' WHERE id=$1", [req.user.id]);
    created(res, rows[0], 'Creator profile created');
  })
);

// GET /creator/:profileId/content
router.get('/:profileId/content', asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const type = req.query.type;
  const conds = ['cc.creator_id=(SELECT id FROM creator_profiles WHERE profile_id=$1)'];
  const vals = [req.params.profileId];
  let i = 2;
  if (type) { conds.push(`cc.content_type=$${i++}`); vals.push(type); }

  const [data, cnt] = await Promise.all([
    q(`SELECT cc.*,jc.title AS job_card_title FROM creator_content cc
       LEFT JOIN job_cards jc ON jc.id=cc.job_card_id
       WHERE ${conds.join(' AND ')} ORDER BY cc.published_at DESC NULLS LAST
       LIMIT $${i} OFFSET $${i+1}`, [...vals, limit, offset]),
    q(`SELECT COUNT(*) FROM creator_content cc WHERE ${conds.join(' AND ')}`, vals),
  ]);
  ok(res, data.rows, { meta: pageInfo(parseInt(cnt.rows[0].count), page, limit) });
}));

// POST /creator/:profileId/content
router.post('/:profileId/content', authenticate, uploadLimiter,
  upload.single('thumbnail'),
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('content_type').isIn(['short','video','note','course','live_class','article']),
  body('job_card_id').isUUID(),
  validate,
  asyncHandler(async (req, res) => {
    const { rows: cp } = await q('SELECT id FROM creator_profiles WHERE profile_id=(SELECT id FROM profiles WHERE user_id=$1)', [req.user.id]);
    if (!cp[0]) throw AppError.forbidden('Not a creator');

    const b = req.body;
    const { rows } = await q(
      `INSERT INTO creator_content (creator_id,job_card_id,discipline_id,content_type,title,description,url,thumbnail_url,duration_sec,is_free,price_inr,is_pro_content,published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now()) RETURNING *`,
      [cp[0].id, b.job_card_id, b.discipline_id||null, b.content_type, b.title,
       b.description||null, b.url||null, req.file?.filename||null, b.duration_sec||null,
       b.is_free!==false, b.price_inr||null, b.is_pro_content||false]
    );
    await q('UPDATE creator_profiles SET total_content_pieces=total_content_pieces+1 WHERE id=$1', [cp[0].id]);
    created(res, rows[0], 'Content published');
  })
);

// GET /creator/:profileId/courses
router.get('/:profileId/courses', asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT cc.*,jc.title AS job_card_title FROM creator_courses cc
     LEFT JOIN job_cards jc ON jc.id=cc.job_card_id
     WHERE cc.creator_id=(SELECT id FROM creator_profiles WHERE profile_id=$1)
     ORDER BY cc.created_at DESC`,
    [req.params.profileId]
  );
  ok(res, rows);
}));

export default router;
