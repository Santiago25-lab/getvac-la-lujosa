import express from 'express';
import { getLaborCostsDashboard } from '../controllers/laborCostController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todos los costos laborales requieren acceso de Super Usuario o RRHH (según configuración, acá exigimos Super Usuario/RRHH)
router.get('/dashboard', authenticateToken, requireRole(['Super Usuario', 'Recursos Humanos', 'Gerencia']), getLaborCostsDashboard);

export default router;
