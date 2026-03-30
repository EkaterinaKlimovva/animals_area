import { Request, Response } from 'express';
import { LocationService } from '../services/locationService';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';
import { toLocationResponse } from '../mappers/locationMapper';
import { LocationRequestDto } from '../types/location';
import { GEOHASH } from '../constants/validation';
import * as ngeohash from 'ngeohash';
import { createHash } from 'crypto';

type LocationIdParams = { locationId: string | number };
type LocationSearchQuery = Partial<LocationRequestDto>;
type GeohashQuery = {
  lat?: string | number;
  lng?: string | number;
  latitude?: string | number;
  longitude?: string | number;
  format?: string;
};

export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  // GET /locations
  async searchLocations(req: Request, res: Response) {
    const { latitude, longitude } = req.query as unknown as LocationSearchQuery;

    if (latitude === undefined || longitude === undefined) {
      throw new BadRequestError('Latitude and longitude are required');
    }

    const lat = parseFloat(String(latitude));
    const lng = parseFloat(String(longitude));

    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const location = await this.locationService.findByCoordinates(lat, lng);
    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.status(200).send(location.id.toString());
  }

  // GET /locations/{locationId}
  async getLocationById(req: Request, res: Response) {
    const params = req.params as unknown as LocationIdParams;
    const id = Number(params.locationId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid location ID');
    }

    const location = await this.locationService.getLocationById(id);
    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.status(200).json(toLocationResponse(location));
  }

  // POST /locations
  async createLocation(req: Request, res: Response) {
    const { latitude, longitude } = req.body as LocationRequestDto;
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const location = await this.locationService.createLocation({
      latitude,
      longitude,
    });

    res.status(201).json(toLocationResponse(location));
  }

  // PUT /locations/{locationId}
  async updateLocation(req: Request, res: Response) {
    const params = req.params as unknown as LocationIdParams;
    const id = Number(params.locationId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid location ID');
    }

    const { latitude, longitude } = req.body as LocationRequestDto;
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const location = await this.locationService.updateLocation(id, {
      latitude,
      longitude,
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.status(200).json(toLocationResponse(location));
  }

  // DELETE /locations/{locationId}
  async deleteLocation(req: Request, res: Response) {
    const params = req.params as unknown as LocationIdParams;
    const id = Number(params.locationId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid location ID');
    }

    const deleted = await this.locationService.deleteLocation(id);
    if (!deleted) {
      throw new NotFoundError('Location not found');
    }

    res.status(200).send();
  }

  private encodeGeohashV1(latitude: number, longitude: number): string {
    return ngeohash.encode(latitude, longitude, GEOHASH.DEFAULT_PRECISION);
  }

  private encodeGeohashV2(latitude: number, longitude: number): string {
    const hash = this.encodeGeohashV1(latitude, longitude);
    return Buffer.from(hash, 'utf8').toString('base64');
  }

  private encodeGeohashV3(latitude: number, longitude: number): string {
    const hash = this.encodeGeohashV1(latitude, longitude);
    const digest = createHash('md5').update(hash, 'utf8').digest();
    const reversed = Buffer.from(digest).reverse();
    return reversed.toString('base64');
  }

  // GET /locations/geohash?lat=&lng= or ?latitude=&longitude=
  async getGeohash(req: Request, res: Response) {
    const query = req.query as unknown as GeohashQuery;
    const latStr = query.lat ?? query.latitude;
    const lngStr = query.lng ?? query.longitude;

    const latitude = parseFloat(String(latStr));
    const longitude = parseFloat(String(lngStr));

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const hash = this.encodeGeohashV1(latitude, longitude);

    // Check if base64 encoding is requested
    const acceptHeader = req.headers.accept || '';
    if (
      acceptHeader.includes('application/base64') ||
      query.format === 'base64'
    ) {
      const base64Geohash = Buffer.from(hash).toString('base64');
      res.status(200).type('text/plain').send(base64Geohash);
      return;
    }

    res.status(200).type('text/plain').send(hash);
  }

  // GET /locations/geohashv2?lat=&lng= or ?latitude=&longitude=
  async getGeohashV2(req: Request, res: Response) {
    const query = req.query as unknown as GeohashQuery;
    const latStr = query.lat ?? query.latitude;
    const lngStr = query.lng ?? query.longitude;

    const latitude = parseFloat(String(latStr));
    const longitude = parseFloat(String(lngStr));

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const hash = this.encodeGeohashV2(latitude, longitude);

    res.status(200).type('text/plain').send(hash);
  }

  // GET /locations/geohashv3?lat=&lng= or ?latitude=&longitude=
  async getGeohashV3(req: Request, res: Response) {
    const query = req.query as unknown as GeohashQuery;
    const latStr = query.lat ?? query.latitude;
    const lngStr = query.lng ?? query.longitude;

    const latitude = parseFloat(String(latStr));
    const longitude = parseFloat(String(lngStr));

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const hash = this.encodeGeohashV3(latitude, longitude);

    res.status(200).type('text/plain').send(hash);
  }
}
