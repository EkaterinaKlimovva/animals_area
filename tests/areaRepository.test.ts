import { AreaRepository } from '../src/repositories/areaRepository';
import prisma from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    area: {
      findUnique: jest.fn(),
    },
    animalVisitedLocation: {
      findMany: jest.fn(),
    },
  },
}));

describe('AreaRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAreaAnalytics', () => {
    it('calculates correct analytics for animals visiting area', async () => {
      const mockVisits = [
        {
          animalId: 1,
          dateTimeOfVisitLocation: new Date('2024-01-01T10:00:00Z'),
          animal: {
            types: [
              {
                animalType: {
                  id: 1,
                  type: 'Bear',
                },
              },
            ],
          },
        },
        {
          animalId: 1,
          dateTimeOfVisitLocation: new Date('2024-01-02T10:00:00Z'),
          animal: {
            types: [
              {
                animalType: {
                  id: 1,
                  type: 'Bear',
                },
              },
            ],
          },
        },
        {
          animalId: 2,
          dateTimeOfVisitLocation: new Date('2024-01-01T15:00:00Z'),
          animal: {
            types: [
              {
                animalType: {
                  id: 2,
                  type: 'Wolf',
                },
              },
            ],
          },
        },
      ];

      (prisma.area.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'Test Area', areaPoints: [] });
      (prisma.animalVisitedLocation.findMany as jest.Mock)
        .mockResolvedValueOnce([{ animalId: 1 }, { animalId: 2 }])
        .mockResolvedValue(mockVisits);

      const repository = new AreaRepository();
      const result = await repository.getAreaAnalytics(1, new Date('2024-01-01'), new Date('2024-01-02'));

      expect(result.totalQuantityAnimals).toBe(2);
      expect(result.totalAnimalsArrived).toBe(2); // both first visits in period
      expect(result.totalAnimalsGone).toBe(2); // both last visits in period
      expect(result.animalsAnalytics).toEqual([
        {
          animalType: 'Bear',
          animalTypeId: 1,
          quantityAnimals: 1,
          animalsArrived: 1,
          animalsGone: 1,
        },
        {
          animalType: 'Wolf',
          animalTypeId: 2,
          quantityAnimals: 1,
          animalsArrived: 1,
          animalsGone: 1,
        },
      ]);
    });

    it('calculates correct analytics for animals with multiple visits in period', async () => {
      const mockVisits = [
        {
          animalId: 1,
          dateTimeOfVisitLocation: new Date('2024-01-01T10:00:00Z'), // first visit in period - arrival
          animal: {
            types: [
              {
                animalType: {
                  id: 1,
                  type: 'Bear',
                },
              },
            ],
          },
        },
        {
          animalId: 1,
          dateTimeOfVisitLocation: new Date('2024-01-01T12:00:00Z'), // visit in period
          animal: {
            types: [
              {
                animalType: {
                  id: 1,
                  type: 'Bear',
                },
              },
            ],
          },
        },
        {
          animalId: 1,
          dateTimeOfVisitLocation: new Date('2024-01-02T10:00:00Z'), // last visit in period - departure
          animal: {
            types: [
              {
                animalType: {
                  id: 1,
                  type: 'Bear',
                },
              },
            ],
          },
        },
      ];

      (prisma.area.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'Test Area', areaPoints: [] });
      (prisma.animalVisitedLocation.findMany as jest.Mock)
        .mockResolvedValueOnce([{ animalId: 1 }])
        .mockResolvedValue(mockVisits);

      const repository = new AreaRepository();
      const result = await repository.getAreaAnalytics(1, new Date('2024-01-01'), new Date('2024-01-02'));

      expect(result.totalQuantityAnimals).toBe(1);
      expect(result.totalAnimalsArrived).toBe(1); // first visit in period
      expect(result.totalAnimalsGone).toBe(1); // last visit in period
      expect(result.animalsAnalytics).toEqual([
        {
          animalType: 'Bear',
          animalTypeId: 1,
          quantityAnimals: 1,
          animalsArrived: 1,
          animalsGone: 1,
        },
      ]);
    });
  });
});