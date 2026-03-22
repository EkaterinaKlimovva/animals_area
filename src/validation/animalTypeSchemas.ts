import { z } from 'zod';
import { positiveIntStringSchema, trimmedStringSchema } from './commonSchemas';

export const animalTypeIdParamsSchema = z.object({
  typeId: positiveIntStringSchema,
});

export const animalTypeBodySchema = z.object({
  type: trimmedStringSchema,
});
