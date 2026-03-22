import { Area } from '@prisma/client';
import { AreaRepository, AreaAnalytics } from '../repositories/areaRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/httpErrors';
import { arePolygonsEquivalent, AreaPoint, validateAreaPoints } from '../utils/areaGeometry';

export class AreaService {
  private areaRepository: AreaRepository;

  constructor() {
    this.areaRepository = new AreaRepository();
  }

  private async validateAreaForSave(areaPoints: AreaPoint[], currentAreaId?: number): Promise<void> {
    validateAreaPoints(areaPoints);

    const existingAreas = await this.areaRepository.findAll();
    for (const area of existingAreas) {
      if (currentAreaId && area.id === currentAreaId) {
        continue;
      }

      const existingPoints = area.areaPoints as unknown as AreaPoint[];
      if (arePolygonsEquivalent(areaPoints, existingPoints)) {
        throw new ConflictError('Area with same points already exists');
      }
    }
  }

  async createArea(data: { name: string; areaPoints: AreaPoint[] }): Promise<Area> {
    if (!data.name?.trim()) {
      throw new BadRequestError('Area name is required');
    }

    const existingAreas = await this.areaRepository.findAll();
    console.log('Existing areas:', existingAreas.map(a => ({ id: a.id, name: a.name })));
    console.log('Creating area:', { name: data.name, areaPoints: data.areaPoints });
    
    if (existingAreas.some((area) => area.name === data.name)) {
      throw new ConflictError('Area with same name already exists');
    }

    await this.validateAreaForSave(data.areaPoints);
    return this.areaRepository.create(data);
  }

  async getAreaById(id: number): Promise<Area | null> {
    if (id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }
    return this.areaRepository.findById(id);
  }

  async getAllAreas(): Promise<Area[]> {
    return this.areaRepository.findAll();
  }

  async updateArea(id: number, data: { name: string; areaPoints: AreaPoint[] }): Promise<Area | null> {
    if (id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    const existingArea = await this.areaRepository.findById(id);
    if (!existingArea) {
      throw new NotFoundError('Area not found');
    }

    if (!data.name.trim()) {
      throw new BadRequestError('Area name is required');
    }

    const allAreas = await this.areaRepository.findAll();
    if (allAreas.some((area) => area.id !== id && area.name === data.name)) {
      throw new ConflictError('Area with same name already exists');
    }

    await this.validateAreaForSave(data.areaPoints, id);

    return this.areaRepository.update(id, data);
  }

  async deleteArea(id: number): Promise<boolean> {
    if (id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    const existingArea = await this.areaRepository.findById(id);
    if (!existingArea) {
      throw new NotFoundError('Area not found');
    }

    return this.areaRepository.delete(id);
  }

  async getAreaAnalytics(id: number, startDate: Date, endDate: Date): Promise<AreaAnalytics> {
    if (id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestError('Invalid analytics period');
    }
    if (startDate >= endDate) {
      throw new BadRequestError('startDate must be before endDate');
    }

    const area = await this.areaRepository.findById(id);
    if (!area) {
      throw new NotFoundError('Area not found');
    }

    return this.areaRepository.getAreaAnalytics(id, startDate, endDate);
  }
}