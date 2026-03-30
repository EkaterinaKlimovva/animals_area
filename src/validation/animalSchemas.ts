import { z } from 'zod';
import {
  nonNegativeIntSchema,
  positiveIntSchema,
  positiveIntStringSchema,
} from './commonSchemas';

export const animalIdParamsSchema = z.object({
  animalId: positiveIntStringSchema,
});

export const animalAndTypeParamsSchema = z.object({
  animalId: positiveIntStringSchema,
  typeId: positiveIntStringSchema,
});

export const animalAndPointParamsSchema = z.object({
  animalId: positiveIntStringSchema,
  pointId: positiveIntStringSchema,
});

export const animalAndVisitedLocationParamsSchema = z.object({
  animalId: positiveIntStringSchema,
  visitedLocationId: positiveIntStringSchema,
});

export const createAnimalBodySchema = z.object({
  animalTypes: z.array(positiveIntSchema).min(1),
  weight: z.coerce.number().positive(),
  length: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  chipperId: positiveIntSchema,
  chippingLocationId: positiveIntSchema,
});

export const updateAnimalBodySchema = z.object({
  animalTypes: z.array(positiveIntSchema).min(1).optional(),
  weight: z.coerce.number().positive().optional(),
  length: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  lifeStatus: z.enum(['ALIVE', 'DEAD']).optional(),
  chipperId: positiveIntSchema.optional(),
  chippingLocationId: positiveIntSchema.optional(),
});

export const animalSearchQuerySchema = z.object({
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  chipperId: positiveIntSchema.optional(),
  chippingLocationId: positiveIntSchema.optional(),
  lifeStatus: z.enum(['ALIVE', 'DEAD']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  from: nonNegativeIntSchema.optional(),
  size: positiveIntSchema.optional(),
});

export const updateAnimalTypesBodySchema = z.object({
  oldTypeId: positiveIntSchema,
  newTypeId: positiveIntSchema,
});

export const updateVisitedLocationBodySchema = z.object({
  visitedLocationPointId: positiveIntSchema,
  locationPointId: positiveIntSchema,
});

export const animalVisitedLocationsQuerySchema = z.object({
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  from: nonNegativeIntSchema.optional(),
  size: positiveIntSchema.optional(),
});
