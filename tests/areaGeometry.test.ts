import {
  arePolygonsEquivalent,
  polygonsOverlap,
  validateAreaPoints,
} from '../src/utils/areaGeometry';

describe('areaGeometry', () => {
  it('validates a simple polygon without throwing', () => {
    expect(() =>
      validateAreaPoints([
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
        { latitude: 1, longitude: 1 },
        { latitude: 1, longitude: 0 },
      ]),
    ).not.toThrow();
  });

  it('throws on duplicate points', () => {
    expect(() =>
      validateAreaPoints([
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
        { latitude: 0, longitude: 1 },
      ]),
    ).toThrow();
  });

  it('detects equivalent polygons with different starting point', () => {
    const left = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
      { latitude: 1, longitude: 1 },
      { latitude: 1, longitude: 0 },
    ];
    const right = [
      { latitude: 1, longitude: 1 },
      { latitude: 1, longitude: 0 },
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
    ];

    expect(arePolygonsEquivalent(left, right)).toBe(true);
  });

  it('detects overlapping polygons', () => {
    const left = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 2 },
      { latitude: 2, longitude: 2 },
      { latitude: 2, longitude: 0 },
    ];
    const right = [
      { latitude: 1, longitude: 1 },
      { latitude: 1, longitude: 3 },
      { latitude: 3, longitude: 3 },
      { latitude: 3, longitude: 1 },
    ];

    expect(polygonsOverlap(left, right)).toBe(true);
  });
});
