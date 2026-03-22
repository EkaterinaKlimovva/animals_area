import { Area, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AreaPoint } from '../utils/areaGeometry';

export interface AreaAnalytics {
  totalQuantityAnimals: number;
  totalAnimalsArrived: number;
  totalAnimalsGone: number;
  animalsAnalytics: {
    animalType: string;
    animalTypeId: number;
    quantityAnimals: number;
    animalsArrived: number;
    animalsGone: number;
  }[];
}

export class AreaRepository {
  async create(data: { name: string; areaPoints: AreaPoint[] }): Promise<Area> {
    return prisma.area.create({
      data: {
        name: data.name,
        areaPoints: data.areaPoints as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findById(id: number): Promise<Area | null> {
    return prisma.area.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Area[]> {
    return prisma.area.findMany({ orderBy: { id: 'asc' } });
  }

  async update(id: number, data: Partial<{ name: string; areaPoints: AreaPoint[] }>): Promise<Area | null> {
    try {
      const updateData: { name?: string; areaPoints?: Prisma.InputJsonValue } = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.areaPoints !== undefined) {
        updateData.areaPoints = data.areaPoints as unknown as Prisma.InputJsonValue;
      }

      return await prisma.area.update({
        where: { id },
        data: updateData,
      });
    } catch {
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.area.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getAreaAnalytics(areaId: number, startDate: Date, endDate: Date): Promise<AreaAnalytics> {
    const visitsInArea = await prisma.animalVisitedLocation.findMany({
      where: {
        areaId: areaId,
        dateTimeOfVisitLocation: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        animalId: true,
        animal: {
          select: {
            types: {
              select: {
                animalType: {
                  select: {
                    id: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const animalIdsInArea = [...new Set(visitsInArea.map((visit) => visit.animalId))];

    const departuresCount = await prisma.animalVisitedLocation.groupBy({
      by: ['animalId'],
      where: {
        animalId: {
          in: animalIdsInArea,
        },
        areaId: {
          not: areaId,
        },
        dateTimeOfVisitLocation: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        animalId: true,
      },
    }).then((groups) => groups.length);

    const arrivalsByAnimalType = new Map<number, { animalType: string; quantityAnimalIds: Set<number>; arrivedAnimalIds: Set<number> }>();

    for (const visit of visitsInArea) {
      for (const animalTypeRelation of visit.animal.types) {
        const animalType = animalTypeRelation.animalType;
        const stats = arrivalsByAnimalType.get(animalType.id) ?? {
          animalType: animalType.type,
          quantityAnimalIds: new Set<number>(),
          arrivedAnimalIds: new Set<number>(),
        };

        stats.quantityAnimalIds.add(visit.animalId);
        stats.arrivedAnimalIds.add(visit.animalId);
        arrivalsByAnimalType.set(animalType.id, stats);
      }
    }

    const animalsGoneByType = await prisma.animalTypeOnAnimal.groupBy({
      by: ['animalTypeId'],
      where: {
        animalId: {
          in: animalIdsInArea,
        },
        animal: {
          visitedLocations: {
            some: {
              areaId: { not: areaId },
              dateTimeOfVisitLocation: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      },
      _count: {
        animalId: true,
      },
    });

    const animalsAnalytics = await Promise.all(
      [...arrivalsByAnimalType.entries()].map(async ([animalTypeId, stats]) => {
        const gone = animalsGoneByType.find((item) => item.animalTypeId === animalTypeId)?._count.animalId ?? 0;

        return {
          animalType: stats.animalType,
          animalTypeId,
          quantityAnimals: stats.quantityAnimalIds.size,
          animalsArrived: stats.arrivedAnimalIds.size,
          animalsGone: gone,
        };
      }),
    );

    return {
      totalQuantityAnimals: animalIdsInArea.length,
      totalAnimalsArrived: animalIdsInArea.length,
      totalAnimalsGone: departuresCount,
      animalsAnalytics: animalsAnalytics.sort((left, right) => left.animalTypeId - right.animalTypeId),
    };
  }
}