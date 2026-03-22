import { Gender, LifeStatus } from '@prisma/client';
import { PaginationQueryDto } from './common';

export interface CreateAnimalRequestDto {
  animalTypes: number[];
  weight: number;
  length: number;
  height: number;
  gender: Gender;
  chipperId: number;
  chippingLocationId: number;
}

export interface UpdateAnimalRequestDto {
  weight?: number;
  length?: number;
  height?: number;
  gender?: Gender;
  lifeStatus?: LifeStatus;
  chipperId?: number;
  chippingLocationId?: number;
}

export interface UpdateAnimalTypesRequestDto {
  oldTypeId: number;
  newTypeId: number;
}

export interface UpdateVisitedLocationRequestDto {
  visitedLocationPointId: number;
  locationPointId: number;
}

export interface AnimalSearchQueryDto extends PaginationQueryDto {
  startDateTime?: string;
  endDateTime?: string;
  chipperId?: number;
  chippingLocationId?: number;
  lifeStatus?: LifeStatus;
  gender?: Gender;
}

export interface AnimalVisitedLocationsQueryDto extends PaginationQueryDto {
  startDateTime?: string;
  endDateTime?: string;
}

export interface AnimalResponseDto {
  id: number;
  animalTypes: number[];
  weight: number;
  length: number;
  height: number;
  gender: Gender;
  lifeStatus: LifeStatus;
  chippingDateTime: Date;
  chipperId: number;
  chippingLocationId: number;
  visitedLocations: number[];
  deathDateTime: Date | null;
}

export interface VisitedLocationResponseDto {
  id: number;
  dateTimeOfVisitLocationPoint: Date;
  locationPointId: number;
}
