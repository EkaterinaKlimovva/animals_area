import { AreaRepository } from '../src/repositories/areaRepository';
import prisma from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    area: {
      findUnique: jest.fn(),
    },
    animal: {
      findMany: jest.fn(),
    },
  },
}));

describe('AreaRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAreaAnalytics', () => {
    it('calculates correct analytics for animals transitions in period', async () => {
      const areaPoints = [
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 10 },
        { latitude: 10, longitude: 10 },
        { latitude: 10, longitude: 0 },
      ];

      (prisma.area.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Area',
        areaPoints,
      });

      (prisma.animal.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          chippingDateTime: new Date('2024-01-01T00:00:00Z'),
          chippingLocation: { latitude: -5, longitude: -5 },
          types: [{ animalType: { id: 1, type: 'Bear' } }],
          visitedLocations: [
            {
              dateTimeOfVisitLocation: new Date('2024-01-01T10:00:00Z'),
              locationPoint: { latitude: 5, longitude: 5 },
            },
            {
              dateTimeOfVisitLocation: new Date('2024-01-01T18:00:00Z'),
              locationPoint: { latitude: 20, longitude: 20 },
            },
          ],
        },
        {
          id: 2,
          chippingDateTime: new Date('2024-01-01T00:00:00Z'),
          chippingLocation: { latitude: 5, longitude: 5 },
          types: [{ animalType: { id: 2, type: 'Wolf' } }],
          visitedLocations: [],
        },
      ]);

      const repository = new AreaRepository();
      const result = await repository.getAreaAnalytics(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      expect(result.totalQuantityAnimals).toBe(1);
      expect(result.totalAnimalsArrived).toBe(1);
      expect(result.totalAnimalsGone).toBe(1);
      expect(result.animalsAnalytics).toEqual([
        {
          animalType: 'Bear',
          animalTypeId: 1,
          quantityAnimals: 0,
          animalsArrived: 1,
          animalsGone: 1,
        },
        {
          animalType: 'Wolf',
          animalTypeId: 2,
          quantityAnimals: 1,
          animalsArrived: 0,
          animalsGone: 0,
        },
      ]);
    });

    it('returns empty analytics when no animals match period criteria', async () => {
      const areaPoints = [
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 10 },
        { latitude: 10, longitude: 10 },
        { latitude: 10, longitude: 0 },
      ];

      (prisma.area.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Area',
        areaPoints,
      });
      (prisma.animal.findMany as jest.Mock).mockResolvedValue([]);

      const repository = new AreaRepository();
      const result = await repository.getAreaAnalytics(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      expect(result).toEqual({
        totalQuantityAnimals: 0,
        totalAnimalsArrived: 0,
        totalAnimalsGone: 0,
        animalsAnalytics: [],
      });
    });
  });
});
