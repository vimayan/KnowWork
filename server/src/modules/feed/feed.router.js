import { Router } from 'express';
import { q }      from '../../db/postgres.js';
import { cacheAside } from '../../db/redis.js';
import { config } from '../../config/index.js';
import { asyncHandler, ok, paginate } from '../../utils/response.js';
import { authenticate } from '../../middleware/index.js';

const router = Router();

// GET /feed  — personalised content feed for authenticated user
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const userId = req.user.id;
  const cacheKey = `feed:${userId}:${page}`;

  const data = await cacheAside(cacheKey, async () => {
    // Get user's accessible fields (free + paid)
    const { rows: user } = await q(
      'SELECT free_areas_selected, paid_areas FROM users WHERE id=$1',
      [userId],
    );
    const accessFields = [
      ...(user[0]?.free_areas_selected || []),
      ...(user[0]?.paid_areas || []),
    ];

    if (!accessFields.length) {
      return { items: [], locked_count: 0 };
    }

    // Pre-computed feed items from user_feed_items table
    // Built by background job every 15 min
    const { rows } = await q(
      `SELECT ufi.*,
              CASE ufi.item_type
                WHEN 'job_card'   THEN (SELECT json_build_object('slug',jc.slug,'title',jc.title,'summary',jc.summary) FROM job_cards jc WHERE jc.id=ufi.item_id)
                WHEN 'video'      THEN (SELECT json_build_object('title',cc.title,'content_type',cc.content_type,'creator_id',cc.creator_id) FROM creator_content cc WHERE cc.id=ufi.item_id)
                WHEN 'post'       THEN (SELECT json_build_object('title',cp.title,'post_type',cp.post_type,'community_id',cp.community_id) FROM community_posts cp WHERE cp.id=ufi.item_id)
                WHEN 'event'      THEN (SELECT json_build_object('title',ce.title,'starts_at',ce.starts_at,'event_type',ce.event_type) FROM community_events ce WHERE ce.id=ufi.item_id)
                ELSE '{}'
              END AS item_data
       FROM user_feed_items ufi
       WHERE ufi.user_id=$1 AND ufi.job_field_id=ANY($2)
       ORDER BY ufi.score DESC, ufi.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, accessFields, limit, (page - 1) * limit],
    );

    const locked = rows.filter(r => r.is_locked).length;
    return { items: rows, locked_count: locked };
  }, config.redis.ttl.feed);

  ok(res, data);
}));

// GET /feed/trending — top job cards this week (no auth)
router.get('/trending', asyncHandler(async (req, res) => {
  const cacheKey = 'feed:trending';
  const data = await cacheAside(cacheKey, async () => {
    const { rows } = await q(
      `SELECT jc.id,jc.slug,jc.title,jc.views,jc.saves,jf.category,jf.icon
       FROM job_cards jc JOIN job_fields jf ON jf.id=jc.field_id
       WHERE jc.published=true
       ORDER BY (jc.views + jc.saves * 3) DESC
       LIMIT 20`,
    );
    return rows;
  }, 1800);
  ok(res, data);
}));

export default router;
