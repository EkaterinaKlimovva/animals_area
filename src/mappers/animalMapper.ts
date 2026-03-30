import { AnimalVisitedLocation } from '@prisma/client';
import { AnimalWithDetails } from '../repositories/animalRepository';
import { AnimalResponseDto, VisitedLocationResponseDto } from '../types/animal';

export const toAnimalResponse = (
  animal: AnimalWithDetails,
): AnimalResponseDto => ({
  id: animal.id,
  animalTypes: animal.types.map((item) => item.animalType.id),
  weight: animal.weight,
  length: animal.length,
  height: animal.height,
  gender: animal.gender,
  lifeStatus: animal.lifeStatus,
  chippingDateTime: animal.chippingDateTime,
  chipperId: animal.chipperId,
  chippingLocationId: animal.chippingLocationId,
  visitedLocations: animal.visitedLocations.map((item) => item.id),
  deathDateTime: animal.deathDateTime,
});

export const toVisitedLocationResponse = (
  visitedLocation: AnimalVisitedLocation,
): VisitedLocationResponseDto => ({
  id: visitedLocation.id,
  dateTimeOfVisitLocationPoint: visitedLocation.dateTimeOfVisitLocation,
  locationPointId: visitedLocation.locationPointId,
});
