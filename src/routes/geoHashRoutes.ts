import { Router } from 'express';
import { GeoHashController } from '../controllers/geoHashController';

const router = Router();
const geoHashController = new GeoHashController();

// GET /geohash?latitude=xx&longitude=xx
router.get('/', geoHashController.getGeoHash.bind(geoHashController));

export default router;
