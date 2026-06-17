import express from 'express';
import { createNovelty, getNovelties, updateNovelty, deleteNovelty } from '../controllers/noveltyController.js';
import { upload } from '../middleware/upload.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas de novedades son para RRHH o Administradores
router.use(authenticateToken);
router.use(requireRole(['Super Usuario', 'Administrador', 'Recursos Humanos']));

router.get('/', getNovelties);
router.post('/', upload.array('attachments', 5), createNovelty);
router.put('/:id', upload.array('attachments', 5), updateNovelty);
router.delete('/:id', deleteNovelty);

export default router;
