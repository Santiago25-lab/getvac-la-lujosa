import express from 'express';
import { getBenefitPaymentsByEmployee, createBenefitPayment } from '../controllers/benefitPaymentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/employee/:employeeId', authenticateToken, getBenefitPaymentsByEmployee);
router.post('/employee/:employeeId', authenticateToken, createBenefitPayment);

export default router;
