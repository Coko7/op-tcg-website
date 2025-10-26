import { Request, Response } from 'express';
import { Database } from '../utils/database.js';

interface RarityCount {
  secret_rare: number;
  super_rare: number;
  leader: number;
  rare: number;
  uncommon: number;
  common: number;
}

interface LeaderboardEntry {
  username: string;
  secret_rare: number;
  super_rare: number;
  leader: number;
  rare: number;
  uncommon: number;
  common: number;
  rank: number;
  favorite_card_id?: string | null;
  favorite_card_name?: string | null;
  favorite_card_image?: string | null;
  favorite_card_rarity?: string | null;
}

// Ordre des raretés de la plus rare à la moins rare pour le tri
// Leader est plus rare que Rare mais moins rare que SuperRare
const RARITY_ORDER = ['secret_rare', 'super_rare', 'leader', 'rare', 'uncommon', 'common'] as const;

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      // Récupérer les statistiques de chaque joueur avec les comptages de cartes par rareté
      const usersStats = await Database.all<any>(`
        SELECT
          u.id as user_id,
          u.username,
          u.favorite_card_id,
          COUNT(CASE WHEN c.rarity = 'secret_rare' THEN 1 END) as secret_rare,
          COUNT(CASE WHEN c.rarity = 'super_rare' THEN 1 END) as super_rare,
          COUNT(CASE WHEN c.rarity = 'leader' THEN 1 END) as leader,
          COUNT(CASE WHEN c.rarity = 'rare' THEN 1 END) as rare,
          COUNT(CASE WHEN c.rarity = 'uncommon' THEN 1 END) as uncommon,
          COUNT(CASE WHEN c.rarity = 'common' THEN 1 END) as common
        FROM users u
        LEFT JOIN user_collections uc ON u.id = uc.user_id
        LEFT JOIN cards c ON uc.card_id = c.id
        WHERE u.is_active = 1
        GROUP BY u.id, u.username, u.favorite_card_id
      `);

      // Trier les joueurs selon les règles :
      // 1. Plus de cartes de la rareté la plus élevée
      // 2. En cas d'égalité, départage par la rareté directement inférieure
      const sortedUsers = usersStats.sort((a, b) => {
        for (const rarity of RARITY_ORDER) {
          const diff = b[rarity] - a[rarity];
          if (diff !== 0) return diff;
        }
        return 0; // Égalité parfaite
      });

      // Prendre uniquement les 3 premiers et enrichir avec les infos de carte favorite
      const top3 = await Promise.all(
        sortedUsers.slice(0, 3).map(async (user, index) => {
          const entry: LeaderboardEntry = {
            rank: index + 1,
            username: user.username,
            secret_rare: user.secret_rare,
            super_rare: user.super_rare,
            leader: user.leader,
            rare: user.rare,
            uncommon: user.uncommon,
            common: user.common,
            favorite_card_id: user.favorite_card_id || null
          };

          // Récupérer les détails de la carte favorite si elle existe
          if (user.favorite_card_id) {
            const favoriteCard = await Database.get<any>(`
              SELECT id, name, image_url, fallback_image_url, rarity
              FROM cards
              WHERE id = ? AND is_active = 1
            `, [user.favorite_card_id]);

            if (favoriteCard) {
              entry.favorite_card_name = favoriteCard.name;
              entry.favorite_card_image = favoriteCard.image_url || favoriteCard.fallback_image_url;
              entry.favorite_card_rarity = favoriteCard.rarity;
            }
          }

          return entry;
        })
      );

      res.json({
        success: true,
        leaderboard: top3
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du leaderboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du leaderboard'
      });
    }
  }
}
