import { AnimalType } from '@prisma/client';
import { AnimalTypeResponseDto } from '../types/animalType';

export const toAnimalTypeResponse = (
  animalType: AnimalType,
): AnimalTypeResponseDto => ({
  id: animalType.id,
  type: animalType.type,
});
