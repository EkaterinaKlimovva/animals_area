import { Area } from '@prisma/client';
import { AreaPointDto, AreaResponseDto } from '../types/area';

export const toAreaResponse = (area: Area): AreaResponseDto => ({
  id: area.id,
  name: area.name,
  areaPoints: area.areaPoints as unknown as AreaPointDto[],
});
