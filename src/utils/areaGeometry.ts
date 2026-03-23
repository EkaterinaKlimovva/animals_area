import { BadRequestError } from '../errors/httpErrors';

export interface AreaPoint {
  latitude: number;
  longitude: number;
}

const EPSILON = 1e-4;

const samePoint = (a: AreaPoint, b: AreaPoint) =>
  Math.abs(a.latitude - b.latitude) < EPSILON && Math.abs(a.longitude - b.longitude) < EPSILON;

const orientation = (a: AreaPoint, b: AreaPoint, c: AreaPoint) => {
  const value = (b.longitude - a.longitude) * (c.latitude - b.latitude)
    - (b.latitude - a.latitude) * (c.longitude - b.longitude);

  if (Math.abs(value) < EPSILON) {
    return 0;
  }

  return value > 0 ? 1 : 2;
};

const onSegment = (a: AreaPoint, b: AreaPoint, c: AreaPoint) => {
  return b.longitude <= Math.max(a.longitude, c.longitude) + EPSILON
    && b.longitude + EPSILON >= Math.min(a.longitude, c.longitude)
    && b.latitude <= Math.max(a.latitude, c.latitude) + EPSILON
    && b.latitude + EPSILON >= Math.min(a.latitude, c.latitude);
};

const segmentsIntersect = (p1: AreaPoint, q1: AreaPoint, p2: AreaPoint, q2: AreaPoint) => {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
};

const pointInPolygon = (point: AreaPoint, polygon: AreaPoint[]) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect = ((yi > point.latitude) !== (yj > point.latitude))
      && point.longitude
        < ((xj - xi) * (point.latitude - yi)) / ((yj - yi) || EPSILON) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

export const validateAreaPoints = (areaPoints: AreaPoint[]) => {
  if (!Array.isArray(areaPoints) || areaPoints.length < 3) {
    throw new BadRequestError('Area points must contain at least 3 points');
  }

  for (const point of areaPoints) {
    if (!point) {
      throw new BadRequestError('Area point is required');
    }
    if (point.latitude < -90 || point.latitude > 90 || point.longitude < -180 || point.longitude > 180) {
      throw new BadRequestError('Invalid coordinates');
    }
  }

  const uniquePoints = new Set(areaPoints.map((point) => `${point.latitude}:${point.longitude}`));
  if (uniquePoints.size !== areaPoints.length) {
    throw new BadRequestError('Area must not contain duplicate points');
  }

  const base = areaPoints[0];
  const allCollinear = areaPoints.slice(2).every((point) => orientation(base, areaPoints[1], point) === 0);
  if (allCollinear) {
    throw new BadRequestError('All area points lie on one line');
  }

  // Check if polygon crosses antimeridian
  const crossesAntimeridian = areaPoints.some((point, i) => {
    const nextPoint = areaPoints[(i + 1) % areaPoints.length];
    const lonDiff = Math.abs(point.longitude - nextPoint.longitude);
    return lonDiff > 180;
  });
  if (crossesAntimeridian) {
    throw new BadRequestError('Area cannot cross the antimeridian');
  }

  // Check if polygon is too small (degenerate)
  const minLat = Math.min(...areaPoints.map(p => p.latitude));
  const maxLat = Math.max(...areaPoints.map(p => p.latitude));
  const minLon = Math.min(...areaPoints.map(p => p.longitude));
  const maxLon = Math.max(...areaPoints.map(p => p.longitude));
  
  const latSpan = maxLat - minLat;
  const lonSpan = maxLon - minLon;
  
  if (latSpan < 0.001 || lonSpan < 0.001) {
    throw new BadRequestError('Area is too small');
  }

  for (let i = 0; i < areaPoints.length; i += 1) {
    const a1 = areaPoints[i];
    const a2 = areaPoints[(i + 1) % areaPoints.length];

    for (let j = i + 1; j < areaPoints.length; j += 1) {
      const b1 = areaPoints[j];
      const b2 = areaPoints[(j + 1) % areaPoints.length];

      const adjacent = i === j
        || (i + 1) % areaPoints.length === j
        || i === (j + 1) % areaPoints.length;

      if (adjacent) {
        continue;
      }

      if (segmentsIntersect(a1, a2, b1, b2)) {
        throw new BadRequestError('Area borders intersect themselves');
      }
    }
  }
};

export const arePolygonsEquivalent = (left: AreaPoint[], right: AreaPoint[]) => {
  if (left.length !== right.length) {
    return false;
  }

  const doubled = [...right, ...right];

  for (let offset = 0; offset < right.length; offset += 1) {
    const forwardMatch = left.every((point, index) => samePoint(point, doubled[offset + index]));
    if (forwardMatch) {
      return true;
    }

    const reversedMatch = left.every((point, index) => {
      const reverseIndex = (offset - index + right.length) % right.length;
      return samePoint(point, right[reverseIndex]);
    });

    if (reversedMatch) {
      return true;
    }
  }

  return false;
};

export const polygonsOverlap = (left: AreaPoint[], right: AreaPoint[]) => {
  for (let i = 0; i < left.length; i += 1) {
    const a1 = left[i];
    const a2 = left[(i + 1) % left.length];

    for (let j = 0; j < right.length; j += 1) {
      const b1 = right[j];
      const b2 = right[(j + 1) % right.length];
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  if (pointInPolygon(left[0], right) || pointInPolygon(right[0], left)) {
    return true;
  }

  return false;
};