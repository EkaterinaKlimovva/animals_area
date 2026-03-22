import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { AnimalService } from '../services/animalService';
import { AnimalSearchParams } from '../repositories/animalRepository';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';

export const validateAnimalCreate = [
  body('animalTypes').isArray({ min: 1 }).withMessage('animalTypes must be a non-empty array'),
  body('animalTypes.*').isInt({ gt: 0 }).withMessage('Each animal type id must be positive'),
  body('weight').isFloat({ gt: 0 }).withMessage('Weight must be positive'),
  body('length').isFloat({ gt: 0 }).withMessage('Length must be positive'),
  body('height').isFloat({ gt: 0 }).withMessage('Height must be positive'),
  body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Gender must be MALE, FEMALE, or OTHER'),
  body('chipperId').isInt({ gt: 0 }).withMessage('chipperId must be a positive integer'),
  body('chippingLocationId').isInt({ gt: 0 }).withMessage('chippingLocationId must be a positive integer'),
];

export const validateAnimalUpdate = [
  body('weight').optional().isFloat({ gt: 0 }).withMessage('Weight must be positive'),
  body('length').optional().isFloat({ gt: 0 }).withMessage('Length must be positive'),
  body('height').optional().isFloat({ gt: 0 }).withMessage('Height must be positive'),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Gender must be MALE, FEMALE, or OTHER'),
  body('lifeStatus').optional().isIn(['ALIVE', 'DEAD']).withMessage('lifeStatus must be ALIVE or DEAD'),
  body('chipperId').optional().isInt({ gt: 0 }).withMessage('chipperId must be a positive integer'),
  body('chippingLocationId').optional().isInt({ gt: 0 }).withMessage('chippingLocationId must be a positive integer'),
];

