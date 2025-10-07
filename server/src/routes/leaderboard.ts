import express from 'express';
import { LeaderboardController } from '../controllers/leaderboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Route pour obtenir le leaderboard (protégée)
router.get('/', authenticateToken, LeaderboardController.getLeaderboard);

export default router;
