import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { UserController } from '../controllers/userController.js';
import { AchievementController } from '../controllers/achievementController.js';
import {
  antiCheatMiddleware,
  resourceConsistencyCheck,
  temporalConsistencyCheck
} from '../middleware/antiCheat.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Route pour récupérer les infos de l'utilisateur connecté
router.get('/me', UserController.getCurrentUser);

// Route pour définir la carte favorite de profil
router.put(
  '/profile-favorite-card',
  antiCheatMiddleware('set_favorite_card', { maxPerMinute: 10, maxPerHour: 50, minDelay: 1000 }),
  UserController.setProfileFavoriteCard
);

// Route pour changer le mot de passe
router.put(
  '/change-password',
  antiCheatMiddleware('change_password', { maxPerMinute: 3, maxPerHour: 10, minDelay: 5000 }),
  UserController.changePassword
);

// Vérifications de cohérence sur toutes les routes
router.use(resourceConsistencyCheck);
router.use(temporalConsistencyCheck);

// Routes pour les collections
router.get('/collection', UserController.getCollection);
router.post('/collection', UserController.addCardsToCollection);
router.put(
  '/collection/favorite/:cardId',
  antiCheatMiddleware('toggle_favorite', { maxPerMinute: 30, maxPerHour: 500, minDelay: 200 }),
  UserController.toggleFavorite
);

// Routes pour les boosters
router.get('/booster-status', UserController.getBoosterStatus);
router.post(
  '/open-booster',
  antiCheatMiddleware('open_booster', { maxPerMinute: 10, maxPerHour: 100, minDelay: 1000 }),
  UserController.openBooster
);

// Routes pour les statistiques
router.get('/stats', UserController.getStats);

// Routes pour les Berrys
router.get('/berrys', UserController.getBerrysBalance);
router.post(
  '/sell-card',
  antiCheatMiddleware('sell_card', { maxPerMinute: 20, maxPerHour: 200, minDelay: 500 }),
  UserController.sellCard
);
router.post(
  '/buy-booster',
  antiCheatMiddleware('buy_booster', { maxPerMinute: 5, maxPerHour: 50, minDelay: 2000 }),
  UserController.buyBoosterWithBerrys
);

// Routes pour les récompenses quotidiennes
router.get('/daily-reward/check', UserController.checkDailyReward);
router.post(
  '/daily-reward/claim',
  antiCheatMiddleware('claim_daily_reward', { maxPerMinute: 2, maxPerHour: 5, minDelay: 5000 }),
  UserController.claimDailyReward
);

// Routes pour les achievements
router.get('/achievements', AchievementController.getUserAchievements);
router.get('/achievements/stats', AchievementController.getAchievementStats);
router.post(
  '/achievements/:achievementId/claim',
  antiCheatMiddleware('claim_achievement', { maxPerMinute: 10, maxPerHour: 100, minDelay: 1000 }),
  AchievementController.claimAchievement
);

export default router;