import { Request, Response } from 'express';
import { AnimalService } from '../services/animalService';
import { AnimalSearchParams } from '../repositories/animalRepository';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';
import { toAnimalResponse, toVisitedLocationResponse } from '../mappers/animalMapper';
import {
  AnimalSearchQueryDto,
  AnimalVisitedLocationsQueryDto,
  CreateAnimalRequestDto,
  UpdateAnimalRequestDto,
  UpdateAnimalTypesRequestDto,
  UpdateVisitedLocationRequestDto,
} from '../types/animal';

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

    res.status(200).json(toAnimalResponse(animal));
  }

  async getAnimals(req: Request, res: Response) {
    const params: AnimalSearchParams = {};
    const query = req.query as unknown as AnimalSearchQueryDto;
    if (query.startDateTime) params.startDateTime = new Date(query.startDateTime);
    if (query.endDateTime) params.endDateTime = new Date(query.endDateTime);
    if (query.chipperId) params.chipperId = query.chipperId;
    if (query.chippingLocationId) params.chippingLocationId = query.chippingLocationId;
    if (query.lifeStatus) params.lifeStatus = query.lifeStatus;
    if (query.gender) params.gender = query.gender;
    if (query.from !== undefined) params.from = query.from;
    if (query.size !== undefined) params.size = query.size;

    if (params.startDateTime && params.endDateTime && params.startDateTime > params.endDateTime) {
      throw new BadRequestError('startDateTime must be before or equal to endDateTime');
    }

    const animals = await this.animalService.getAnimals(params);
    res.status(200).json(animals.map(toAnimalResponse));
  }

  async createAnimal(req: Request, res: Response) {
    const { animalTypes, weight, length, height, gender, chipperId, chippingLocationId } = req.body as CreateAnimalRequestDto;
    const animal = await this.animalService.createAnimal({
      animalTypes,
      weight,
      length,
      height,
      gender,
      chipperId,
      chippingLocationId,
    });

    res.status(201).json(toAnimalResponse(animal));
  }

  async updateAnimal(req: Request, res: Response) {
    const id = parseInt(req.params.animalId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const { weight, length, height, gender, lifeStatus, chipperId, chippingLocationId } = req.body as UpdateAnimalRequestDto;
    const animal = await this.animalService.updateAnimal(id, {
      weight,
      length,
      height,
      gender,
      lifeStatus,
      chipperId,
      chippingLocationId,
    });

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    res.status(200).json(toAnimalResponse(animal));
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
    res.status(201).json(toAnimalResponse(animal));
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
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    res.status(200).json(toAnimalResponse(animal));
  }

  async updateAnimalTypes(req: Request, res: Response) {
    const animalId = parseInt(req.params.animalId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const { oldTypeId, newTypeId } = req.body as UpdateAnimalTypesRequestDto;
    const animal = await this.animalService.updateAnimalTypes(animalId, oldTypeId, newTypeId);
    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    res.status(200).json(toAnimalResponse(animal));
  }

  async getAnimalVisitedLocations(req: Request, res: Response) {
    const animalId = parseInt(req.params.animalId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const query = req.query as unknown as AnimalVisitedLocationsQueryDto;
    const visitedLocations = await this.animalService.getAnimalVisitedLocations(animalId, {
      startDateTime: query.startDateTime ? new Date(query.startDateTime) : undefined,
      endDateTime: query.endDateTime ? new Date(query.endDateTime) : undefined,
      from: query.from,
      size: query.size,
    });
    res.status(200).json(visitedLocations.map(toVisitedLocationResponse));
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
    if (!visitedLocation) {
      throw new NotFoundError('Animal or location not found');
    }

    res.status(201).json(toVisitedLocationResponse(visitedLocation));
  }

  async updateVisitedLocation(req: Request, res: Response) {
    const animalId = parseInt(req.params.animalId, 10);
    if (isNaN(animalId) || animalId <= 0) {
      throw new BadRequestError('Invalid animal ID');
    }

    const { visitedLocationPointId, locationPointId } = req.body as UpdateVisitedLocationRequestDto;
    const visitedLocation = await this.animalService.updateVisitedLocation(animalId, visitedLocationPointId, { locationPointId });
    if (!visitedLocation) {
      throw new NotFoundError('Visited location not found');
    }

    res.status(200).json(toVisitedLocationResponse(visitedLocation));
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