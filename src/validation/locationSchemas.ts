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
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
}).refine(
  (data) => (data.lat !== undefined && data.lng !== undefined) || 
            (data.latitude !== undefined && data.longitude !== undefined),
  {
    message: "Either 'lat'/'lng' or 'latitude'/'longitude' must be provided",
  }
);
