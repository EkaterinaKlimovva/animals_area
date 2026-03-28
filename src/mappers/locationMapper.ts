import { LocationPoint } from '@prisma/client';
import { LocationResponseDto } from '../types/location';

export const toLocationResponse = (location: LocationPoint): LocationResponseDto => {
  // Convert to string first to preserve precision, then to number
  const latStr = location.latitude.toString();
  const lngStr = location.longitude.toString();

  return {
    id: location.id,
    latitude: Number(latStr),
    longitude: Number(lngStr),
  };
};
