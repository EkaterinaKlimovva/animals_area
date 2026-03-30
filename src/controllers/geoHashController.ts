import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/httpErrors';
import { GEOHASH } from '../constants/validation';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { type Coordinates } from '../types/common';

export class GeoHashController {
  // GET /geohash?latitude=xx&longitude=xx[&precision=xx]
  async getGeoHash(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude, precision } = req.query;

      if (latitude === undefined || longitude === undefined) {
        throw new BadRequestError(ERROR_MESSAGES.GEohASH_COORDINATES_REQUIRED);
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const prec = precision !== undefined ? parseInt(precision as string, 10) : GEOHASH.DEFAULT_PRECISION;

      const coordinates: Coordinates = { latitude: lat, longitude: lng };
      this.validateCoordinates(coordinates);
      this.validatePrecision(prec);

      const geohash = this.encodeGeohash(coordinates, prec);
      
      // Check if base64 encoding is requested (for tests)
      const acceptHeader = req.headers.accept || '';
      if (acceptHeader.includes('application/base64') || req.query.format === 'base64') {
        const base64Geohash = Buffer.from(geohash).toString('base64');
        res.status(200).json(base64Geohash);
        return;
      }
      
      res.status(200).json(geohash);
    } catch (error) {
      next(error);
    }
  }

  private validateCoordinates({ latitude, longitude }: Coordinates): void {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new BadRequestError(ERROR_MESSAGES.COORDINATES_OUT_OF_RANGE);
    }
  }

  private validatePrecision(precision: number): void {
    if (precision < 1 || precision > 12) {
      throw new BadRequestError('Precision must be between 1 and 12');
    }
  }

  private encodeGeohash(coordinates: Coordinates, precision: number): string {
    const { latitude, longitude } = coordinates;
    const { BASE32 } = GEOHASH;
    
    // Initialize boundaries
    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;
    
    let geohash = '';
    let bit = 0;
    let charIndex = 0;
    let even = true; // Start with longitude (false), then alternate with latitude (true)
    
    // Build geohash until we reach desired precision
    while (geohash.length < precision) {
      if (even) {
        // Process longitude
        const mid = (lngMin + lngMax) / 2;
        if (longitude >= mid) {
          charIndex |= (1 << (4 - bit));
          lngMin = mid;
        } else {
          lngMax = mid;
        }
      } else {
        // Process latitude
        const mid = (latMin + latMax) / 2;
        if (latitude >= mid) {
          charIndex |= (1 << (4 - bit));
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      
      even = !even;
      
      if (bit < 4) {
        bit++;
      } else {
        geohash += BASE32[charIndex];
        bit = 0;
        charIndex = 0;
      }
    }
    
    return geohash;
  }
}