export const validateAnimalSearch = [
  query('startDateTime').optional().isISO8601().withMessage('startDateTime must be a valid ISO 8601 date'),
  query('endDateTime').optional().isISO8601().withMessage('endDateTime must be a valid ISO 8601 date'),
  query('chipperId').optional().isInt({ gt: 0 }).withMessage('chipperId must be a positive integer'),
  query('chippingLocationId').optional().isInt({ gt: 0 }).withMessage('chippingLocationId must be a positive integer'),
  query('lifeStatus').optional().isIn(['ALIVE', 'DEAD']).withMessage('lifeStatus must be ALIVE or DEAD'),
  query('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('gender must be MALE, FEMALE, or OTHER'),
  query('from').optional().isInt({ min: 0 }).withMessage('from must be non-negative'),
  query('size').optional().isInt({ gt: 0 }).withMessage('size must be positive'),
];

export const validateAddType: never[] = [];

export const validateUpdateTypes = [
  body('oldTypeId').isInt({ gt: 0 }).withMessage('oldTypeId must be a positive integer'),
  body('newTypeId').isInt({ gt: 0 }).withMessage('newTypeId must be a positive integer'),
];

export const validateAddVisitedLocation: never[] = [];

export const validateUpdateVisitedLocation = [
  body('visitedLocationPointId').isInt({ gt: 0 }).withMessage('visitedLocationPointId must be a positive integer'),
  body('locationPointId').isInt({ gt: 0 }).withMessage('locationPointId must be a positive integer'),
];

export class AnimalController {
  private animalService: AnimalService;

  constructor() {
    this.animalService = new AnimalService();
  }

  async getAnimalById(req: Request, res: Response) {
    const id = parseInt(req.params.animalId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const animal = await this.animalService.getAnimalById(id);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    res.status(200).json(animal);
  }

  async getAnimals(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const params: AnimalSearchParams = {};
    if (req.query.startDateTime) params.startDateTime = new Date(req.query.startDateTime as string);
    if (req.query.endDateTime) params.endDateTime = new Date(req.query.endDateTime as string);
    if (req.query.chipperId) params.chipperId = parseInt(req.query.chipperId as string, 10);
    if (req.query.chippingLocationId) params.chippingLocationId = parseInt(req.query.chippingLocationId as string, 10);
    if (req.query.lifeStatus) params.lifeStatus = req.query.lifeStatus as 'ALIVE' | 'DEAD';
    if (req.query.gender) params.gender = req.query.gender as 'MALE' | 'FEMALE' | 'OTHER';
    if (req.query.from) params.from = parseInt(req.query.from as string, 10);
    if (req.query.size) params.size = parseInt(req.query.size as string, 10);

    const animals = await this.animalService.getAnimals(params);
    res.status(200).json(animals);
  }

  async createAnimal(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const { animalTypes, weight, length, height, gender, chipperId, chippingLocationId } = req.body;
    const animal = await this.animalService.createAnimal({
      animalTypes,
      weight,
      length,
      height,
      gender,
      chipperId,
      chippingLocationId,
    });

    res.status(201).json(animal);
  }

  async updateAnimal(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const id = parseInt(req.params.animalId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const { weight, length, height, gender, lifeStatus, chipperId, chippingLocationId } = req.body;
    const animal = await this.animalService.updateAnimal(id, {
      weight,
      length,
      height,
      gender,
      lifeStatus,
      chipperId,
      chippingLocationId,
    });

    res.status(200).json(animal);
  }

  async deleteAnimal(req: Request, res: Response) {
    const id = parseInt(req.params.animalId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    await this.animalService.deleteAnimal(id);
    res.status(200).send();
  }

  async addTypeToAnimal(req: Request, res: Response) {
    const animalId = parseInt(req.params.animalId, 10);
    const typeId = parseInt(req.params.typeId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }
    if (isNaN(typeId) || typeId <= 0) {
      throw new BadRequestError('Invalid type ID');
    }

    const animal = await this.animalService.addTypeToAnimal(animalId, typeId);
    res.status(201).json(animal);
  }

  async removeTypeFromAnimal(req: Request, res: Response) {
    const animalId = parseInt(req.params.animalId, 10);
    const typeId = parseInt(req.params.typeId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }
    if (isNaN(typeId) || typeId <= 0) {
      throw new BadRequestError('Invalid type ID');
    }

    const animal = await this.animalService.removeTypeFromAnimal(animalId, typeId);
    res.status(200).json(animal);
  }

  async updateAnimalTypes(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const animalId = parseInt(req.params.animalId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const { oldTypeId, newTypeId } = req.body;
    const animal = await this.animalService.updateAnimalTypes(animalId, oldTypeId, newTypeId);
    res.status(200).json(animal);
  }

  async getAnimalVisitedLocations(req: Request, res: Response) {
    const animalId = parseInt(req.params.animalId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const visitedLocations = await this.animalService.getAnimalVisitedLocations(animalId, {
      startDateTime: req.query.startDateTime ? new Date(req.query.startDateTime as string) : undefined,
      endDateTime: req.query.endDateTime ? new Date(req.query.endDateTime as string) : undefined,
      from: req.query.from ? parseInt(req.query.from as string, 10) : undefined,
      size: req.query.size ? parseInt(req.query.size as string, 10) : undefined,
    });
    res.status(200).json(visitedLocations);
  }

  async addVisitedLocation(req: Request, res: Response) {
    const animalId = parseInt(req.params.animalId, 10);
    const pointId = parseInt(req.params.pointId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }
    if (isNaN(pointId) || pointId <= 0) {
      throw new BadRequestError('Invalid point ID');
    }

    const visitedLocation = await this.animalService.addVisitedLocation(animalId, {
      locationPointId: pointId,
      dateTimeOfVisitLocation: new Date(),
    });
    res.status(201).json(visitedLocation);
  }

  async updateVisitedLocation(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const animalId = parseInt(req.params.animalId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const { visitedLocationPointId, locationPointId } = req.body;
    const visitedLocation = await this.animalService.updateVisitedLocation(animalId, visitedLocationPointId, { locationPointId });
    res.status(200).json(visitedLocation);
  }

  async deleteVisitedLocation(req: Request, res: Response) {
    const animalId = parseInt(req.params.animalId, 10);
    const visitedLocationId = parseInt(req.params.visitedLocationId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }
    if (isNaN(visitedLocationId) || visitedLocationId <= 0) {
      throw new BadRequestError('Invalid visited location ID');
    }

    await this.animalService.deleteVisitedLocation(animalId, visitedLocationId);
    res.status(200).send();
  }
}