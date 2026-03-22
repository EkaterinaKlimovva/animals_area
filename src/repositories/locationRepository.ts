import { LocationPoint } from '@prisma/client';
import prisma from '../../config/database';

export class LocationRepository {
  async create(data: { latitude: number; longitude: number; areaId?: number }): Promise<LocationPoint> {
    return prisma.locationPoint.create({
      data,
    });
  }

  async findById(id: number): Promise<LocationPoint | null> {
    return prisma.locationPoint.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<LocationPoint[]> {
    return prisma.locationPoint.findMany();
  }

  async findByCoordinates(latitude: number, longitude: number): Promise<LocationPoint | null> {
    return prisma.locationPoint.findFirst({
      where: { latitude, longitude },
    });
  }

  async update(id: number, data: Partial<{ latitude: number; longitude: number; areaId?: number | null }>): Promise<LocationPoint | null> {
    try {
      return await prisma.locationPoint.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async isUsedByAnimals(id: number): Promise<boolean> {
    const [chippingCount, visitedCount] = await Promise.all([
      prisma.animal.count({ where: { chippingLocationId: id } }),
      prisma.animalVisitedLocation.count({ where: { locationPointId: id } }),
    ]);

    return chippingCount > 0 || visitedCount > 0;
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.locationPoint.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}