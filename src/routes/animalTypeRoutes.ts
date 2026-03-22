import { Router } from 'express';
import { AnimalTypeController, validateAnimalTypeCreate, validateAnimalTypeUpdate } from '../controllers/animalTypeController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const animalTypeController = new AnimalTypeController();

// GET /animals/types/{typeId} - authenticated
router.get('/:typeId', authenticateToken, asyncHandler(animalTypeController.getAnimalTypeById.bind(animalTypeController)));

// POST /animals/types - ADMIN or CHIPPER
router.post('/', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validateAnimalTypeCreate, asyncHandler(animalTypeController.createAnimalType.bind(animalTypeController)));

// PUT /animals/types/{typeId} - ADMIN or CHIPPER
router.put('/:typeId', authenticateToken, authorizeRoles(Role.ADMIN, Role.CHIPPER), validateAnimalTypeUpdate, asyncHandler(animalTypeController.updateAnimalType.bind(animalTypeController)));

// DELETE /animals/types/{typeId} - ADMIN only
router.delete('/:typeId', authenticateToken, authorizeRoles(Role.ADMIN), asyncHandler(animalTypeController.deleteAnimalType.bind(animalTypeController)));

export default router;