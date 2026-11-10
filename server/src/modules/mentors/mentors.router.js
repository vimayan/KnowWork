import { Router } from 'express';
import { body }   from 'express-validator';
import * as svc   from './mentors.service.js';
import { asyncHandler, ok, created } from '../../utils/response.js';
import { authenticate, requireRole, validate } from '../../middleware/index.js';

const router = Router();

router.get('/',         asyncHandler(async (req, res) => { const d = await svc.listMentors(req.query); ok(res, d.data, { meta: d.meta }); }));
router.get('/:id',      asyncHandler(async (req, res) => { ok(res, await svc.getMentor(req.params.id)); }));

router.post('/', authenticate,
  body('title').trim().isLength({ min: 2, max: 120 }),
  body('hourly_rate_inr').optional().isInt({ min: 0 }),
  validate,
  asyncHandler(async (req, res) => { created(res, await svc.createMentorProfile(req.user.id, req.body), 'Mentor profile created'); }),
);

router.patch('/:id/availability', authenticate,
  body('available').isBoolean(), validate,
  asyncHandler(async (req, res) => { ok(res, await svc.setAvailability(req.params.id, req.user.id, req.body.available)); }),
);

router.post('/:id/book', authenticate,
  body('topic').optional().isLength({ max: 200 }),
  body('duration_min').optional().isInt({ min: 15, max: 240 }),
  validate,
  asyncHandler(async (req, res) => { created(res, await svc.bookSession(req.params.id, req.user.id, req.body), 'Session booked'); }),
);

router.get('/sessions/mine', authenticate, asyncHandler(async (req, res) => {
  const data = await svc.listSessions({ studentId: req.user.id, status: req.query.status });
  ok(res, data);
}));

router.get('/sessions/as-mentor', authenticate, requireRole('mentor','admin'), asyncHandler(async (req, res) => {
  // Get mentor record for this user
  const { rows } = await import('../../db/postgres.js').then(m => m.q('SELECT id FROM mentors WHERE user_id=$1', [req.user.id]));
  if (!rows[0]) return ok(res, []);
  ok(res, await svc.listSessions({ mentorId: rows[0].id, status: req.query.status }));
}));

router.post('/sessions/:sessionId/review', authenticate,
  body('overall_rating').isInt({ min: 1, max: 5 }),
  body('review_text').optional().isLength({ max: 2000 }),
  validate,
  asyncHandler(async (req, res) => { ok(res, await svc.reviewSession(req.params.sessionId, req.user.id, req.body)); }),
);

export default router;
