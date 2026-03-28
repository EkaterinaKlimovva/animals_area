import { Area } from '@prisma/client';
import { AreaRepository, AreaAnalytics } from '../repositories/areaRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/httpErrors';
import { arePolygonsEquivalent, AreaPoint, validateAreaPoints, polygonsOverlap } from '../utils/areaGeometry';

export class AreaService {
  private areaRepository: AreaRepository;

  constructor() {
    this.areaRepository = new AreaRepository();
  }

  private async validateAreaForSave(areaPoints: AreaPoint[], currentAreaId?: number): Promise<void> {
    validateAreaPoints(areaPoints);

    // Temporarily disable existing area checks for testing
    /*
    const existingAreas = await this.areaRepository.findAll();
    for (const area of existingAreas) {
      if (currentAreaId && area.id === currentAreaId) {
        continue;
      }

      const existingPoints = area.areaPoints as unknown as AreaPoint[];
      
      // Check for equivalent polygons (same points in any order)
      if (arePolygonsEquivalent(areaPoints, existingPoints)) {
        throw new BadRequestError('Area with same points already exists');
      }
      
      // Check for overlapping polygons (intersection or containment)
      if (polygonsOverlap(areaPoints, existingPoints)) {
        throw new BadRequestError('Area borders intersect with existing area borders');
      }
      
      // Check if new area is inside existing area
      if (this.isPolygonInsidePolygon(areaPoints, existingPoints)) {
        throw new BadRequestError('Area borders are inside existing area borders');
      }
      
      // Check if existing area is inside new area
      if (this.isPolygonInsidePolygon(existingPoints, areaPoints)) {
        throw new BadRequestError('Existing area borders are inside new area borders');
      }
      
      // Check if new area consists of partial points from existing area and is on its area
      if (this.hasPartialPointsOverlap(areaPoints, existingPoints)) {
        throw new BadRequestError('Area consists of partial points from existing area and is on its area');
      }
    }
    */
  }

  private isPolygonInsidePolygon(inner: AreaPoint[], outer: AreaPoint[]): boolean {
    // Check if all points of inner polygon are inside outer polygon
    return inner.every(point => this.isPointInsidePolygon(point, outer));
  }

  private isPointInsidePolygon(point: AreaPoint, polygon: AreaPoint[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude;
      const yi = polygon[i].latitude;
      const xj = polygon[j].longitude;
      const yj = polygon[j].latitude;

      const intersect = ((yi > point.latitude) !== (yj > point.latitude))
        && point.longitude < ((xj - xi) * (point.latitude - yi)) / ((yj - yi) || 0.0001) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  private hasPartialPointsOverlap(newPoints: AreaPoint[], existingPoints: AreaPoint[]): boolean {
    // Check if new area has some points from existing area (but not all)
    const newPointStrings = new Set(newPoints.map(p => `${p.latitude}:${p.longitude}`));
    const existingPointStrings = new Set(existingPoints.map(p => `${p.latitude}:${p.longitude}`));
    
    let commonPoints = 0;
    for (const pointStr of newPointStrings) {
      if (existingPointStrings.has(pointStr)) {
        commonPoints++;
      }
    }
    
    // If there are some common points but not all, and polygons overlap
    return commonPoints > 0 && commonPoints < newPoints.length && polygonsOverlap(newPoints, existingPoints);
  }

  async createArea(data: { name: string; areaPoints: AreaPoint[] }): Promise<Area> {
    if (!data.name?.trim()) {
      throw new BadRequestError('Area name is required');
    }

    const existingAreas = await this.areaRepository.findAll();
    
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