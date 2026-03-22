import { Animal, AnimalVisitedLocation, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export interface AnimalWithDetails extends Animal {
  chipper: {
    id: number;
    firstName: string;
    lastName: string;
  };
  chippingLocation: {
    id: number;
    latitude: number;
    longitude: number;
  };
  types: {
    animalType: {
      id: number;
      type: string;
    };
  }[];
  visitedLocations: {
    id: number;
    dateTimeOfVisitLocation: Date;
    locationPoint: {
      id: number;
      latitude: number;
      longitude: number;
    };
  }[];
}

export interface AnimalSearchParams {
  startDateTime?: Date;
  endDateTime?: Date;
  chipperId?: number;
  chippingLocationId?: number;
  lifeStatus?: 'ALIVE' | 'DEAD';
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  from?: number;
  size?: number;
}

export class AnimalRepository {
  async create(data: {
    animalTypes: number[];
    weight: number;
    length: number;
    height: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    chippingDateTime: Date;
    chipperId: number;
    chippingLocationId: number;
    lifeStatus?: 'ALIVE' | 'DEAD';
  }): Promise<AnimalWithDetails> {
    const { animalTypes, ...animalData } = data;

    const created = await prisma.animal.create({
      data: {
        ...animalData,
        types: {
          create: animalTypes.map((animalTypeId) => ({ animalTypeId })),
        },
      },
    });

    return this.findById(created.id) as Promise<AnimalWithDetails>;
  }

  async findById(id: number): Promise<AnimalWithDetails | null> {
    return prisma.animal.findUnique({
      where: { id },
      include: {
        chipper: {
          select: { id: true, firstName: true, lastName: true },
        },
        chippingLocation: {
          select: { id: true, latitude: true, longitude: true },
        },
        types: {
          include: {
            animalType: {
              select: { id: true, type: true },
            },
          },
        },
        visitedLocations: {
          select: {
            id: true,
            dateTimeOfVisitLocation: true,
            locationPoint: {
              select: { id: true, latitude: true, longitude: true },
            },
          },
          orderBy: { dateTimeOfVisitLocation: 'asc' },
        },
      },
    }) as Promise<AnimalWithDetails | null>;
  }

  async findAll(params?: AnimalSearchParams): Promise<AnimalWithDetails[]> {
    const where: Prisma.AnimalWhereInput = {};

    if (params?.startDateTime || params?.endDateTime) {
      where.chippingDateTime = {};
      if (params.startDateTime) where.chippingDateTime.gte = params.startDateTime;
      if (params.endDateTime) where.chippingDateTime.lte = params.endDateTime;
    }

    if (params?.chipperId) where.chipperId = params.chipperId;
    if (params?.chippingLocationId) where.chippingLocationId = params.chippingLocationId;
    if (params?.lifeStatus) where.lifeStatus = params.lifeStatus;
    if (params?.gender) where.gender = params.gender;

    const animals = await prisma.animal.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: params?.from ?? 0,
      take: params?.size ?? 10,
    });

    return Promise.all(animals.map((animal) => this.findById(animal.id) as Promise<AnimalWithDetails>));
  }

  async update(
    id: number,
    data: Partial<{
      weight: number;
      length: number;
      height: number;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      lifeStatus: 'ALIVE' | 'DEAD';
      deathDateTime: Date | null;
      chipperId: number;
      chippingLocationId: number;
    }>,
  ): Promise<AnimalWithDetails | null> {
    try {
      const animal = await prisma.animal.update({
        where: { id },
        data,
      });
      return this.findById(animal.id);
    } catch {
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.animal.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async addType(animalId: number, typeId: number): Promise<AnimalWithDetails> {
    await prisma.animalTypeOnAnimal.create({
      data: {
        animalId,
        animalTypeId: typeId,
      },
    });

    return this.findById(animalId) as Promise<AnimalWithDetails>;
  }

  async removeType(animalId: number, typeId: number): Promise<AnimalWithDetails | null> {
    try {
      await prisma.animalTypeOnAnimal.delete({
        where: {
          animalId_animalTypeId: {
            animalId,
            animalTypeId: typeId,
          },
        },
      });
      return this.findById(animalId);
    } catch {
      return null;
    }
  }

  async replaceType(animalId: number, oldTypeId: number, newTypeId: number): Promise<AnimalWithDetails | null> {
    try {
      await prisma.animalTypeOnAnimal.delete({
        where: {
          animalId_animalTypeId: {
            animalId,
            animalTypeId: oldTypeId,
          },
        },
      });

      await prisma.animalTypeOnAnimal.create({
        data: {
          animalId,
          animalTypeId: newTypeId,
        },
      });

      return this.findById(animalId);
    } catch {
      return null;
    }
  }

  async getVisitedLocations(
    animalId: number,
    options?: { startDateTime?: Date; endDateTime?: Date; from?: number; size?: number },
  ): Promise<AnimalVisitedLocation[]> {
    return prisma.animalVisitedLocation.findMany({
      where: {
        animalId,
        ...(options?.startDateTime || options?.endDateTime
          ? {
              dateTimeOfVisitLocation: {
                ...(options.startDateTime ? { gte: options.startDateTime } : {}),
                ...(options.endDateTime ? { lte: options.endDateTime } : {}),
              },
            }
          : {}),
      },
      include: {
        locationPoint: true,
        visitedByAccount: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { dateTimeOfVisitLocation: 'asc' },
      skip: options?.from ?? 0,
      take: options?.size ?? 10,
    });
  }

  async addVisitedLocation(data: {
    animalId: number;
    locationPointId: number;
    dateTimeOfVisitLocation: Date;
    visitedByAccountId?: number;
  }): Promise<AnimalVisitedLocation> {
    return prisma.animalVisitedLocation.create({ data });
  }

  async findVisitedLocationById(id: number): Promise<AnimalVisitedLocation | null> {
    return prisma.animalVisitedLocation.findUnique({ where: { id } });
  }

  async updateVisitedLocation(
    id: number,
    data: Partial<{
      locationPointId: number;
      dateTimeOfVisitLocation: Date;
    }>,
  ): Promise<AnimalVisitedLocation | null> {
    try {
      return await prisma.animalVisitedLocation.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async deleteVisitedLocation(id: number): Promise<boolean> {
    try {
      await prisma.animalVisitedLocation.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}