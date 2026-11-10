import { Router } from 'express';
import { body }   from 'express-validator';
import { q }      from '../../db/postgres.js';
import { asyncHandler, ok, created, AppError } from '../../utils/response.js';
import { authenticate, requireRole, validate } from '../../middleware/index.js';

const router = Router();

// GET /employers/:jobCardId  — list employers for a job card
router.get('/:jobCardId', asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT je.*,
            ROUND(AVG(er.overall_rating),2) AS avg_rating,
            COUNT(er.id)                    AS review_count
     FROM job_employers je
     LEFT JOIN employer_reviews er ON er.employer_id=je.id
     WHERE je.job_card_id=$1
     GROUP BY je.id
     ORDER BY je.employer_type, je.avg_salary_inr DESC NULLS LAST`,
    [req.params.jobCardId]
  );
  ok(res, rows);
}));

// GET /employers/:jobCardId/:employerId/reviews
router.get('/:jobCardId/:employerId/reviews', asyncHandler(async (req, res) => {
  const { rows } = await q(
    `SELECT er.*,p.display_name AS reviewer_name, p.current_title AS reviewer_title
     FROM employer_reviews er
     LEFT JOIN profiles p ON p.id=er.reviewer_id
     WHERE er.employer_id=$1
     ORDER BY er.created_at DESC LIMIT 20`,
    [req.params.employerId]
  );
  ok(res, rows);
}));

// POST /employers/:jobCardId/:employerId/reviews
router.post('/:jobCardId/:employerId/reviews', authenticate,
  body('overall_rating').isInt({ min: 1, max: 5 }),
  body('review_text').optional().isLength({ max: 2000 }),
  validate,
  asyncHandler(async (req, res) => {
    const { rows: prof } = await q('SELECT id FROM profiles WHERE user_id=$1', [req.user.id]);
    const b = req.body;
    const { rows } = await q(
      `INSERT INTO employer_reviews (employer_id,reviewer_id,overall_rating,culture_rating,growth_rating,wlb_rating,salary_transparency,review_text,interview_experience,is_anonymous)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.params.employerId, prof[0]?.id||null, b.overall_rating, b.culture_rating||null,
       b.growth_rating||null, b.wlb_rating||null, b.salary_transparency||null,
       b.review_text||null, b.interview_experience||null, b.is_anonymous!==false]
    );
    created(res, rows[0], 'Review submitted');
  })
);

// POST /employers  (admin — add employer to a job card)
router.post('/', authenticate, requireRole('admin'),
  body('job_card_id').isUUID(),
  body('company_name').trim().isLength({ min: 2, max: 150 }),
  body('employer_type').isIn(['msme','mnc','startup','government','ngo','freelance','self_employed']),
  validate,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const { rows } = await q(
      `INSERT INTO job_employers (job_card_id,company_name,employer_type,city,state,country,is_remote,careers_url,avg_salary_inr,openings_est,avg_career_growth_pct,verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [b.job_card_id,b.company_name,b.employer_type,b.city||null,b.state||null,
       b.country||'India',b.is_remote||false,b.careers_url||null,b.avg_salary_inr||null,
       b.openings_est||null,b.avg_career_growth_pct||null,b.verified||false]
    );
    created(res, rows[0], 'Employer added');
  })
);

export default router;
