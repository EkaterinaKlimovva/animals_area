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