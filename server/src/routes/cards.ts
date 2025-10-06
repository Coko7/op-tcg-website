import { Router } from 'express';
import { CardController } from '../controllers/cardController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';

const router = Router();

// Routes publiques avec authentification optionnelle
router.get('/cards', optionalAuth, validatePagination, CardController.getCards);
router.get('/cards/:id', optionalAuth, CardController.getCard);

router.get('/boosters', optionalAuth, validatePagination, CardController.getBoosters);
router.get('/boosters/:id', optionalAuth, CardController.getBooster);
router.get('/boosters/:boosterId/cards/:rarity', optionalAuth, CardController.getCardsByRarity);

router.get('/stats', optionalAuth, CardController.getStats);

export default router;