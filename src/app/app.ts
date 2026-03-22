import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import accountRoutes from '../routes/accountRoutes';
import areaRoutes from '../routes/areaRoutes';
import locationRoutes from '../routes/locationRoutes';
import animalTypeRoutes from '../routes/animalTypeRoutes';
import animalRoutes from '../routes/animalRoutes';
import { seedDefaultAccounts } from '../utils/seed';
import { errorHandler } from '../middleware/errorHandler';
import { LocationController } from '../controllers/locationController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { geohashQuerySchema } from '../validation/locationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', accountRoutes);
app.use('/areas', areaRoutes);
app.use('/locations', locationRoutes);
app.use('/animals/types', animalTypeRoutes);
app.use('/animals', animalRoutes);

const locationController = new LocationController();

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// GET /geohash - authenticated
app.get('/geohash', authenticateToken, validate({ query: geohashQuerySchema }), asyncHandler(locationController.getGeohash.bind(locationController)));

// Initialize default accounts
void seedDefaultAccounts();

app.use(errorHandler);

export default app;