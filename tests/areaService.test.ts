import { AreaService } from '../src/services/areaService';
import { AreaRepository } from '../src/repositories/areaRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../src/errors/httpErrors';

jest.mock('../src/repositories/areaRepository');

describe('AreaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates area when name and geometry are valid', async () => {
    jest.spyOn(AreaRepository.prototype, 'findAll').mockResolvedValue([]);
    jest.spyOn(AreaRepository.prototype, 'create').mockResolvedValue({
      id: 1,
      name: 'Zone A',
      areaPoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
        { latitude: 1, longitude: 0 },
      ],
    } as never);

    const service = new AreaService();
    const result = await service.createArea({
      name: 'Zone A',
      areaPoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
        { latitude: 1, longitude: 0 },
      ],
    });

    expect(result.name).toBe('Zone A');
  });

  it('throws conflict for duplicate area name', async () => {
    jest.spyOn(AreaRepository.prototype, 'findAll').mockResolvedValue([
      { id: 1, name: 'Zone A', areaPoints: [] },
    ] as never);

    const service = new AreaService();

    await expect(service.createArea({
      name: 'Zone A',
      areaPoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
        { latitude: 1, longitude: 0 },
      ],
    })).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws not found on update when area does not exist', async () => {
    jest.spyOn(AreaRepository.prototype, 'findById').mockResolvedValue(null);

    const service = new AreaService();

    await expect(service.updateArea(42, { name: 'New Name' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws bad request when analytics dates are invalid', async () => {
    const service = new AreaService();

    await expect(service.getAreaAnalytics(1, new Date('2024-01-02'), new Date('2024-01-01')))
      .rejects.toBeInstanceOf(BadRequestError);
  });
});