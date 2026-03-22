import { Router } from 'express';
import { AnimalController } from '../controllers/animalController';
import { Role } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import {
  animalAndPointParamsSchema,
  animalAndTypeParamsSchema,
  animalAndVisitedLocationParamsSchema,
  animalIdParamsSchema,
  animalSearchQuerySchema,
  animalVisitedLocationsQuerySchema,
  createAnimalBodySchema,
  updateAnimalBodySchema,
  updateAnimalTypesBodySchema,
  updateVisitedLocationBodySchema,
} from '../validation/animalSchemas';

const router = Router();
const animalController = new AnimalController();

// GET /animals/search - authenticated
router.get('/search', authenticateToken, validate({ query: animalSearchQuerySchema }), asyncHandler(animalController.getAnimals.bind(animalController)));

// GET /animals/{animalId} - authenticated
router.get('/:animalId', authenticateToken, validate({ params: animalIdParamsSchema }), asyncHandler(animalController.getAnimalById.bind(animalController)));

// POST /animals - ADMIN or CHIPPER
router.post('/', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ body: createAnimalBodySchema }), asyncHandler(animalController.createAnimal.bind(animalController)));

// PUT /animals/{animalId} - ADMIN or CHIPPER
router.put('/:animalId', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ params: animalIdParamsSchema, body: updateAnimalBodySchema }), asyncHandler(animalController.updateAnimal.bind(animalController)));

// DELETE /animals/{animalId} - ADMIN only
router.delete('/:animalId', authenticateToken, authorizeRoles(Role.ADMIN), validate({ params: animalIdParamsSchema }), asyncHandler(animalController.deleteAnimal.bind(animalController)));

// POST /animals/{animalId}/types/{typeId} - ADMIN or CHIPPER
router.post('/:animalId/types/:typeId', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ params: animalAndTypeParamsSchema }), asyncHandler(animalController.addTypeToAnimal.bind(animalController)));

// DELETE /animals/{animalId}/types/{typeId} - ADMIN or CHIPPER
router.delete('/:animalId/types/:typeId', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ params: animalAndTypeParamsSchema }), asyncHandler(animalController.removeTypeFromAnimal.bind(animalController)));

// PUT /animals/{animalId}/types - ADMIN or CHIPPER
router.put('/:animalId/types', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ params: animalIdParamsSchema, body: updateAnimalTypesBodySchema }), asyncHandler(animalController.updateAnimalTypes.bind(animalController)));

// GET /animals/{animalId}/locations - authenticated
router.get('/:animalId/locations', authenticateToken, validate({ params: animalIdParamsSchema, query: animalVisitedLocationsQuerySchema }), asyncHandler(animalController.getAnimalVisitedLocations.bind(animalController)));

// POST /animals/{animalId}/locations/{pointId} - ADMIN or CHIPPER
router.post('/:animalId/locations/:pointId', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ params: animalAndPointParamsSchema }), asyncHandler(animalController.addVisitedLocation.bind(animalController)));

// PUT /animals/{animalId}/locations - ADMIN or CHIPPER
router.put('/:animalId/locations', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validate({ params: animalIdParamsSchema, body: updateVisitedLocationBodySchema }), asyncHandler(animalController.updateVisitedLocation.bind(animalController)));

// DELETE /animals/{animalId}/locations/{visitedLocationId} - ADMIN only
router.delete('/:animalId/locations/:visitedLocationId', authenticateToken, authorizeRoles(Role.ADMIN), validate({ params: animalAndVisitedLocationParamsSchema }), asyncHandler(animalController.deleteVisitedLocation.bind(animalController)));

export default router;