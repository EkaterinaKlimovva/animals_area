import { Area, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AreaPoint } from '../utils/areaGeometry';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';
import { point as turfPoint, polygon as turfPolygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

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

  async update(
    id: number,
    data: Partial<{ name: string; areaPoints: AreaPoint[] }>,
  ): Promise<Area | null> {
    try {
      const updateData: { name?: string; areaPoints?: Prisma.InputJsonValue } =
        {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.areaPoints !== undefined) {
        updateData.areaPoints =
          data.areaPoints as unknown as Prisma.InputJsonValue;
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

  async getAreaAnalytics(
    areaId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<AreaAnalytics> {
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

    const areaPoints = area.areaPoints as unknown as AreaPoint[];
    const polygon = turfPolygon([
      [
        ...areaPoints.map((p) => [Number(p.longitude), Number(p.latitude)]),
        [Number(areaPoints[0].longitude), Number(areaPoints[0].latitude)],
      ],
    ]);

    const isInsideArea = (latitude: number, longitude: number): boolean => {
      return booleanPointInPolygon(turfPoint([longitude, latitude]), polygon, {
        ignoreBoundary: false,
      });
    };

    const animals = await prisma.animal.findMany({
      where: {
        chippingDateTime: { lte: endDate },
      },
      select: {
        id: true,
        chippingDateTime: true,
        chippingLocation: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
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
        visitedLocations: {
          where: {
            dateTimeOfVisitLocation: { lte: endDate },
          },
          orderBy: {
            dateTimeOfVisitLocation: 'asc',
          },
          select: {
            dateTimeOfVisitLocation: true,
            locationPoint: {
              select: {
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    let totalQuantityAnimals = 0;
    let totalAnimalsArrived = 0;
    let totalAnimalsGone = 0;

    const analyticsByType = new Map<
      number,
      {
        animalType: string;
        quantityAnimals: number;
        animalsArrived: number;
        animalsGone: number;
      }
    >();

    for (const animal of animals) {
      const timeline: { time: Date; inside: boolean }[] = [];

      const chipLat = Number(animal.chippingLocation.latitude);
      const chipLon = Number(animal.chippingLocation.longitude);
      timeline.push({
        time: animal.chippingDateTime,
        inside: isInsideArea(chipLat, chipLon),
      });

      for (const visit of animal.visitedLocations) {
        timeline.push({
          time: visit.dateTimeOfVisitLocation,
          inside: isInsideArea(
            Number(visit.locationPoint.latitude),
            Number(visit.locationPoint.longitude),
          ),
        });
      }

      timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

      let currentInside = timeline[0].inside;
      let arrived = false;
      let gone = false;

      for (let i = 1; i < timeline.length; i += 1) {
        const prevInside = currentInside;
        const nextInside = timeline[i].inside;
        const eventTime = timeline[i].time;

        if (eventTime >= startDate && eventTime <= endDate) {
          if (!prevInside && nextInside) {
            arrived = true;
          }
          if (prevInside && !nextInside) {
            gone = true;
          }
        }

        currentInside = nextInside;
      }

      if (currentInside) {
        totalQuantityAnimals++;
      }
      if (arrived) {
        totalAnimalsArrived++;
      }
      if (gone) {
        totalAnimalsGone++;
      }

      for (const relation of animal.types) {
        const type = relation.animalType;
        const stats = analyticsByType.get(type.id) ?? {
          animalType: type.type,
          quantityAnimals: 0,
          animalsArrived: 0,
          animalsGone: 0,
        };

        if (currentInside) {
          stats.quantityAnimals++;
        }
        if (arrived) {
          stats.animalsArrived++;
        }
        if (gone) {
          stats.animalsGone++;
        }

        analyticsByType.set(type.id, stats);
      }
    }

    const animalsAnalytics = [...analyticsByType.entries()]
      .map(([animalTypeId, stats]) => ({
        animalType: stats.animalType,
        animalTypeId,
        quantityAnimals: stats.quantityAnimals,
        animalsArrived: stats.animalsArrived,
        animalsGone: stats.animalsGone,
      }))
      .filter(
        (stats) =>
          stats.quantityAnimals > 0 ||
          stats.animalsArrived > 0 ||
          stats.animalsGone > 0,
      )
      .sort((left, right) => left.animalTypeId - right.animalTypeId);

    return {
      totalQuantityAnimals,
      totalAnimalsArrived,
      totalAnimalsGone,
      animalsAnalytics,
    };
  }
}
