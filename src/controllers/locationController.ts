import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { LocationService } from '../services/locationService';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';

export const validateLocationCreate = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
];

export const validateLocationUpdate = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
];

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

    res.status(200).json(location);
  }

  // POST /locations
  async createLocation(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const { latitude, longitude } = req.body;
    const location = await this.locationService.createLocation({ latitude, longitude });

    res.status(201).json(location);
  }

  // PUT /locations/{locationId}
  async updateLocation(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const id = parseInt(req.params.locationId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid location ID');
    }

    const { latitude, longitude } = req.body;
    const location = await this.locationService.updateLocation(id, { latitude, longitude });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.status(200).json(location);
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
}