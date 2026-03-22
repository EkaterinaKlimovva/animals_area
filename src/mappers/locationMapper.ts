import { LocationPoint } from '@prisma/client';
import { LocationResponseDto } from '../types/location';

export const toLocationResponse = (location: LocationPoint): LocationResponseDto => ({
  id: location.id,
  latitude: location.latitude,
  longitude: location.longitude,
});
