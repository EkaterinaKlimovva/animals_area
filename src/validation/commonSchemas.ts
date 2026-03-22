import { z } from 'zod';

export const positiveIntStringSchema = z.coerce.number().int().positive();
export const nonNegativeIntSchema = z.coerce.number().int().min(0);
export const positiveIntSchema = z.coerce.number().int().positive();
export const trimmedStringSchema = z.string().trim().min(1);
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
