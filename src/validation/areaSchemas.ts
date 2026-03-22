import { z } from 'zod';
import { isoDateSchema, positiveIntStringSchema, trimmedStringSchema } from './commonSchemas';

export const areaPointSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const areaIdParamsSchema = z.object({
  areaId: positiveIntStringSchema,
});

export const areaBodySchema = z.object({
  name: trimmedStringSchema,
  areaPoints: z.array(areaPointSchema).min(3),
});

export const areaAnalyticsQuerySchema = z.object({
  startDate: isoDateSchema,
  endDate: isoDateSchema,
});
