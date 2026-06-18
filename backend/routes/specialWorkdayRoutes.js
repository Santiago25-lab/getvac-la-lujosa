import express from 'express';
import { 
  getSpecialWorkdays, 
  createSpecialWorkday, 
  updateSpecialWorkday, 
  deleteSpecialWorkday 
} from '../controllers/specialWorkdayController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken); // Todas las rutas requieren estar logueado

router.get('/', getSpecialWorkdays);
router.post('/', createSpecialWorkday);
router.put('/:id', updateSpecialWorkday);
router.delete('/:id', deleteSpecialWorkday);

export default router;
