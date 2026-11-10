import { Router } from 'express';
import { body, param } from 'express-validator';
import * as svc from './job_cards.service.js';
import { asyncHandler, ok, created } from '../../utils/response.js';
import { authenticate, optionalAuth, requireRole, requireFieldAccess, validate } from '../../middleware/index.js';

const router = Router();

// GET /job-cards
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const data = await svc.listJobCards(req.query);
  ok(res, data.data, { meta: data.meta });
}));

// GET /job-cards/:slug  — full card (base data, free)
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const data = await svc.getJobCard(req.params.slug);
  svc.recordView(data.id).catch(() => {});
  ok(res, data);
}));

// GET /job-cards/:id/section/:section — gated sections
// problems/history/education/subjects = free
// employers/society/failures/obstacles = pro
const PRO_SECTIONS = new Set(['employers','failures','obstacles','society']);

router.get('/:id/section/:section',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id, section } = req.params;

    // Pro sections require auth + field access check (handled by next gate)
    if (PRO_SECTIONS.has(section) && !req.user)
      return ok(res, [], { message: 'Login required for this section' });

    const data = await svc.getJobCardSection(id, section);
    ok(res, data);
  }),
);

// POST /job-cards  (admin)
router.post('/', authenticate, requireRole('admin'),
  body('slug').trim().isLength({ min: 3, max: 120 }),
  body('title').trim().isLength({ min: 3, max: 120 }),
  body('field_id').isUUID(),
  validate,
  asyncHandler(async (req, res) => {
    const data = await svc.createJobCard(req.body);
    created(res, data, 'Job card created');
  }),
);

// PATCH /job-cards/:id  (admin)
router.patch('/:id', authenticate, requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await svc.updateJobCard(req.params.id, req.body);
    ok(res, data, { message: 'Updated' });
  }),
);

// DELETE /job-cards/:id  (admin)
router.delete('/:id', authenticate, requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await svc.deleteJobCard(req.params.id);
    ok(res, data, { message: 'Deleted' });
  }),
);

export default router;
