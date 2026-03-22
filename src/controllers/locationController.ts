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

  // GET /locations/geohash?lat=&lng=
  async getGeohash(req: Request, res: Response) {
    const { lat, lng } = req.query as { lat: string; lng: string };
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestError('Invalid latitude or longitude');
    }

    const hash = geohash.encode(latitude, longitude);
    res.status(200).json({ geohash: hash });
  }
}