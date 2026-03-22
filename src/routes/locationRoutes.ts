import { Router } from 'express';
import { LocationController, validateLocationCreate, validateLocationUpdate } from '../controllers/locationController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const locationController = new LocationController();

// GET /locations/{locationId} - authenticated
router.get('/:locationId', authenticateToken, asyncHandler(locationController.getLocationById.bind(locationController)));

// POST /locations - ADMIN or CHIPPER
router.post('/', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validateLocationCreate, asyncHandler(locationController.createLocation.bind(locationController)));

// PUT /locations/{locationId} - ADMIN or CHIPPER
router.put('/:locationId', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validateLocationUpdate, asyncHandler(locationController.updateLocation.bind(locationController)));

// DELETE /locations/{locationId} - ADMIN only
router.delete('/:locationId', authenticateToken, authorizeRoles(Role.ADMIN), asyncHandler(locationController.deleteLocation.bind(locationController)));

export default router;