import { Area } from '@prisma/client';
import { AreaRepository, AreaAnalytics } from '../repositories/areaRepository';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';
import { AreaPoint, validateAreaPoints } from '../utils/areaGeometry';

export class AreaService {
  private areaRepository: AreaRepository;

  constructor() {
    this.areaRepository = new AreaRepository();
  }

  private isPointOnSegment(point: AreaPoint, a: AreaPoint, b: AreaPoint): boolean {
    const cross = (point.latitude - a.latitude) * (b.longitude - a.longitude)
      - (point.longitude - a.longitude) * (b.latitude - a.latitude);

    if (Math.abs(cross) > 1e-9) {
      return false;
    }

    const withinLat = point.latitude >= Math.min(a.latitude, b.latitude) - 1e-9
      && point.latitude <= Math.max(a.latitude, b.latitude) + 1e-9;
    const withinLon = point.longitude >= Math.min(a.longitude, b.longitude) - 1e-9
      && point.longitude <= Math.max(a.longitude, b.longitude) + 1e-9;

    return withinLat && withinLon;
  }

  private isPointStrictlyInsidePolygon(point: AreaPoint, polygon: AreaPoint[]): boolean {
    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      if (this.isPointOnSegment(point, a, b)) {
        return false;
      }
    }

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude;
      const yi = polygon[i].latitude;
      const xj = polygon[j].longitude;
      const yj = polygon[j].latitude;

      const intersect = ((yi > point.latitude) !== (yj > point.latitude))
        && (point.longitude < ((xj - xi) * (point.latitude - yi)) / ((yj - yi) || 1e-12) + xi);

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  private haveStrictAreaOverlap(left: AreaPoint[], right: AreaPoint[]): boolean {
    return left.some((p) => this.isPointStrictlyInsidePolygon(p, right))
      || right.some((p) => this.isPointStrictlyInsidePolygon(p, left));
  }

  private async validateAreaForSave(areaPoints: AreaPoint[], currentAreaId?: number): Promise<void> {
    validateAreaPoints(areaPoints);

    const existingAreas = await this.areaRepository.findAll();
    for (const area of existingAreas) {
      if (currentAreaId !== undefined && area.id === currentAreaId) {
        continue;
      }

      const existingPoints = (area.areaPoints as unknown as AreaPoint[]).map((p) => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      }));

      if (this.haveStrictAreaOverlap(areaPoints, existingPoints)) {
        throw new BadRequestError('Area overlaps with existing area');
      }
    }
  }

  async createArea(data: { name: string; areaPoints: AreaPoint[] }): Promise<Area> {
    if (!data.name?.trim()) {
      throw new BadRequestError('Area name is required');
    }
    
    if (!data.areaPoints || data.areaPoints.length < 3) {
      throw new BadRequestError('Area must have at least 3 points');
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