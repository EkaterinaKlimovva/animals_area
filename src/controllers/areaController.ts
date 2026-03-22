import { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { AreaService } from '../services/areaService';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';

export const validateAreaCreate = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('areaPoints').isArray({ min: 3 }).withMessage('Area points must be an array with at least 3 points'),
  body('areaPoints.*.latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('areaPoints.*.longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
];

export const validateAreaUpdate = [
  body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string'),
  body('areaPoints').optional().isArray({ min: 3 }).withMessage('Area points must be an array with at least 3 points'),
  body('areaPoints.*.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('areaPoints.*.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
];

export const validateAreaAnalytics = [
  query('startDate').isISO8601({ strict: true, strictSeparator: true }).withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate').isISO8601({ strict: true, strictSeparator: true }).withMessage('endDate must be a valid ISO 8601 date'),
];

export class AreaController {
  private areaService: AreaService;

  constructor() {
    this.areaService = new AreaService();
  }

  // GET /areas/{areaId}
  async getAreaById(req: Request, res: Response) {
    const id = parseInt(req.params.areaId, 10);
    if (isNaN(id)) {
      throw new BadRequestError('Invalid area ID');
    }

    const area = await this.areaService.getAreaById(id);
    if (!area) {
      throw new NotFoundError('Area not found');
    }

    res.status(200).json(area);
  }

  // POST /areas
  async createArea(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const { name, areaPoints } = req.body;
    const area = await this.areaService.createArea({ name, areaPoints });

    res.status(201).json(area);
  }

  // PUT /areas/{areaId}
  async updateArea(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const id = parseInt(req.params.areaId, 10);
    if (isNaN(id)) {
      throw new BadRequestError('Invalid area ID');
    }

    const { name, areaPoints } = req.body;
    const area = await this.areaService.updateArea(id, { name, areaPoints });
    res.status(200).json(area);
  }

  // DELETE /areas/{areaId}
  async deleteArea(req: Request, res: Response) {
    const id = parseInt(req.params.areaId, 10);
    if (isNaN(id)) {
      throw new BadRequestError('Invalid area ID');
    }

    await this.areaService.deleteArea(id);
    res.status(200).send();
  }

  // GET /areas/{areaId}/analytics
  async getAreaAnalytics(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const id = parseInt(req.params.areaId, 10);
    if (isNaN(id)) {
      throw new BadRequestError('Invalid area ID');
    }

    const { startDate, endDate } = req.query;
    const analytics = await this.areaService.getAreaAnalytics(
      id,
      new Date(startDate as string),
      new Date(endDate as string),
    );

    res.status(200).json(analytics);
  }
}