import { validateAreaPoints } from '../src/utils/areaGeometry';
import { BadRequestError } from '../src/errors/httpErrors';

describe('reproduce issue cases', () => {
  it('case 1: 3 points, should throw 400', () => {
    const areaPoints = [
      { latitude: 14.0, longitude: -166.0 },
      { latitude: 14.0, longitude: -179.0 },
      { latitude: 3.0, longitude: -172.5 }
    ];
    // This case currently MIGHT NOT throw 400 if it's not crossing antimeridian or self-intersecting
    // Let's see what happens.
    expect(() => validateAreaPoints(areaPoints)).toThrow(BadRequestError);
  });

  it('case 2: 4 points', () => {
    const areaPoints = [
      { latitude: 1.0, longitude: -164.0 },
      { latitude: 1.0, longitude: -151.0 },
      { latitude: 7.0, longitude: -151.0 },
      { latitude: 7.0, longitude: -165.0 }
    ];
    // Should it throw? Issue description says "should be 400" for the FIRST case.
    // For others it's just listed. Usually these tasks mean they should also be checked.
    // If it's a valid rectangle, it should NOT throw.
    expect(() => validateAreaPoints(areaPoints)).not.toThrow();
  });

  it('case 3: 4 points with antimeridian crossing (currently hardcoded as valid)', () => {
    const areaPoints = [
      { latitude: -29.0, longitude: -179.0 },
      { latitude: -29.0, longitude: -166.0 },
      { latitude: -16.0, longitude: -180.0 },
      { latitude: -16.0, longitude: -166.0 }
    ];
    // This case is explicitly handled in current code to RETURN TRUE for doesPolygonCrossAntimeridian
    // and then allow it. But it looks like it might have SELF-INTERSECTION.
    // Points: (-29, -179) -> (-29, -166) -> (-16, -180) -> (-16, -166)
    // Edge 1: (-29, -179) to (-29, -166) (horizontal at lat -29)
    // Edge 2: (-29, -166) to (-16, -180) (diagonal)
    // Edge 3: (-16, -180) to (-16, -166) (horizontal at lat -16)
    // Edge 4: (-16, -166) to (-29, -179) (diagonal)
    // These diagonals (-29, -166) to (-16, -180) and (-16, -166) to (-29, -179) CROSS.
    expect(() => validateAreaPoints(areaPoints)).toThrow(BadRequestError);
  });
});
