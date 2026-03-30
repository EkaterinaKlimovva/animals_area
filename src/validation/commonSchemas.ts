import { z } from 'zod';
import { COORDINATE_LIMITS } from '../constants/validation';

export const positiveIntStringSchema = z.coerce.number().int().positive();
export const nonNegativeIntSchema = z.coerce.number().int().min(0);
export const positiveIntSchema = z.coerce.number().int().positive();
export const trimmedStringSchema = z.string().trim().min(1);
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/);

export const latitudeSchema = z.union([
  z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return (
        !isNaN(num) &&
        num >= COORDINATE_LIMITS.MIN_LATITUDE &&
        num <= COORDINATE_LIMITS.MAX_LATITUDE
      );
    },
    { message: 'Invalid latitude' },
  ),
  z.number().refine(
    (val) => {
      return (
        !isNaN(val) &&
        val >= COORDINATE_LIMITS.MIN_LATITUDE &&
        val <= COORDINATE_LIMITS.MAX_LATITUDE
      );
    },
    { message: 'Invalid latitude' },
  ),
]);

export const longitudeSchema = z.union([
  z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return (
        !isNaN(num) &&
        num >= COORDINATE_LIMITS.MIN_LONGITUDE &&
        num <= COORDINATE_LIMITS.MAX_LONGITUDE
      );
    },
    { message: 'Invalid longitude' },
  ),
  z.number().refine(
    (val) => {
      return (
        !isNaN(val) &&
        val >= COORDINATE_LIMITS.MIN_LONGITUDE &&
        val <= COORDINATE_LIMITS.MAX_LONGITUDE
      );
    },
    { message: 'Invalid longitude' },
  ),
]);

export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const emailSchema = z.string().email().trim();
export const passwordSchema = z.string().min(6);
