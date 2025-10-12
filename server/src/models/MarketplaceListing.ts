import { Database } from '../utils/database.js';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  card_id: string;
  price: number;
  created_at: string;
  status: 'active' | 'sold' | 'cancelled';
  buyer_id?: string;
  sold_at?: string;
}

export interface MarketplaceListingWithDetails extends MarketplaceListing {
  seller_username: string;
  card_name: string;
  card_rarity: string;
  card_image_url?: string;
  card_character: string;
}

export interface CreateListingData {
  seller_id: string;
  card_id: string;
  price: number;
}

export class MarketplaceListingModel {
  /**
   * Créer une nouvelle annonce sur le marketplace
   */
  static async create(data: CreateListingData): Promise<MarketplaceListing> {
    const { seller_id, card_id, price } = data;

    // Générer un ID unique pour l'annonce
    const id = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const created_at = new Date().toISOString();

    await Database.run(`
      INSERT INTO marketplace_listings (id, seller_id, card_id, price, created_at, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [id, seller_id, card_id, price, created_at]);

    const listing = await this.findById(id);
    if (!listing) {
      throw new Error('Erreur lors de la création de l\'annonce');
    }

    return listing;
  }

  /**
   * Trouver une annonce par son ID
   */
  static async findById(id: string): Promise<MarketplaceListing | undefined> {
    const listing = await Database.get<MarketplaceListing>(
      'SELECT * FROM marketplace_listings WHERE id = ?',
      [id]
    );

    return listing;
  }

  /**
   * Récupérer toutes les annonces actives avec les détails
   */
  static async getActiveListings(): Promise<MarketplaceListingWithDetails[]> {
    const listings = await Database.all<MarketplaceListingWithDetails>(`
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
      WHERE ml.status = 'active'
      ORDER BY ml.created_at DESC
    `);

    return listings;
  }

  /**
   * Récupérer les annonces d'un vendeur spécifique
   */
  static async getSellerListings(seller_id: string): Promise<MarketplaceListingWithDetails[]> {
    const listings = await Database.all<MarketplaceListingWithDetails>(`
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
      WHERE ml.seller_id = ?
      ORDER BY ml.created_at DESC
    `, [seller_id]);

    return listings;
  }

  /**
   * Compter le nombre d'annonces actives d'un vendeur
   */
  static async countActiveListingsBySeller(seller_id: string): Promise<number> {
    const result = await Database.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM marketplace_listings WHERE seller_id = ? AND status = \'active\'',
      [seller_id]
    );
    return result?.count || 0;
  }

  /**
   * Marquer une annonce comme vendue
   */
  static async markAsSold(id: string, buyer_id: string): Promise<void> {
    const sold_at = new Date().toISOString();

    await Database.run(`
      UPDATE marketplace_listings
      SET status = 'sold', buyer_id = ?, sold_at = ?
      WHERE id = ?
    `, [buyer_id, sold_at, id]);
  }

  /**
   * Annuler une annonce
   */
  static async cancel(id: string): Promise<void> {
    await Database.run(`
      UPDATE marketplace_listings
      SET status = 'cancelled'
      WHERE id = ?
    `, [id]);
  }

  /**
   * Supprimer les anciennes annonces (nettoyage)
   */
  static async cleanupOldListings(daysOld: number = 30): Promise<number> {
    const result = await Database.run(`
      DELETE FROM marketplace_listings
      WHERE status IN ('sold', 'cancelled')
        AND datetime(created_at) < datetime('now', '-' || ? || ' days')
    `, [daysOld]);

    return result.changes || 0;
  }
}
