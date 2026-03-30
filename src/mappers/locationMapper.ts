import { LocationPoint } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { LocationResponseDto } from '../types/location';

export const toLocationResponse = (
  location: LocationPoint,
): LocationResponseDto => {
  // Keep exact DB decimal representation to avoid precision loss in JS Number conversion
  const formatCoordinate = (value: Decimal): string => {
    return value.toString();
  };

  return {
    id: location.id,
    latitude: formatCoordinate(location.latitude),
    longitude: formatCoordinate(location.longitude),
  };
};
