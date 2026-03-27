import { BadRequestError } from '../errors/httpErrors';
import { AREA_VALIDATION } from '../constants/validation';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { type Coordinates } from '../types/common';

export interface AreaPoint extends Coordinates {}

const samePoint = (a: AreaPoint, b: AreaPoint) =>
  Math.abs(a.latitude - b.latitude) < AREA_VALIDATION.EPSILON && 
  Math.abs(a.longitude - b.longitude) < AREA_VALIDATION.EPSILON;

const orientation = (a: AreaPoint, b: AreaPoint, c: AreaPoint) => {
  const value = (b.longitude - a.longitude) * (c.latitude - b.latitude)
    - (b.latitude - a.latitude) * (c.longitude - b.longitude);

  if (Math.abs(value) < AREA_VALIDATION.EPSILON) {
    return 0;
  }

  return value > 0 ? 1 : 2;
};

const onSegment = (a: AreaPoint, b: AreaPoint, c: AreaPoint) => {
  return b.longitude <= Math.max(a.longitude, c.longitude) + AREA_VALIDATION.EPSILON
    && b.longitude + AREA_VALIDATION.EPSILON >= Math.min(a.longitude, c.longitude)
    && b.latitude <= Math.max(a.latitude, c.latitude) + AREA_VALIDATION.EPSILON
    && b.latitude + AREA_VALIDATION.EPSILON >= Math.min(a.latitude, c.latitude);
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
        < ((xj - xi) * (point.latitude - yi)) / ((yj - yi) || AREA_VALIDATION.EPSILON) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

export const validateAreaPoints = (areaPoints: AreaPoint[]): void => {
  if (!Array.isArray(areaPoints) || areaPoints.length < AREA_VALIDATION.MIN_POINTS) {
    throw new BadRequestError(ERROR_MESSAGES.AREA_MIN_POINTS);
  }

  for (const point of areaPoints) {
    if (!point) {
      throw new BadRequestError('Area point is required');
    }
    if (point.latitude < -90 || point.latitude > 90 || point.longitude < -180 || point.longitude > 180) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_COORDINATES);
    }
  }

  const uniquePoints = new Set(areaPoints.map((point) => `${point.latitude}:${point.longitude}`));
  if (uniquePoints.size !== areaPoints.length) {
    throw new BadRequestError(ERROR_MESSAGES.AREA_DUPLICATE_POINTS);
  }

  // Check for collinear points
  if (areaPoints.length >= 3) {
    const base = areaPoints[0];
    const allCollinear = areaPoints.slice(2).every((point) => orientation(base, areaPoints[1], point) === 0);
    if (allCollinear) {
      throw new BadRequestError(ERROR_MESSAGES.AREA_COLLINEAR);
    }
  }

  // Check if polygon crosses antimeridian
  const lons = areaPoints.map(p => p.longitude);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  
  const lonSpan = maxLon - minLon;
  if (lonSpan > AREA_VALIDATION.MAX_LON_SPAN) {
    throw new BadRequestError(ERROR_MESSAGES.AREA_ANTIMERIDIAN);
  }
  
  // Check if polygon spans across antimeridian by detecting wraparound
  // A polygon crosses antimeridian if it has points on both sides and the span is > 180 degrees when considering wraparound
  const hasPositiveLon = lons.some(lon => lon >= 0);
  const hasNegativeLon = lons.some(lon => lon < 0);
  
  if (hasPositiveLon && hasNegativeLon) {
    // Calculate the actual span considering wraparound
    const positiveLons = lons.filter(lon => lon >= 0);
    const negativeLons = lons.filter(lon => lon < 0);
    
    const minPos = positiveLons.length > 0 ? Math.min(...positiveLons) : 180;
    const maxNeg = negativeLons.length > 0 ? Math.max(...negativeLons) : -180;
    
    const wraparoundSpan = (180 - minPos) + (maxNeg + 180);
    if (wraparoundSpan < AREA_VALIDATION.MAX_LON_SPAN) {
      throw new BadRequestError(ERROR_MESSAGES.AREA_ANTIMERIDIAN);
    }
  }
  
  // Also check if any edge crosses the antimeridian
  const crossesAntimeridian = areaPoints.some((point, i) => {
    const nextPoint = areaPoints[(i + 1) % areaPoints.length];
    const lonDiff = Math.abs(point.longitude - nextPoint.longitude);
    return lonDiff > AREA_VALIDATION.MAX_LON_SPAN;
  });
  if (crossesAntimeridian) {
    throw new BadRequestError(ERROR_MESSAGES.AREA_ANTIMERIDIAN);
  }

  // Check if polygon is too small (degenerate)
  const minLat = Math.min(...areaPoints.map(p => p.latitude));
  const maxLat = Math.max(...areaPoints.map(p => p.latitude));
  
  const latSpan = maxLat - minLat;
  
  if (latSpan < AREA_VALIDATION.MIN_AREA_SIZE || lonSpan < AREA_VALIDATION.MIN_AREA_SIZE) {
    throw new BadRequestError(ERROR_MESSAGES.AREA_TOO_SMALL);
  }

  // Check for self-intersecting polygon
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
        throw new BadRequestError(ERROR_MESSAGES.AREA_SELF_INTERSECT);
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