import { Request, Response } from 'express';
import { MarketplaceListingModel } from '../models/MarketplaceListing.js';
import { UserModel } from '../models/User.js';
import { CardModel } from '../models/Card.js';
import { Database } from '../utils/database.js';
import { AuditLogger, AuditAction } from '../utils/auditLogger.js';

// Configuration du marketplace
const MAX_LISTINGS_PER_USER = 3;
const MIN_PRICE = 1;
const MAX_PRICE = 999999;

export class MarketplaceController {
  /**
   * Récupérer toutes les annonces actives du marketplace
   */
  static async getListings(req: Request, res: Response): Promise<void> {
    try {
      const listings = await MarketplaceListingModel.getActiveListings();

      // Transformer les couleurs JSON
      const transformedListings = listings.map(listing => ({
        ...listing,
        card_color: listing.card_rarity ? undefined : undefined // Les couleurs sont déjà dans les cartes
      }));

      res.json({
        success: true,
        data: transformedListings
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des annonces:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupérer les annonces d'un utilisateur
   */
  static async getMyListings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const listings = await MarketplaceListingModel.getSellerListings(userId);

      res.json({
        success: true,
        data: listings
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des annonces utilisateur:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Créer une nouvelle annonce
   */
  static async createListing(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { cardId, price } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      // SÉCURITÉ: Validation des entrées
      if (!cardId || typeof cardId !== 'string') {
        res.status(400).json({ error: 'Card ID invalide' });
        return;
      }

      const parsedPrice = parseInt(price, 10);
      if (isNaN(parsedPrice) || parsedPrice < MIN_PRICE || parsedPrice > MAX_PRICE) {
        res.status(400).json({
          error: `Le prix doit être entre ${MIN_PRICE} et ${MAX_PRICE} Berrys`
        });
        return;
      }

      // SÉCURITÉ: Vérifier la limite d'annonces par utilisateur
      const activeListingsCount = await MarketplaceListingModel.countActiveListingsBySeller(userId);
      if (activeListingsCount >= MAX_LISTINGS_PER_USER) {
        res.status(403).json({
          error: `Vous ne pouvez avoir que ${MAX_LISTINGS_PER_USER} annonces actives maximum`,
          current_count: activeListingsCount
        });
        return;
      }

      // SÉCURITÉ: Transaction atomique pour vérifier et créer l'annonce
      let listingId: string | null = null;

      await Database.transaction(async () => {
        // 1. Vérifier que l'utilisateur possède cette carte
        const userCard = await Database.get(`
          SELECT uc.*, c.is_active
          FROM user_collections uc
          JOIN cards c ON uc.card_id = c.id
          WHERE uc.user_id = ? AND uc.card_id = ?
        `, [userId, cardId]);

        if (!userCard) {
          throw new Error('Carte non trouvée dans votre collection');
        }

        // 2. SÉCURITÉ CRITIQUE: Vérifier que l'utilisateur a AU MOINS 2 exemplaires
        if (userCard.quantity < 2) {
          throw new Error('Vous devez posséder au moins 2 exemplaires de cette carte pour la vendre');
        }

        // 3. Vérifier que la carte est active
        if (!userCard.is_active) {
          throw new Error('Cette carte ne peut plus être vendue');
        }

        // 4. Vérifier que la carte n'est pas déjà en vente
        const existingListing = await Database.get(`
          SELECT id FROM marketplace_listings
          WHERE seller_id = ? AND card_id = ? AND status = 'active'
        `, [userId, cardId]);

        if (existingListing) {
          throw new Error('Vous avez déjà une annonce active pour cette carte');
        }

        // 5. Créer l'annonce
        const listing = await MarketplaceListingModel.create({
          seller_id: userId,
          card_id: cardId,
          price: parsedPrice
        });

        listingId = listing.id;
      });

      // Récupérer les détails de l'annonce créée
      const listing = await Database.get(`
        SELECT
          ml.*,
          u.username as seller_username,
          c.name as card_name,
          c.rarity as card_rarity,
          c.image_url as card_image_url,
          c.character as card_character
        FROM marketplace_listings ml
        JOIN users u ON ml.seller_id = u.id
        JOIN cards c ON ml.card_id = c.id
        WHERE ml.id = ?
      `, [listingId]);

      // AUDIT: Log création d'annonce
      await AuditLogger.logSuccess(AuditAction.MARKETPLACE_LISTING_CREATED, userId, {
        listingId,
        cardId,
        price: parsedPrice
      }, req);

      res.json({
        success: true,
        data: listing
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'annonce:', error);

      // AUDIT: Log échec
      if (error.message) {
        await AuditLogger.logFailure(AuditAction.MARKETPLACE_LISTING_CREATED, {
          reason: error.message,
          userId: req.user?.id
        }, req, req.user?.id);
      }

      res.status(400).json({
        error: error.message || 'Erreur serveur'
      });
    }
  }

  /**
   * Acheter une carte sur le marketplace
   */
  static async purchaseListing(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { listingId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      // SÉCURITÉ: Validation de l'ID
      if (!listingId || typeof listingId !== 'string') {
        res.status(400).json({ error: 'Listing ID invalide' });
        return;
      }

      let purchaseData: any = null;

      // SÉCURITÉ: Transaction atomique complète pour éviter toute fraude
      await Database.transaction(async () => {
        // 1. Récupérer l'annonce avec LOCK
        const listing = await Database.get(`
          SELECT * FROM marketplace_listings WHERE id = ?
        `, [listingId]);

        if (!listing) {
          throw new Error('Annonce non trouvée');
        }

        // 2. SÉCURITÉ: Vérifier que l'annonce est active
        if (listing.status !== 'active') {
          throw new Error('Cette annonce n\'est plus disponible');
        }

        // 3. SÉCURITÉ: Empêcher l'auto-achat
        if (listing.seller_id === userId) {
          throw new Error('Vous ne pouvez pas acheter votre propre annonce');
        }

        // 4. Récupérer l'acheteur pour vérifier son solde
        const buyer = await UserModel.findById(userId);
        if (!buyer) {
          throw new Error('Utilisateur non trouvé');
        }

        // 5. SÉCURITÉ: Vérifier que l'acheteur a assez de Berrys
        const buyerBerrys = buyer.berrys || 0;
        if (buyerBerrys < listing.price) {
          throw new Error(`Berrys insuffisants. Requis: ${listing.price}, Disponible: ${buyerBerrys}`);
        }

        // 6. SÉCURITÉ: Vérifier que le vendeur possède toujours la carte (protection anti-fraude)
        const sellerCard = await Database.get(`
          SELECT * FROM user_collections
          WHERE user_id = ? AND card_id = ?
        `, [listing.seller_id, listing.card_id]);

        if (!sellerCard || sellerCard.quantity < 1) {
          // Annuler l'annonce automatiquement
          await Database.run(`
            UPDATE marketplace_listings SET status = 'cancelled' WHERE id = ?
          `, [listingId]);
          throw new Error('Le vendeur ne possède plus cette carte');
        }

        // 7. Récupérer les informations de la carte pour le retour
        const card = await CardModel.findById(listing.card_id);
        if (!card) {
          throw new Error('Carte non trouvée');
        }

        // 8. TRANSACTION ATOMIQUE: Déduire les Berrys de l'acheteur
        const buyerUpdate = await Database.run(`
          UPDATE users
          SET berrys = berrys - ?
          WHERE id = ? AND berrys >= ?
        `, [listing.price, userId, listing.price]);

        if (buyerUpdate.changes === 0) {
          throw new Error('Transaction refusée: Berrys insuffisants');
        }

        // 9. Ajouter les Berrys au vendeur
        await Database.run(`
          UPDATE users
          SET berrys = COALESCE(berrys, 0) + ?
          WHERE id = ?
        `, [listing.price, listing.seller_id]);

        // 10. Retirer la carte de la collection du vendeur
        await Database.run(`
          UPDATE user_collections
          SET quantity = quantity - 1
          WHERE user_id = ? AND card_id = ? AND quantity >= 1
        `, [listing.seller_id, listing.card_id]);

        // 11. Ajouter la carte à la collection de l'acheteur
        const buyerCard = await Database.get(`
          SELECT * FROM user_collections
          WHERE user_id = ? AND card_id = ?
        `, [userId, listing.card_id]);

        if (buyerCard) {
          // L'acheteur a déjà cette carte, augmenter la quantité
          await Database.run(`
            UPDATE user_collections
            SET quantity = quantity + 1
            WHERE user_id = ? AND card_id = ?
          `, [userId, listing.card_id]);
        } else {
          // Nouvelle carte pour l'acheteur
          await Database.run(`
            INSERT INTO user_collections (user_id, card_id, quantity, obtained_at, is_favorite)
            VALUES (?, ?, 1, ?, 0)
          `, [userId, listing.card_id, new Date().toISOString()]);
        }

        // 12. Marquer l'annonce comme vendue
        await MarketplaceListingModel.markAsSold(listingId, userId);

        // 13. Récupérer les nouveaux soldes
        const updatedBuyer = await UserModel.findById(userId);
        const updatedSeller = await UserModel.findById(listing.seller_id);

        purchaseData = {
          card,
          price: listing.price,
          seller_username: updatedSeller?.username,
          buyer_new_balance: updatedBuyer?.berrys || 0,
          seller_new_balance: updatedSeller?.berrys || 0
        };
      });

      // AUDIT: Log achat réussi
      await AuditLogger.logSuccess(AuditAction.MARKETPLACE_PURCHASE, userId, {
        listingId,
        cardId: purchaseData.card.id,
        price: purchaseData.price,
        newBalance: purchaseData.buyer_new_balance
      }, req);

      res.json({
        success: true,
        data: {
          card: purchaseData.card,
          price: purchaseData.price,
          new_balance: purchaseData.buyer_new_balance
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'achat:', error);

      // AUDIT: Log échec
      if (error.message) {
        await AuditLogger.logFailure(AuditAction.MARKETPLACE_PURCHASE, {
          reason: error.message,
          userId: req.user?.id,
          listingId: req.params.listingId
        }, req, req.user?.id);
      }

      res.status(400).json({
        error: error.message || 'Erreur serveur'
      });
    }
  }

  /**
   * Annuler une annonce
   */
  static async cancelListing(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { listingId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      // SÉCURITÉ: Validation de l'ID
      if (!listingId || typeof listingId !== 'string') {
        res.status(400).json({ error: 'Listing ID invalide' });
        return;
      }

      // Récupérer l'annonce
      const listing = await MarketplaceListingModel.findById(listingId);

      if (!listing) {
        res.status(404).json({ error: 'Annonce non trouvée' });
        return;
      }

      // SÉCURITÉ: Vérifier que l'utilisateur est bien le vendeur
      if (listing.seller_id !== userId) {
        res.status(403).json({ error: 'Vous n\'êtes pas autorisé à annuler cette annonce' });
        return;
      }

      // SÉCURITÉ: Vérifier que l'annonce est active
      if (listing.status !== 'active') {
        res.status(400).json({ error: 'Cette annonce ne peut plus être annulée' });
        return;
      }

      // Annuler l'annonce
      await MarketplaceListingModel.cancel(listingId);

      // AUDIT: Log annulation
      await AuditLogger.logSuccess(AuditAction.MARKETPLACE_LISTING_CANCELLED, userId, {
        listingId,
        cardId: listing.card_id
      }, req);

      res.json({
        success: true,
        message: 'Annonce annulée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'annonce:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}
