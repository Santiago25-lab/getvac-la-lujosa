import express from 'express';
import { getLaborCostsDashboard } from '../controllers/laborCostController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

// Todos los costos laborales requieren acceso de Super Usuario o RRHH (según configuración, acá exigimos Super Usuario/RRHH)
router.get('/dashboard', authenticateToken, requireRole(['Super Usuario', 'Recursos Humanos', 'Gerencia']), getLaborCostsDashboard);

export default router;
