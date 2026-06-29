import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getAnalyticsDashboard } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, getAnalyticsDashboard);

export default router;
