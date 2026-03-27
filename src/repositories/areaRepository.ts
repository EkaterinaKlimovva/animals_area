import { Area, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AreaPoint } from '../utils/areaGeometry';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';

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
    if (areaId <= 0) {
      throw new BadRequestError('Invalid area ID');
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestError('Invalid analytics period');
    }
    if (startDate >= endDate) {
      throw new BadRequestError('startDate must be before endDate');
    }

    const area = await this.findById(areaId);
    if (!area) {
      throw new NotFoundError('Area not found');
    }

    // Получаем уникальные animalIds, которые посещали зону в указанный период
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

    // Получаем все посещения этих животных в данной зоне (всех времен)
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

    // Группируем по животным, собирая типы и определяя наличие посещений до и после периода
    const visitsByAnimal = new Map<number, { 
      types: { id: number; type: string }[]; 
      hasBefore: boolean; 
      hasAfter: boolean 
    }>();

    for (const visit of allVisits) {
      const animalId = visit.animalId;
      const types = visit.animal.types.map(t => ({ id: t.animalType.id, type: t.animalType.type }));

      if (!visitsByAnimal.has(animalId)) {
        visitsByAnimal.set(animalId, { types, hasBefore: false, hasAfter: false });
      }

      const data = visitsByAnimal.get(animalId)!;
      const visitTime = visit.dateTimeOfVisitLocation;

      if (visitTime < startDate) {
        data.hasBefore = true;
      }
      if (visitTime > endDate) {
        data.hasAfter = true;
      }
    }

    // Подсчитываем уникальных животных
    const totalQuantityAnimals = visitsByAnimal.size;

    // Определяем прибывших (те, у кого НЕТ посещений до периода)
    const arrivedAnimalIds = new Set<number>();
    // Определяем убывших (те, у кого НЕТ посещений после периода)
    const goneAnimalIds = new Set<number>();

    for (const [animalId, data] of visitsByAnimal.entries()) {
      if (!data.hasBefore) {
        arrivedAnimalIds.add(animalId);
      }
      if (!data.hasAfter) {
        goneAnimalIds.add(animalId);
      }
    }

    // Группируем по типам животных
    const analyticsByType = new Map<number, { animalType: string; quantityAnimals: Set<number>; animalsArrived: Set<number>; animalsGone: Set<number> }>();

    for (const [animalId, data] of visitsByAnimal.entries()) {
      for (const type of data.types) {
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
