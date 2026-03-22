import { AnimalVisitedLocation, LifeStatus, Role } from '@prisma/client';
import { AnimalRepository, AnimalWithDetails, AnimalSearchParams } from '../repositories/animalRepository';
import { AccountRepository } from '../repositories/accountRepository';
import { LocationRepository } from '../repositories/locationRepository';
import { AnimalTypeRepository } from '../repositories/animalTypeRepository';
import { BadRequestError, NotFoundError, ConflictError } from '../errors/httpErrors';

export class AnimalService {
  private animalRepository: AnimalRepository;
  private accountRepository: AccountRepository;
  private locationRepository: LocationRepository;
  private animalTypeRepository: AnimalTypeRepository;

  constructor() {
    this.animalRepository = new AnimalRepository();
    this.accountRepository = new AccountRepository();
    this.locationRepository = new LocationRepository();
    this.animalTypeRepository = new AnimalTypeRepository();
  }

  private async validateAnimalData(data: {
    animalTypes: number[];
    weight: number;
    length: number;
    height: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    chipperId: number;
    chippingLocationId: number;
  }): Promise<void> {
    if (!Array.isArray(data.animalTypes) || data.animalTypes.length === 0) {
      throw new BadRequestError('animalTypes must contain at least one item');
    }
    if (data.animalTypes.some((typeId) => !typeId || typeId <= 0)) {
      throw new BadRequestError('Invalid animal type id');
    }
    if (data.weight <= 0) {
      throw new BadRequestError('Weight must be positive');
    }
    if (data.length <= 0) {
      throw new BadRequestError('Length must be positive');
    }
    if (data.height <= 0) {
      throw new BadRequestError('Height must be positive');
    }
    if (!['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      throw new BadRequestError('Invalid gender');
    }

    const chipper = await this.accountRepository.findById(data.chipperId);
    if (!chipper) {
      throw new NotFoundError('Chipper not found');
    }
    if (chipper.role !== Role.ADMIN && chipper.role !== Role.CHIPPER) {
      throw new NotFoundError('Chipper not found');
    }

    const location = await this.locationRepository.findById(data.chippingLocationId);
    if (!location) {
      throw new NotFoundError('Chipping location not found');
    }

    for (const typeId of data.animalTypes) {
      const type = await this.animalTypeRepository.findById(typeId);
      if (!type) {
        throw new NotFoundError('Animal type not found');
      }
    }
  }

  async createAnimal(data: {
    animalTypes: number[];
    weight: number;
    length: number;
    height: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    chipperId: number;
    chippingLocationId: number;
  }) {
    await this.validateAnimalData(data);
    return this.animalRepository.create({
      ...data,
      chippingDateTime: new Date(),
      lifeStatus: 'ALIVE',
    });
  }

  async getAnimalById(id: number): Promise<AnimalWithDetails | null> {
    return this.animalRepository.findById(id);
  }

  async getAnimals(params?: AnimalSearchParams) {
    return this.animalRepository.findAll(params);
  }

  async updateAnimal(id: number, data: Partial<{
    weight: number;
    length: number;
    height: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    lifeStatus: 'ALIVE' | 'DEAD';
    deathDateTime: Date | null;
    chipperId: number;
    chippingLocationId: number;
  }>) {
    const existingAnimal = await this.animalRepository.findById(id);
    if (!existingAnimal) {
      throw new NotFoundError('Animal not found');
    }

    if (data.weight !== undefined && data.weight <= 0) {
      throw new BadRequestError('Weight must be positive');
    }
    if (data.length !== undefined && data.length <= 0) {
      throw new BadRequestError('Length must be positive');
    }
    if (data.height !== undefined && data.height <= 0) {
      throw new BadRequestError('Height must be positive');
    }
    if (data.gender !== undefined && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      throw new BadRequestError('Invalid gender');
    }
    if (data.lifeStatus === 'ALIVE' && existingAnimal.lifeStatus === LifeStatus.DEAD) {
      throw new BadRequestError('Cannot change DEAD animal back to ALIVE');
    }
    if (data.chipperId !== undefined) {
      const chipper = await this.accountRepository.findById(data.chipperId);
      if (!chipper || (chipper.role !== Role.ADMIN && chipper.role !== Role.CHIPPER)) {
        throw new NotFoundError('Chipper not found');
      }
    }
    if (data.chippingLocationId !== undefined) {
      const location = await this.locationRepository.findById(data.chippingLocationId);
      if (!location) {
        throw new NotFoundError('Chipping location not found');
      }
      const firstVisited = existingAnimal.visitedLocations[0]?.locationPoint.id;
      if (firstVisited && firstVisited === data.chippingLocationId) {
        throw new BadRequestError('Chipping location cannot equal first visited location');
      }
    }

    if (data.lifeStatus === 'DEAD' && existingAnimal.lifeStatus !== LifeStatus.DEAD) {
      data.deathDateTime = new Date();
    }

    return this.animalRepository.update(id, data);
  }

  async deleteAnimal(id: number): Promise<boolean> {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }
    if (animal.visitedLocations.length > 0) {
      const firstVisited = animal.visitedLocations[0].locationPoint.id;
      if (firstVisited !== animal.chippingLocation.id || animal.visitedLocations.length > 1) {
        throw new BadRequestError('Animal has visited locations and cannot be deleted');
      }
    }
    return this.animalRepository.delete(id);
  }

