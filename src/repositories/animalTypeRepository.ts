import { AnimalType } from '@prisma/client';
import prisma from '../../config/database';

export class AnimalTypeRepository {
  async create(data: { type: string }): Promise<AnimalType> {
    return prisma.animalType.create({
      data,
    });
  }

  async findById(id: number): Promise<AnimalType | null> {
    return prisma.animalType.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<AnimalType[]> {
    return prisma.animalType.findMany();
  }

  async update(id: number, data: Partial<{ type: string }>): Promise<AnimalType | null> {
    try {
      return await prisma.animalType.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async isUsedByAnimals(id: number): Promise<boolean> {
    const count = await prisma.animalTypeOnAnimal.count({
      where: { animalTypeId: id },
    });

    return count > 0;
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.animalType.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}