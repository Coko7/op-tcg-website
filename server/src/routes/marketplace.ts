import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplaceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Toutes les routes marketplace nécessitent une authentification
router.use(authenticateToken);

// Récupérer toutes les annonces actives
router.get('/listings', MarketplaceController.getListings);

// Récupérer mes annonces
router.get('/my-listings', MarketplaceController.getMyListings);

// Créer une nouvelle annonce
router.post('/listings', MarketplaceController.createListing);

// Acheter une carte
router.post('/listings/:listingId/purchase', MarketplaceController.purchaseListing);

// Annuler une annonce
router.delete('/listings/:listingId', MarketplaceController.cancelListing);

export default router;
