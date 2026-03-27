import { z } from 'zod';
import { COORDINATE_LIMITS } from '../constants/validation';

export const positiveIntStringSchema = z.coerce.number().int().positive();
export const nonNegativeIntSchema = z.coerce.number().int().min(0);
export const positiveIntSchema = z.coerce.number().int().positive();
export const trimmedStringSchema = z.string().trim().min(1);
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/);

export const latitudeSchema = z.coerce.number().min(COORDINATE_LIMITS.MIN_LATITUDE).max(COORDINATE_LIMITS.MAX_LATITUDE);
export const longitudeSchema = z.coerce.number().min(COORDINATE_LIMITS.MIN_LONGITUDE).max(COORDINATE_LIMITS.MAX_LONGITUDE);

export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const emailSchema = z.string().email().trim();
export const passwordSchema = z.string().min(6);
