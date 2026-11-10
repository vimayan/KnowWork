import { Router } from 'express';
import { query } from 'express-validator';
import * as svc from './trajectory.service.js';
import { asyncHandler, ok } from '../../utils/response.js';
import { optionalAuth, requireFieldAccess, validate } from '../../middleware/index.js';

const router = Router();

// GET /trajectory/:jobCardId/graph
router.get('/:jobCardId/graph', optionalAuth,
  asyncHandler(async (req, res) => {
    const data = await svc.getTrajectoryGraph(req.params.jobCardId);
    ok(res, data);
  }),
);

// GET /trajectory/nodes/:nodeId/outcomes
router.get('/nodes/:nodeId/outcomes', optionalAuth,
  asyncHandler(async (req, res) => {
    const data = await svc.getNodeOutcomes(req.params.nodeId);
    ok(res, data);
  }),
);

// GET /trajectory/:jobCardId/compare?types=fastest,balanced,academic
router.get('/:jobCardId/compare',
  query('types').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const types = req.query.types.split(',').map(t => t.trim());
    const data = await svc.compareScenarios(req.params.jobCardId, types);
    ok(res, data);
  }),
);

// GET /trajectory/:jobCardId/failure-map  (pro)
router.get('/:jobCardId/failure-map', optionalAuth,
  asyncHandler(async (req, res) => {
    const data = await svc.getFailureMap(req.params.jobCardId);
    ok(res, data);
  }),
);

export default router;
