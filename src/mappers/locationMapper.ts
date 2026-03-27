import { LocationPoint } from '@prisma/client';
import { LocationResponseDto } from '../types/location';

export const toLocationResponse = (location: LocationPoint): LocationResponseDto => {
  // Convert to string first to preserve precision, then to number
  const latStr = location.latitude.toString();
  const lngStr = location.longitude.toString();
  
  // Use toFixed to ensure we get the expected precision
  const latFixed = parseFloat(latStr).toFixed(15);
  const lngFixed = parseFloat(lngStr).toFixed(15);
  
  return {
    id: location.id,
    latitude: parseFloat(latFixed),
    longitude: parseFloat(lngFixed),
  };
};
