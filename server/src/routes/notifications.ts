import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { NotificationController } from '../controllers/notificationController.js';
import { antiCheatMiddleware } from '../middleware/antiCheat.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes utilisateur
router.get('/', NotificationController.getUserNotifications);
router.post(
  '/:notificationId/claim',
  antiCheatMiddleware('claim_notification', { maxPerMinute: 10, maxPerHour: 100, minDelay: 1000 }),
  NotificationController.claimNotificationReward
);

export default router;
