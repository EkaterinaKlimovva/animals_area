import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AnimalTypeService } from '../services/animalTypeService';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';

export const validateAnimalTypeCreate = [
  body('type').custom((value) => typeof value === 'string' && value.trim().length > 0).withMessage('Type is required'),
];

export const validateAnimalTypeUpdate = [
  body('type').custom((value) => typeof value === 'string' && value.trim().length > 0).withMessage('Type is required'),
];

export class AnimalTypeController {
  private animalTypeService: AnimalTypeService;

  constructor() {
    this.animalTypeService = new AnimalTypeService();
  }

  // GET /animals/types/{typeId}
  async getAnimalTypeById(req: Request, res: Response) {
    const id = parseInt(req.params.typeId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid type ID');
    }

    const type = await this.animalTypeService.getAnimalTypeById(id);
    if (!type) {
      throw new NotFoundError('Animal type not found');
    }

    res.status(200).json(type);
  }

  // POST /animals/types
  async createAnimalType(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const { type } = req.body;
    const animalType = await this.animalTypeService.createAnimalType({ type });

    res.status(201).json(animalType);
  }

  // PUT /animals/types/{typeId}
  async updateAnimalType(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const id = parseInt(req.params.typeId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid type ID');
    }

    const { type } = req.body;
    const animalType = await this.animalTypeService.updateAnimalType(id, { type });

    if (!animalType) {
      throw new NotFoundError('Animal type not found');
    }

    res.status(200).json(animalType);
  }

  // DELETE /animals/types/{typeId}
  async deleteAnimalType(req: Request, res: Response) {
    const id = parseInt(req.params.typeId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid type ID');
    }

    const deleted = await this.animalTypeService.deleteAnimalType(id);
    if (!deleted) {
      throw new NotFoundError('Animal type not found');
    }

    res.status(200).send();
  }
}