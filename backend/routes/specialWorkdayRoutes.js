import express from 'express';
import { 
  getSpecialWorkdays, 
  createSpecialWorkday, 
  updateSpecialWorkday, 
  deleteSpecialWorkday 
} from '../controllers/specialWorkdayController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de Super Administrador
router.use(authenticateToken);
router.use(requireRole(['Super Administrador']));

router.get('/', getSpecialWorkdays);
router.post('/', createSpecialWorkday);
router.put('/:id', updateSpecialWorkday);
router.delete('/:id', deleteSpecialWorkday);

export default router;