  async addTypeToAnimal(animalId: number, typeId: number) {
    const animal = await this.animalRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    const type = await this.animalTypeRepository.findById(typeId);
    if (!type) {
      throw new NotFoundError('Animal type not found');
    }

    const existingType = animal.types.find((item) => item.animalType.id === typeId);
    if (existingType) {
      throw new ConflictError('Animal already has this type');
    }

    return this.animalRepository.addType(animalId, typeId);
  }

  async removeTypeFromAnimal(animalId: number, typeId: number) {
    const animal = await this.animalRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }
    if (animal.types.length === 1 && animal.types[0].animalType.id === typeId) {
      throw new BadRequestError('Animal must have at least one type');
    }

    const existingType = animal.types.find((item) => item.animalType.id === typeId);
    if (!existingType) {
      throw new NotFoundError('Animal does not have this type');
    }

    return this.animalRepository.removeType(animalId, typeId);
  }

  async updateAnimalTypes(animalId: number, oldTypeId: number, newTypeId: number) {
    const animal = await this.animalRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    const oldTypeExists = animal.types.some((item) => item.animalType.id === oldTypeId);
    if (!oldTypeExists) {
      throw new NotFoundError('Old animal type not found');
    }

    const newType = await this.animalTypeRepository.findById(newTypeId);
    if (!newType) {
      throw new NotFoundError('New animal type not found');
    }

    const newTypeExists = animal.types.some((item) => item.animalType.id === newTypeId);
    if (newTypeExists) {
      throw new ConflictError('Animal already has new type');
    }

    return this.animalRepository.replaceType(animalId, oldTypeId, newTypeId);
  }

  async getAnimalVisitedLocations(animalId: number, options?: { startDateTime?: Date; endDateTime?: Date; from?: number; size?: number }): Promise<AnimalVisitedLocation[]> {
    const animal = await this.animalRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    return this.animalRepository.getVisitedLocations(animalId, options);
  }

  async addVisitedLocation(animalId: number, data: {
    locationPointId: number;
    dateTimeOfVisitLocation: Date;
    visitedByAccountId?: number;
  }): Promise<AnimalVisitedLocation> {
    const animal = await this.animalRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }
    if (animal.lifeStatus === LifeStatus.DEAD) {
      throw new BadRequestError('Dead animal cannot visit locations');
    }

    const location = await this.locationRepository.findById(data.locationPointId);
    if (!location) {
      throw new NotFoundError('Location not found');
    }

    if (data.visitedByAccountId) {
      const account = await this.accountRepository.findById(data.visitedByAccountId);
      if (!account) {
        throw new NotFoundError('Account not found');
      }
    }

    if (animal.visitedLocations.length === 0 && animal.chippingLocation.id === data.locationPointId) {
      throw new BadRequestError('Cannot add chipping location as first visited location');
    }

    const currentLocationId = animal.visitedLocations.length > 0
      ? animal.visitedLocations[animal.visitedLocations.length - 1].locationPoint.id
      : animal.chippingLocation.id;
    if (currentLocationId === data.locationPointId) {
      throw new BadRequestError('Animal is already at this location');
    }

    return this.animalRepository.addVisitedLocation({ animalId, ...data });
  }

  async updateVisitedLocation(animalId: number, visitedLocationId: number, data: Partial<{
    locationPointId: number;
    dateTimeOfVisitLocation: Date;
  }>): Promise<AnimalVisitedLocation | null> {
    const animal = await this.animalRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    const visitedLocation = animal.visitedLocations.find(vl => vl.id === visitedLocationId);
    if (!visitedLocation) {
      throw new NotFoundError('Visited location not found for this animal');
    }

    if (data.locationPointId) {
      const location = await this.locationRepository.findById(data.locationPointId);
      if (!location) {
        throw new NotFoundError('Location not found');
      }

      const visitedLocations = animal.visitedLocations;
      const currentIndex = visitedLocations.findIndex((vl) => vl.id === visitedLocationId);
      const previousLocationId = currentIndex === 0 ? animal.chippingLocation.id : visitedLocations[currentIndex - 1].locationPoint.id;
      const nextLocationId = currentIndex < visitedLocations.length - 1 ? visitedLocations[currentIndex + 1].locationPoint.id : undefined;

      if (currentIndex === 0 && data.locationPointId === animal.chippingLocation.id) {
        throw new BadRequestError('First visited location cannot be equal to chipping location');
      }
      if (data.locationPointId === visitedLocation.locationPoint.id) {
        throw new BadRequestError('Visited location must actually change');
      }
      if (data.locationPointId === previousLocationId || data.locationPointId === nextLocationId) {
        throw new BadRequestError('Visited location duplicates adjacent location');
      }
    }

    return this.animalRepository.updateVisitedLocation(visitedLocationId, data);
  }

  async deleteVisitedLocation(animalId: number, visitedLocationId: number): Promise<boolean> {
    const animal = await this.animalRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    const visitedLocation = animal.visitedLocations.find(vl => vl.id === visitedLocationId);
    if (!visitedLocation) {
      throw new NotFoundError('Visited location not found for this animal');
    }

    const index = animal.visitedLocations.findIndex((vl) => vl.id === visitedLocationId);
    await this.animalRepository.deleteVisitedLocation(visitedLocationId);

    if (index === 0 && animal.visitedLocations.length > 1) {
      const second = animal.visitedLocations[1];
      if (second.locationPoint.id === animal.chippingLocation.id) {
        await this.animalRepository.deleteVisitedLocation(second.id);
      }
    }

    return true;
  }
}