import { Router } from 'express';
import { body }   from 'express-validator';
import * as svc   from './stories.service.js';
import { asyncHandler, ok, created } from '../../utils/response.js';
import { authenticate, optionalAuth, validate } from '../../middleware/index.js';

const router = Router();

// GET /stories?job_card_id=&featured=&page=
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const result = await svc.listStories(req.query);
  ok(res, result.data, { meta: result.meta });
}));

// GET /stories/:id
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  ok(res, await svc.getStory(req.params.id));
}));

// POST /stories/journey  — submit a new journey (auth required)
router.post('/journey', authenticate,
  body('submitter_name').trim().isLength({ min: 2, max: 100 }),
  body('current_title').trim().isLength({ min: 2, max: 120 }),
  body('steps').isArray({ min: 1 }),
  body('advice_to_self').optional().isLength({ max: 2000 }),
  validate,
  asyncHandler(async (req, res) => {
    created(res, await svc.submitJourney(req.user.id, req.body), 'Journey submitted for review');
  }),
);

// POST /stories/:id/like
router.post('/:id/like', asyncHandler(async (req, res) => {
  ok(res, await svc.likeStory(req.params.id));
}));

export default router;
