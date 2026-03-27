import { Request, Response } from 'express';
import { LocationService } from '../services/locationService';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';
import { toLocationResponse } from '../mappers/locationMapper';
import { LocationRequestDto } from '../types/location';
import * as geohash from 'ngeohash';

export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  // GET /locations
  async searchLocations(req: Request, res: Response) {
    const { latitude, longitude } = req.query;
    
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
    const id = parseInt(req.params.locationId, 10);
    if (isNaN(id) || id <= 0) {
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
    const location = await this.locationService.createLocation({ latitude, longitude });

    res.status(201).json(toLocationResponse(location));
  }

  // PUT /locations/{locationId}
  async updateLocation(req: Request, res: Response) {
    const id = parseInt(req.params.locationId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid location ID');
    }

    const { latitude, longitude } = req.body as LocationRequestDto;
    const location = await this.locationService.updateLocation(id, { latitude, longitude });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.status(200).json(toLocationResponse(location));
  }

  // DELETE /locations/{locationId}
  async deleteLocation(req: Request, res: Response) {
    const id = parseInt(req.params.locationId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid location ID');
    }

    const deleted = await this.locationService.deleteLocation(id);
    if (!deleted) {
      throw new NotFoundError('Location not found');
    }

    res.status(200).send();
  }

  // GET /locations/geohash?lat=&lng= or ?latitude=&longitude=
  async getGeohash(req: Request, res: Response) {
    const latStr = req.query.lat ?? req.query.latitude;
    const lngStr = req.query.lng ?? req.query.longitude;
    
    const latitude = parseFloat(String(latStr));
    const longitude = parseFloat(String(lngStr));
    
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const hash = geohash.encode(latitude, longitude, 12);
    
    // Check if base64 encoding is requested
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/base64') || req.query.format === 'base64') {
      const base64Geohash = Buffer.from(hash).toString('base64');
      res.status(200).type('text/plain').send(base64Geohash);
      return;
    }
    
    res.status(200).type('text/plain').send(hash);
  }

  // GET /locations/geohashv2?lat=&lng= or ?latitude=&longitude=
  async getGeohashV2(req: Request, res: Response) {
    const latStr = req.query.lat ?? req.query.latitude;
    const lngStr = req.query.lng ?? req.query.longitude;
    
    const latitude = parseFloat(String(latStr));
    const longitude = parseFloat(String(lngStr));
    
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const hash = geohash.encode(latitude, longitude, 12);
    
    // Check if base64 encoding is requested
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/base64') || req.query.format === 'base64') {
      const base64Geohash = Buffer.from(hash).toString('base64');
      res.status(200).type('text/plain').send(base64Geohash);
      return;
    }
    
    res.status(200).type('text/plain').send(hash);
  }

  // GET /locations/geohashv3?lat=&lng= or ?latitude=&longitude=
  async getGeohashV3(req: Request, res: Response) {
    const latStr = req.query.lat ?? req.query.latitude;
    const lngStr = req.query.lng ?? req.query.longitude;
    
    const latitude = parseFloat(String(latStr));
    const longitude = parseFloat(String(lngStr));
    
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const hash = geohash.encode(latitude, longitude, 12);
    
    // Check if base64 encoding is requested
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/base64') || req.query.format === 'base64') {
      const base64Geohash = Buffer.from(hash).toString('base64');
      res.status(200).type('text/plain').send(base64Geohash);
      return;
    }
    
    res.status(200).type('text/plain').send(hash);
  }
}
