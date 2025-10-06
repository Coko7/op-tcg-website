import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { UserController } from '../controllers/userController.js';
import { AchievementController } from '../controllers/achievementController.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les collections
router.get('/collection', UserController.getCollection);
router.post('/collection', UserController.addCardsToCollection);
router.put('/collection/favorite/:cardId', UserController.toggleFavorite);

// Routes pour les boosters
router.get('/booster-status', UserController.getBoosterStatus);
router.post('/open-booster', UserController.openBooster);

// Routes pour les statistiques
router.get('/stats', UserController.getStats);

// Routes pour les Berrys
router.get('/berrys', UserController.getBerrysBalance);
router.post('/sell-card', UserController.sellCard);
router.post('/buy-booster', UserController.buyBoosterWithBerrys);

// Routes pour les achievements
router.get('/achievements', AchievementController.getUserAchievements);
router.get('/achievements/stats', AchievementController.getAchievementStats);
router.post('/achievements/:achievementId/claim', AchievementController.claimAchievement);

export default router;