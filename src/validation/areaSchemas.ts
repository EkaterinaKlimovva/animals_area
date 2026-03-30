import { z } from 'zod';
import {
  isoDateSchema,
  positiveIntStringSchema,
  trimmedStringSchema,
  coordinatesSchema,
} from './commonSchemas';

export const areaPointSchema = coordinatesSchema;

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
