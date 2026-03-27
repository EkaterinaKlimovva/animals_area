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

  async createLocation(data: { latitude: number; longitude: number }): Promise<LocationPoint> {
    // Use toFixed(15) to preserve precision without rounding errors
    const roundedLatitude = parseFloat(data.latitude.toFixed(15));
    const roundedLongitude = parseFloat(data.longitude.toFixed(15));

    await this.validateCoordinates(roundedLatitude, roundedLongitude);

    const existing = await this.locationRepository.findByCoordinates(roundedLatitude, roundedLongitude);
    if (existing) {
      throw new ConflictError('Location with same coordinates already exists');
    }

    const areaId = await this.findAreaForLocation(roundedLatitude, roundedLongitude);
    if (areaId === null) {
      return this.locationRepository.create({
        latitude: roundedLatitude,
        longitude: roundedLongitude,
      });
    }

    return this.locationRepository.create({
      latitude: roundedLatitude,
      longitude: roundedLongitude,
      areaId,
    });
  }

  async getLocationById(id: number): Promise<LocationPoint | null> {
    return this.locationRepository.findById(id);
  }

  async getAllLocations(): Promise<LocationPoint[]> {
    return this.locationRepository.findAll();
  }

  async updateLocation(id: number, data: Partial<{ latitude: number; longitude: number }>): Promise<LocationPoint | null> {
    if (data.latitude !== undefined || data.longitude !== undefined) {
      const location = await this.locationRepository.findById(id);
      if (!location) return null;

      const linkedToAnimals = await this.locationRepository.isUsedByAnimals(id);
      if (linkedToAnimals) {
        throw new BadRequestError('Location is used by animals');
      }

      const newLat = data.latitude !== undefined ? parseFloat(data.latitude.toFixed(15)) : Number(location.latitude);
      const newLng = data.longitude !== undefined ? parseFloat(data.longitude.toFixed(15)) : Number(location.longitude);

      await this.validateCoordinates(newLat, newLng);

      const duplicate = await this.locationRepository.findByCoordinates(newLat, newLng);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError('Location with same coordinates already exists');
      }

      const areaId = await this.findAreaForLocation(newLat, newLng);
      if (areaId === null) {
        return this.locationRepository.update(id, {
          latitude: newLat,
          longitude: newLng,
        });
      }

      return this.locationRepository.update(id, {
        latitude: newLat,
        longitude: newLng,
        areaId,
      });
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