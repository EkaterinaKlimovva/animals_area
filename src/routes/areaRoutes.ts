import { Router } from 'express';
import { AreaController, validateAreaCreate, validateAreaUpdate, validateAreaAnalytics } from '../controllers/areaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const areaController = new AreaController();

// GET /areas/{areaId} - authenticated
router.get('/:areaId', authenticateToken, asyncHandler(areaController.getAreaById.bind(areaController)));

// GET /areas/{areaId}/analytics - authenticated
router.get('/:areaId/analytics', authenticateToken, validateAreaAnalytics, asyncHandler(areaController.getAreaAnalytics.bind(areaController)));

// POST /areas - admin only
router.post('/', authenticateToken, authorizeRoles(Role.ADMIN), validateAreaCreate, asyncHandler(areaController.createArea.bind(areaController)));

// PUT /areas/{areaId} - admin only
router.put('/:areaId', authenticateToken, authorizeRoles(Role.ADMIN), validateAreaUpdate, asyncHandler(areaController.updateArea.bind(areaController)));

// DELETE /areas/{areaId} - admin only
router.delete('/:areaId', authenticateToken, authorizeRoles(Role.ADMIN), asyncHandler(areaController.deleteArea.bind(areaController)));

export default router;