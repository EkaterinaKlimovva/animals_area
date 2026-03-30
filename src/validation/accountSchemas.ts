import { z } from 'zod';
import {
  nonNegativeIntSchema,
  positiveIntStringSchema,
  trimmedStringSchema,
} from './commonSchemas';

export const registrationBodySchema = z.object({
  firstName: trimmedStringSchema,
  lastName: trimmedStringSchema,
  email: z.string().trim().email(),
  password: trimmedStringSchema,
});

export const createAccountBodySchema = registrationBodySchema.extend({
  role: z.enum(['ADMIN', 'CHIPPER', 'USER']),
});

export const updateAccountBodySchema = createAccountBodySchema;

export const accountIdParamsSchema = z.object({
  accountId: positiveIntStringSchema,
});

export const accountSearchQuerySchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  from: nonNegativeIntSchema.optional(),
  size: z.coerce.number().int().positive().optional(),
});
