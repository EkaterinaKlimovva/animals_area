import { Router } from 'express';
import { LocationController } from '../controllers/locationController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { locationBodySchema, locationIdParamsSchema, geohashQuerySchema } from '../validation/locationSchemas';

const router = Router();
const locationController = new LocationController();

// GET /locations/{locationId} - authenticated
router.get('/:locationId', authenticateToken, validate({ params: locationIdParamsSchema }), asyncHandler(locationController.getLocationById.bind(locationController)));

// POST /locations - ADMIN or CHIPPER
router.post('/', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ body: locationBodySchema }), asyncHandler(locationController.createLocation.bind(locationController)));

// PUT /locations/{locationId} - ADMIN or CHIPPER
router.put('/:locationId', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ params: locationIdParamsSchema, body: locationBodySchema }), asyncHandler(locationController.updateLocation.bind(locationController)));

// DELETE /locations/{locationId} - ADMIN only
router.delete('/:locationId', authenticateToken, authorizeRoles(Role.ADMIN), validate({ params: locationIdParamsSchema }), asyncHandler(locationController.deleteLocation.bind(locationController)));

// GET /locations/geohash - authenticated
router.get('/geohash', authenticateToken, validate({ query: geohashQuerySchema }), asyncHandler(locationController.getGeohash.bind(locationController)));

// GET /locations/geohashv2 - authenticated
router.get('/geohashv2', authenticateToken, validate({ query: geohashQuerySchema }), asyncHandler(locationController.getGeohashV2.bind(locationController)));

// GET /locations/geohashv3 - authenticated
router.get('/geohashv3', authenticateToken, validate({ query: geohashQuerySchema }), asyncHandler(locationController.getGeohashV3.bind(locationController)));

export default router;
