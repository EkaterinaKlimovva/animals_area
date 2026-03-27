import { LocationPoint } from '@prisma/client';
import { LocationResponseDto } from '../types/location';

export const toLocationResponse = (location: LocationPoint): LocationResponseDto => ({
  id: location.id,
  latitude: parseFloat(location.latitude.toPrecision(18)),
  longitude: parseFloat(location.longitude.toPrecision(18)),
});
