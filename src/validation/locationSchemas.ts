import { z } from 'zod';
import { positiveIntStringSchema } from './commonSchemas';

export const locationIdParamsSchema = z.object({
  locationId: positiveIntStringSchema,
});

export const locationBodySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const geohashQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
