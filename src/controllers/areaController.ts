import { Request, Response } from 'express';
import { AreaService } from '../services/areaService';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';
import { toAreaResponse } from '../mappers/areaMapper';
import {
  AreaAnalyticsQueryDto,
  CreateAreaRequestDto,
  UpdateAreaRequestDto,
} from '../types/area';

type AreaIdParams = { areaId: string | number };

export class AreaController {
  private areaService: AreaService;

  constructor() {
    this.areaService = new AreaService();
  }

  // GET /areas/{areaId}
  async getAreaById(req: Request, res: Response) {
    const params = req.params as unknown as AreaIdParams;
    const id = Number(params.areaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    const area = await this.areaService.getAreaById(id);
    if (!area) {
      throw new NotFoundError('Area not found');
    }

    res.status(200).json(toAreaResponse(area));
  }

  // POST /areas
  async createArea(req: Request, res: Response) {
    const { name, areaPoints } = req.body as CreateAreaRequestDto;

    const points = areaPoints.map((p) => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));
    const area = await this.areaService.createArea({
      name,
      areaPoints: points,
    });

    res.status(201).json(toAreaResponse(area));
  }

  // PUT /areas/{areaId}
  async updateArea(req: Request, res: Response) {
    const params = req.params as unknown as AreaIdParams;
    const id = Number(params.areaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    const { name, areaPoints } = req.body as UpdateAreaRequestDto;
    const points = areaPoints.map((p) => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));
    const area = await this.areaService.updateArea(id, {
      name,
      areaPoints: points,
    });
    res.status(200).json(toAreaResponse(area!));
  }

  // DELETE /areas/{areaId}
  async deleteArea(req: Request, res: Response) {
    const params = req.params as unknown as AreaIdParams;
    const id = Number(params.areaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    await this.areaService.deleteArea(id);
    res.status(200).send();
  }

  // GET /areas/{areaId}/analytics
  async getAreaAnalytics(req: Request, res: Response) {
    const params = req.params as unknown as AreaIdParams;
    const id = Number(params.areaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    const { startDate, endDate } =
      req.query as unknown as AreaAnalyticsQueryDto;

    // Parse dates - handle both YYYY-MM-DD and ISO datetime formats
    const start = startDate.includes('T')
      ? new Date(startDate)
      : new Date(startDate + 'T00:00:00.000Z');
    const end = endDate.includes('T')
      ? new Date(endDate)
      : new Date(endDate + 'T23:59:59.999Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid date format');
    }

    const analytics = await this.areaService.getAreaAnalytics(id, start, end);

    res.status(200).json(analytics);
  }
}
