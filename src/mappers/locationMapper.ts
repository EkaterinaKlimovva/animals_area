import { LocationPoint } from '@prisma/client';
import { LocationResponseDto } from '../types/location';

export const toLocationResponse = (location: LocationPoint): LocationResponseDto => ({
  id: location.id,
  latitude: parseFloat(location.latitude.toFixed(15)),
  longitude: parseFloat(location.longitude.toFixed(15)),
});
