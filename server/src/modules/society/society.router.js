import { Router } from 'express';
import { q }      from '../../db/postgres.js';
import { cacheAside } from '../../db/redis.js';
import { asyncHandler, ok } from '../../utils/response.js';

const router = Router();

// GET /society/:jobCardId  — daily life scenarios + industry societal links
router.get('/:jobCardId', asyncHandler(async (req, res) => {
  const cacheKey = `society:${req.params.jobCardId}`;
  const data = await cacheAside(cacheKey, async () => {
    const [scenarios, links] = await Promise.all([
      q('SELECT * FROM daily_life_scenarios WHERE job_card_id=$1 ORDER BY people_impacted_daily DESC NULLS LAST', [req.params.jobCardId]),
      q(`SELECT isl.* FROM industry_society_links isl
         JOIN job_fields jf ON jf.id=isl.field_id
         JOIN job_cards jc ON jc.field_id=jf.id
         WHERE jc.id=$1`, [req.params.jobCardId]),
    ]);
    return { scenarios: scenarios.rows, society_links: links.rows };
  }, 3600);
  ok(res, data);
}));

// GET /society/field/:fieldId  — industry-level societal influence
router.get('/field/:fieldId', asyncHandler(async (req, res) => {
  const { rows } = await q(
    'SELECT * FROM industry_society_links WHERE field_id=$1 ORDER BY society_system',
    [req.params.fieldId]
  );
  ok(res, rows);
}));

export default router;
