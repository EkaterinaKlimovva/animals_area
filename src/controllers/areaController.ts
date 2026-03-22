import { Request, Response } from 'express';
import { AreaService } from '../services/areaService';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';
import { toAreaResponse } from '../mappers/areaMapper';
import { AreaAnalyticsQueryDto, CreateAreaRequestDto, UpdateAreaRequestDto } from '../types/area';

export class AreaController {
  private areaService: AreaService;

  constructor() {
    this.areaService = new AreaService();
  }

  // GET /areas/{areaId}
  async getAreaById(req: Request, res: Response) {
    const id = parseInt(req.params.areaId, 10);
    if (isNaN(id) || id <= 0) {
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
    console.log('Creating area:', { name, areaPoints });
    const area = await this.areaService.createArea({ name, areaPoints });
    console.log('Area created:', area);

    res.status(201).json(toAreaResponse(area));
  }

  // PUT /areas/{areaId}
  async updateArea(req: Request, res: Response) {
    const id = parseInt(req.params.areaId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    const { name, areaPoints } = req.body as UpdateAreaRequestDto;
    const area = await this.areaService.updateArea(id, { name, areaPoints });
    res.status(200).json(toAreaResponse(area!));
  }

  // DELETE /areas/{areaId}
  async deleteArea(req: Request, res: Response) {
    const id = parseInt(req.params.areaId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    await this.areaService.deleteArea(id);
    res.status(200).send();
  }

  // GET /areas/{areaId}/analytics
  async getAreaAnalytics(req: Request, res: Response) {
    const id = parseInt(req.params.areaId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid area ID');
    }

    const { startDate, endDate } = req.query as unknown as AreaAnalyticsQueryDto;
    const analytics = await this.areaService.getAreaAnalytics(
      id,
      new Date(startDate),
      new Date(endDate),
    );

    res.status(200).json(analytics);
  }
}