import { Router } from 'express';
import { body, query } from 'express-validator';
import * as svc from './salary.service.js';
import { asyncHandler, ok } from '../../utils/response.js';
import { optionalAuth, authenticate, validate } from '../../middleware/index.js';

const router = Router();

// GET /salary/:jobCardId  — salary index matrix
router.get('/:jobCardId', optionalAuth, asyncHandler(async (req, res) => {
  const data = await svc.getSalaryIndex(req.params.jobCardId, req.query);
  ok(res, data);
}));

// GET /salary/:jobCardId/percentiles?country=India
router.get('/:jobCardId/percentiles', asyncHandler(async (req, res) => {
  const data = await svc.getSalaryPercentiles(req.params.jobCardId, req.query.country);
  ok(res, data);
}));

// GET /salary/:jobCardId/trend?months=24
router.get('/:jobCardId/trend', asyncHandler(async (req, res) => {
  const data = await svc.getSalaryTrend(req.params.jobCardId, parseInt(req.query.months) || 24);
  ok(res, data);
}));

// GET /salary/compare?ids=uuid1,uuid2
router.get('/compare', asyncHandler(async (req, res) => {
  const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
  const data = await svc.compareSalary(ids);
  ok(res, data);
}));

// POST /salary/submit  — crowdsource a salary point
router.post('/submit', authenticate,
  body('job_card_id').isUUID(),
  body('salary_inr').isInt({ min: 1 }),
  body('job_title').trim().isLength({ min: 2 }),
  validate,
  asyncHandler(async (req, res) => {
    await svc.submitSalaryPoint({ ...req.body, profile_id: req.user.profile_id });
    ok(res, null, { message: 'Salary data point submitted — thank you!' });
  }),
);

export default router;
