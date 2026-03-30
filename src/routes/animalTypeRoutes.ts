import { Router } from 'express';
import { AnimalTypeController } from '../controllers/animalTypeController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import {
  animalTypeBodySchema,
  animalTypeIdParamsSchema,
} from '../validation/animalTypeSchemas';

const router = Router();
const animalTypeController = new AnimalTypeController();

// GET /animals/types/{typeId} - authenticated
router.get(
  '/:typeId',
  authenticateToken,
  validate({ params: animalTypeIdParamsSchema }),
  asyncHandler(
    animalTypeController.getAnimalTypeById.bind(animalTypeController),
  ),
);

// POST /animals/types - ADMIN or CHIPPER
router.post(
  '/',
  authenticateToken,
  authorizeRoles(Role.ADMIN, Role.CHIPPER),
  validate({ body: animalTypeBodySchema }),
  asyncHandler(
    animalTypeController.createAnimalType.bind(animalTypeController),
  ),
);

// PUT /animals/types/{typeId} - ADMIN or CHIPPER
router.put(
  '/:typeId',
  authenticateToken,
  authorizeRoles(Role.ADMIN, Role.CHIPPER),
  validate({ params: animalTypeIdParamsSchema, body: animalTypeBodySchema }),
  asyncHandler(
    animalTypeController.updateAnimalType.bind(animalTypeController),
  ),
);

// DELETE /animals/types/{typeId} - ADMIN only
router.delete(
  '/:typeId',
  authenticateToken,
  authorizeRoles(Role.ADMIN),
  validate({ params: animalTypeIdParamsSchema }),
  asyncHandler(
    animalTypeController.deleteAnimalType.bind(animalTypeController),
  ),
);

export default router;
