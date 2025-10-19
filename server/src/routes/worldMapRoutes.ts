import { Router } from 'express';
import { WorldMapController } from '../controllers/worldMapController.js';
import { authenticateToken } from '../middleware/auth.js';
import { antiCheatMiddleware } from '../middleware/antiCheat.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// GET map data (islands, quests, crew, progress)
router.get('/map', WorldMapController.getMapData);

// GET user crew
router.get('/crew', WorldMapController.getUserCrew);

// GET quest history
router.get('/quests/history', WorldMapController.getQuestHistory);

// POST start quest
router.post(
  '/quests/start',
  antiCheatMiddleware('start_quest'),
  WorldMapController.startQuest
);

// POST complete and claim quest reward
router.post(
  '/quests/:activeQuestId/complete',
  antiCheatMiddleware('complete_quest'),
  WorldMapController.completeQuest
);

// POST claim island final reward
router.post(
  '/islands/:islandId/claim',
  antiCheatMiddleware('claim_island_reward'),
  WorldMapController.claimIslandReward
);

export default router;
