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
    // Получаем уникальные animalIds, которые посещали зону в периоде
    const animalIdsInPeriod = await prisma.animalVisitedLocation.findMany({
      where: {
        areaId: areaId,
        dateTimeOfVisitLocation: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        animalId: true,
      },
      distinct: ['animalId'],
    });

    const animalIds = animalIdsInPeriod.map(v => v.animalId);

    if (animalIds.length === 0) {
      return {
        totalQuantityAnimals: 0,
        totalAnimalsArrived: 0,
        totalAnimalsGone: 0,
        animalsAnalytics: [],
      };
    }

    // Получаем все посещения этих животных в зоне
    const allVisits = await prisma.animalVisitedLocation.findMany({
      where: {
        areaId: areaId,
        animalId: { in: animalIds },
      },
      select: {
        animalId: true,
        dateTimeOfVisitLocation: true,
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
      orderBy: {
        dateTimeOfVisitLocation: 'asc',
      },
    });

    // Группируем посещения по животным, определяя общее первое и последнее посещение
    const visitsByAnimal = new Map<number, { firstVisit: Date; lastVisit: Date; types: { id: number; type: string }[] }>();

    for (const visit of allVisits) {
      const animalId = visit.animalId;
      const types = visit.animal.types.map(t => ({ id: t.animalType.id, type: t.animalType.type }));

      if (!visitsByAnimal.has(animalId)) {
        visitsByAnimal.set(animalId, {
          firstVisit: visit.dateTimeOfVisitLocation,
          lastVisit: visit.dateTimeOfVisitLocation,
          types,
        });
      } else {
        const data = visitsByAnimal.get(animalId)!;
        if (visit.dateTimeOfVisitLocation < data.firstVisit) {
          data.firstVisit = visit.dateTimeOfVisitLocation;
        }
        if (visit.dateTimeOfVisitLocation > data.lastVisit) {
          data.lastVisit = visit.dateTimeOfVisitLocation;
        }
      }
    }

    // Подсчитываем уникальных животных
    const uniqueAnimalIds = [...visitsByAnimal.keys()];
    const totalQuantityAnimals = uniqueAnimalIds.length;

    // Определяем животных, которые вошли в зону в указанный период
    // (первое посещение зоны в периоде)
    const arrivedAnimalIds = new Set<number>();
    for (const [animalId, visits] of visitsByAnimal.entries()) {
      // Проверяем, что первое посещение в периоде
      if (visits.firstVisit >= startDate && visits.firstVisit <= endDate) {
        arrivedAnimalIds.add(animalId);
      }
    }

    // Определяем животных, которые вышли из зоны в указанный период
    // (последнее посещение зоны в периоде)
    const goneAnimalIds = new Set<number>();
    for (const [animalId, visits] of visitsByAnimal.entries()) {
      // Проверяем, что последнее посещение в периоде
      if (visits.lastVisit >= startDate && visits.lastVisit <= endDate) {
        goneAnimalIds.add(animalId);
      }
    }

    // Группируем по типам животных
    const analyticsByType = new Map<number, { animalType: string; quantityAnimals: Set<number>; animalsArrived: Set<number>; animalsGone: Set<number> }>();

    for (const [animalId, visits] of visitsByAnimal.entries()) {
      for (const type of visits.types) {
        const stats = analyticsByType.get(type.id) ?? {
          animalType: type.type,
          quantityAnimals: new Set<number>(),
          animalsArrived: new Set<number>(),
          animalsGone: new Set<number>(),
        };

        stats.quantityAnimals.add(animalId);
        
        if (arrivedAnimalIds.has(animalId)) {
          stats.animalsArrived.add(animalId);
        }
        
        if (goneAnimalIds.has(animalId)) {
          stats.animalsGone.add(animalId);
        }

        analyticsByType.set(type.id, stats);
      }
    }

    const animalsAnalytics = [...analyticsByType.entries()].map(([animalTypeId, stats]) => ({
      animalType: stats.animalType,
      animalTypeId,
      quantityAnimals: stats.quantityAnimals.size,
      animalsArrived: stats.animalsArrived.size,
      animalsGone: stats.animalsGone.size,
    }));

    return {
      totalQuantityAnimals,
      totalAnimalsArrived: arrivedAnimalIds.size,
      totalAnimalsGone: goneAnimalIds.size,
      animalsAnalytics: animalsAnalytics.sort((left, right) => left.animalTypeId - right.animalTypeId),
    };
  }
}