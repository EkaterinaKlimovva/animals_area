import { Router } from 'express';
import { GeoHashController } from '../controllers/geoHashController';
import { validateRequest } from '../middleware/validateRequest';
import { geoHashQuerySchema } from '../validation/geoHashSchemas';

const router = Router();
const geoHashController = new GeoHashController();

// GET /geohash?latitude=xx&longitude=xx
router.get('/', geoHashController.getGeoHash.bind(geoHashController));

export default router;
