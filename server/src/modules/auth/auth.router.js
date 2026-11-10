import { Router }    from 'express';
import { body }      from 'express-validator';
import * as svc      from './auth.service.js';
import { asyncHandler, ok, created } from '../../utils/response.js';
import { authenticate, authLimiter, validate } from '../../middleware/index.js';

const router = Router();

// POST /auth/register
router.post('/register', authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
  validate,
  asyncHandler(async (req, res) => {
    const data = await svc.register(req.body);
    created(res, data, 'Registered successfully');
  }),
);

// POST /auth/login
router.post('/login', authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const data = await svc.login(req.body);
    ok(res, data, { message: 'Logged in' });
  }),
);

// POST /auth/logout
router.post('/logout', authenticate,
  asyncHandler(async (req, res) => {
    await svc.logout(req.token);
    ok(res, null, { message: 'Logged out' });
  }),
);

// GET /auth/me
router.get('/me', authenticate,
  asyncHandler(async (req, res) => {
    const user = await svc.me(req.user.id);
    ok(res, { user });
  }),
);

// PATCH /auth/me
router.patch('/me', authenticate,
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('newsletter_subscribed').optional().isBoolean(),
  validate,
  asyncHandler(async (req, res) => {
    const user = await svc.updateMe(req.user.id, req.body);
    ok(res, { user }, { message: 'Updated' });
  }),
);

// POST /auth/areas — select up to 5 free job field areas
router.post('/areas', authenticate,
  body('field_ids').isArray({ min: 1, max: 5 }),
  validate,
  asyncHandler(async (req, res) => {
    const data = await svc.selectFreeAreas(req.user.id, req.body.field_ids);
    ok(res, data, { message: 'Areas selected' });
  }),
);

export default router;
