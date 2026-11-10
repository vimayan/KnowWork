import { Router } from 'express';
import { body }   from 'express-validator';
import { q, withTx } from '../../db/postgres.js';
import { asyncHandler, ok, created, paginate, pageInfo } from '../../utils/response.js';
import { authenticate, optionalAuth, requireRole, validate } from '../../middleware/index.js';
import { AppError } from '../../utils/response.js';

const router = Router();

// GET /community  — list communities
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT c.*,jc.title AS job_card_title,jf.name AS field_name
     FROM communities c
     LEFT JOIN job_cards jc ON jc.id=c.job_card_id
     LEFT JOIN job_fields jf ON jf.id=c.job_field_id
     WHERE c.is_public=true OR $1::boolean
     ORDER BY c.member_count DESC LIMIT 50`,
    [req.user?.role === 'admin'],
  );
  ok(res, rows);
}));

// POST /community/:id/join
router.post('/:id/join', authenticate, asyncHandler(async (req, res) => {
  await q('INSERT INTO community_members (community_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [req.params.id, req.user.id]);
  ok(res, null, { message: 'Joined community' });
}));

// GET /community/:id/posts
router.get('/:id/posts', optionalAuth, asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const type = req.query.type; // question/post/announcement etc.
  const cond = type ? 'AND cp.post_type=$3' : '';
  const vals = [req.params.id, null, ...(type ? [type] : [])]; // parent=null = top-level

  const { rows } = await q(
    `SELECT cp.*,u.name AS author_name,u.avatar_initials,
            (SELECT COUNT(*) FROM community_posts r WHERE r.parent_id=cp.id) AS reply_count
     FROM community_posts cp JOIN users u ON u.id=cp.author_id
     WHERE cp.community_id=$1 AND cp.parent_id IS NULL ${cond}
     ORDER BY cp.upvotes DESC, cp.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [req.params.id, ...(type ? [type] : [])],
  );
  ok(res, rows);
}));

// POST /community/:id/posts
router.post('/:id/posts', authenticate,
  body('body').trim().isLength({ min: 5 }),
  body('post_type').optional().isIn(['question','post','announcement','resource']),
  body('title').optional().trim().isLength({ max: 200 }),
  validate,
  asyncHandler(async (req, res) => {
    const { rows } = await q(
      `INSERT INTO community_posts (community_id,author_id,post_type,title,body,job_card_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, req.user.id, req.body.post_type||'post',
       req.body.title||null, req.body.body, req.body.job_card_id||null],
    );
    created(res, rows[0], 'Post created');
  }),
);

// POST /community/posts/:postId/upvote
router.post('/posts/:postId/upvote', authenticate, asyncHandler(async (req, res) => {
  await q('UPDATE community_posts SET upvotes=upvotes+1 WHERE id=$1', [req.params.postId]);
  ok(res, null, { message: 'Upvoted' });
}));

// GET /community/:id/events
router.get('/:id/events', asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT ce.*,u.name AS host_name FROM community_events ce
     JOIN users u ON u.id=ce.host_id
     WHERE ce.community_id=$1 AND ce.starts_at >= now()
     ORDER BY ce.starts_at ASC LIMIT 20`,
    [req.params.id],
  );
  ok(res, rows);
}));

// POST /community/:id/events  (creator or admin)
router.post('/:id/events', authenticate, requireRole('creator','mentor','admin'),
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('event_type').isIn(['masterclass','study_room','q_and_a','workshop','hackathon','career_fair']),
  body('starts_at').isISO8601(),
  validate,
  asyncHandler(async (req, res) => {
    const { rows } = await q(
      `INSERT INTO community_events (community_id,host_id,event_type,title,description,starts_at,duration_min,platform,max_attendees,is_paid,price_inr)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.params.id, req.user.id, req.body.event_type, req.body.title, req.body.description||null,
       req.body.starts_at, req.body.duration_min||60, req.body.platform||'google_meet',
       req.body.max_attendees||null, req.body.is_paid||false, req.body.price_inr||null],
    );
    created(res, rows[0], 'Event created');
  }),
);

// GET /community/:id/study-rooms
router.get('/:id/study-rooms', asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT sr.*,r.title AS roadmap_title FROM study_rooms sr
     LEFT JOIN roadmaps r ON r.id=sr.roadmap_id
     WHERE sr.community_id=$1 AND sr.is_open=true ORDER BY sr.member_count DESC`,
    [req.params.id],
  );
  ok(res, rows);
}));

export default router;
