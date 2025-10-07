import express from 'express';
import { LeaderboardController } from '../controllers/leaderboardController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Route pour obtenir le leaderboard (protégée)
router.get('/', authMiddleware, LeaderboardController.getLeaderboard);

export default router;
