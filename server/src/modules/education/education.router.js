import { Router } from 'express';
import { q }      from '../../db/postgres.js';
import { cacheAside } from '../../db/redis.js';
import { asyncHandler, ok } from '../../utils/response.js';

const router = Router();

// GET /education/:jobCardId/subjects  — textbook → skill map
router.get('/:jobCardId/subjects', asyncHandler(async (req, res) => {
  const cacheKey = `edu:subj:${req.params.jobCardId}`;
  const data = await cacheAside(cacheKey, async () => {
    const { rows } = await q(
      `SELECT * FROM subject_skill_map WHERE job_card_id=$1 ORDER BY importance DESC`,
      [req.params.jobCardId]
    );
    return rows;
  }, 3600);
  ok(res, data);
}));

// GET /education/:jobCardId/degrees  — degree ↔ job links
router.get('/:jobCardId/degrees', asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT * FROM job_education_links WHERE job_card_id=$1 ORDER BY relevance_score DESC`,
    [req.params.jobCardId]
  );
  ok(res, rows);
}));

// GET /education/:jobCardId/institutes  — institutes that prepare for this job
router.get('/:jobCardId/institutes', asyncHandler(async (req, res) => {
  const { city, state, type } = req.query;
  const conds = ['ijl.job_card_id=$1'], vals = [req.params.jobCardId];
  let i = 2;
  if (city)  { conds.push(`i.city ILIKE $${i++}`);  vals.push(`%${city}%`); }
  if (state) { conds.push(`i.state=$${i++}`);         vals.push(state); }
  if (type)  { conds.push(`i.type=$${i++}`);          vals.push(type); }

  const { rows } = await q(
    `SELECT i.*,ijl.skill_coverage_score,ijl.placement_count_last_yr,
            ijl.avg_starting_salary_inr,ijl.course_name
     FROM institute_job_links ijl JOIN institutes i ON i.id=ijl.institute_id
     WHERE ${conds.join(' AND ')}
     ORDER BY ijl.skill_coverage_score DESC NULLS LAST, i.placement_pct DESC NULLS LAST`,
    vals
  );
  ok(res, rows);
}));

// GET /education/institutes/:id  — institute detail
router.get('/institutes/:id', asyncHandler(async (req, res) => {
  const { rows } = await q('SELECT * FROM institutes WHERE id=$1', [req.params.id]);
  ok(res, rows[0] || null);
}));

export default router;
