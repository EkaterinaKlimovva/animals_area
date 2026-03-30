import { Router } from 'express';
import { AreaController } from '../controllers/areaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import {
  areaAnalyticsQuerySchema,
  areaBodySchema,
  areaIdParamsSchema,
} from '../validation/areaSchemas';

const router = Router();
const areaController = new AreaController();

// GET /areas/{areaId} - authenticated
router.get(
  '/:areaId',
  authenticateToken,
  validate({ params: areaIdParamsSchema }),
  asyncHandler(areaController.getAreaById.bind(areaController)),
);

// GET /areas/{areaId}/analytics - authenticated
router.get(
  '/:areaId/analytics',
  authenticateToken,
  validate({ params: areaIdParamsSchema, query: areaAnalyticsQuerySchema }),
  asyncHandler(areaController.getAreaAnalytics.bind(areaController)),
);

// POST /areas - admin only
router.post(
  '/',
  authenticateToken,
  authorizeRoles(Role.ADMIN),
  validate({ body: areaBodySchema }),
  asyncHandler(areaController.createArea.bind(areaController)),
);

// PUT /areas/{areaId} - admin only
router.put(
  '/:areaId',
  authenticateToken,
  authorizeRoles(Role.ADMIN),
  validate({ params: areaIdParamsSchema, body: areaBodySchema }),
  asyncHandler(areaController.updateArea.bind(areaController)),
);

// DELETE /areas/{areaId} - admin only
router.delete(
  '/:areaId',
  authenticateToken,
  authorizeRoles(Role.ADMIN),
  validate({ params: areaIdParamsSchema }),
  asyncHandler(areaController.deleteArea.bind(areaController)),
);

export default router;
