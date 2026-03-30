import { Area } from '@prisma/client';
import { AreaPointDto, AreaResponseDto } from '../types/area';
import { AreaPoint } from '../utils/areaGeometry';

export const toAreaResponse = (area: Area): AreaResponseDto => ({
  id: area.id,
  name: area.name,
  areaPoints: (area.areaPoints as unknown as AreaPoint[]).map(point => ({
    latitude: point.latitude.toString(),
    longitude: point.longitude.toString(),
  })),
});
