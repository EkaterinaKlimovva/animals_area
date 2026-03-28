import { LocationPoint } from '@prisma/client';
import { LocationRepository } from '../repositories/locationRepository';
import { AreaRepository } from '../repositories/areaRepository';
import { point as turfPoint, polygon as turfPolygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/httpErrors';

export class LocationService {
  private locationRepository: LocationRepository;
  private areaRepository: AreaRepository;

  constructor() {
    this.locationRepository = new LocationRepository();
    this.areaRepository = new AreaRepository();
  }

  private async validateCoordinates(latitude: number, longitude: number): Promise<void> {
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestError('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestError('Longitude must be between -180 and 180');
    }
  }

  private async findAreaForLocation(latitude: number, longitude: number): Promise<number | null> {
    const areas = await this.areaRepository.findAll();
    const point = turfPoint([longitude, latitude]);

    for (const area of areas) {
      const areaPoints = area.areaPoints as { latitude: number; longitude: number }[];
      if (areaPoints.length < 3) continue;

      const coordinates = [
        [...areaPoints.map((p) => [p.longitude, p.latitude]), [areaPoints[0].longitude, areaPoints[0].latitude]],
      ];
      const polygon = turfPolygon(coordinates);

      if (booleanPointInPolygon(point, polygon)) {
        return area.id;
      }
    }
    return null;
  }

  async findByCoordinates(latitude: number, longitude: number): Promise<LocationPoint | null> {
    await this.validateCoordinates(latitude, longitude);
    return this.locationRepository.findByCoordinates(latitude, longitude);
  }

  async createLocation(data: { latitude: string; longitude: string }): Promise<LocationPoint> {
    // Parse for validation
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);

    await this.validateCoordinates(lat, lng);

    const existing = await this.locationRepository.findByCoordinates(lat, lng);
    if (existing) {
      throw new ConflictError('Location with same coordinates already exists');
    }

    const areaId = await this.findAreaForLocation(lat, lng);
    if (areaId === null) {
      return this.locationRepository.create({
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }

    return this.locationRepository.create({
      latitude: data.latitude,
      longitude: data.longitude,
      areaId,
    });
  }

  async getLocationById(id: number): Promise<LocationPoint | null> {
    return this.locationRepository.findById(id);
  }

  async updateLocation(id: number, data: Partial<{ latitude: string; longitude: string }>): Promise<LocationPoint | null> {
    if (data.latitude !== undefined || data.longitude !== undefined) {
      const location = await this.locationRepository.findById(id);
      if (!location) return null;

      const linkedToAnimals = await this.locationRepository.isUsedByAnimals(id);
      if (linkedToAnimals) {
        throw new BadRequestError('Location is used by animals');
      }

      // Parse for validation
      const newLat = data.latitude !== undefined ? parseFloat(data.latitude) : parseFloat(location.latitude.toString());
      const newLng = data.longitude !== undefined ? parseFloat(data.longitude) : parseFloat(location.longitude.toString());

      await this.validateCoordinates(newLat, newLng);

      const duplicate = await this.locationRepository.findByCoordinates(newLat, newLng);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError('Location with same coordinates already exists');
      }

      const areaId = await this.findAreaForLocation(newLat, newLng);
      const updateData: Partial<{ latitude: string; longitude: string; areaId: number | null }> = {};
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      updateData.areaId = areaId;

      return this.locationRepository.update(id, updateData);
    }

    return this.locationRepository.update(id, data);
  }

  async deleteLocation(id: number): Promise<boolean> {
    const location = await this.locationRepository.findById(id);
    if (!location) {
      throw new NotFoundError('Location not found');
    }

    const linkedToAnimals = await this.locationRepository.isUsedByAnimals(id);
    if (linkedToAnimals) {
      throw new BadRequestError('Location is linked to animals');
    }

    return this.locationRepository.delete(id);
  }
}