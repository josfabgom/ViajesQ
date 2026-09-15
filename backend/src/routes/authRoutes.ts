import { Router } from 'express';
import { login, getMe, getMyPendingTrips, getMyPaymentHistory, getMyBalance } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get('/me/pending-trips', authMiddleware, getMyPendingTrips);
router.get('/me/payment-history', authMiddleware, getMyPaymentHistory);
router.get('/me/balance', authMiddleware, getMyBalance);

export default router;
