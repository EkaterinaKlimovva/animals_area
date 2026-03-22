import { AreaRepository } from '../src/repositories/areaRepository';
import prisma from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
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

      (prisma.animalVisitedLocation.findMany as jest.Mock)
        .mockResolvedValueOnce([{ animalId: 1 }, { animalId: 2 }])
        .mockResolvedValue(mockVisits);

      const repository = new AreaRepository();
      const result = await repository.getAreaAnalytics(1, new Date('2024-01-01'), new Date('2024-01-02'));

      expect(result.totalQuantityAnimals).toBe(2);
      expect(result.totalAnimalsArrived).toBe(2); // both first visits in period
      expect(result.totalAnimalsGone).toBe(1); // animal 2's last visit in period, animal 1's last is after
      expect(result.animalsAnalytics).toEqual([
        {
          animalType: 'Bear',
          animalTypeId: 1,
          quantityAnimals: 1,
          animalsArrived: 1,
          animalsGone: 0,
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
  });
});