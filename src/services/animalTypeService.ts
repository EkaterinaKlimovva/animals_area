import { AnimalType } from '@prisma/client';
import { AnimalTypeRepository } from '../repositories/animalTypeRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/httpErrors';

export class AnimalTypeService {
  private animalTypeRepository: AnimalTypeRepository;

  constructor() {
    this.animalTypeRepository = new AnimalTypeRepository();
  }

  private async validateTypeUniqueness(type: string, excludeId?: number): Promise<void> {
    const existing = await this.animalTypeRepository.findAll();
    const duplicate = existing.find(t => t.type.toLowerCase() === type.toLowerCase() && t.id !== excludeId);
    if (duplicate) {
      throw new ConflictError('Animal type already exists');
    }
  }

  async createAnimalType(data: { type: string }): Promise<AnimalType> {
    if (!data.type || data.type.trim().length === 0) {
      throw new BadRequestError('Type is required');
    }
    await this.validateTypeUniqueness(data.type);
    return this.animalTypeRepository.create({ type: data.type.trim() });
  }

  async getAnimalTypeById(id: number): Promise<AnimalType | null> {
    return this.animalTypeRepository.findById(id);
  }

  async getAllAnimalTypes(): Promise<AnimalType[]> {
    return this.animalTypeRepository.findAll();
  }

  async updateAnimalType(id: number, data: Partial<{ type: string }>): Promise<AnimalType | null> {
    if (data.type !== undefined) {
      if (!data.type || data.type.trim().length === 0) {
        throw new BadRequestError('Type is required');
      }
      await this.validateTypeUniqueness(data.type, id);
      return this.animalTypeRepository.update(id, { type: data.type.trim() });
    }
    return this.animalTypeRepository.update(id, data);
  }

  async deleteAnimalType(id: number): Promise<boolean> {
    const existing = await this.animalTypeRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Animal type not found');
    }

    const linkedToAnimals = await this.animalTypeRepository.isUsedByAnimals(id);
    if (linkedToAnimals) {
      throw new BadRequestError('Animal type is used by animals');
    }

    return this.animalTypeRepository.delete(id);
  }
}