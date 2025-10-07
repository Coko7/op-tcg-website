import { Request, Response } from 'express';
import { Database } from '../utils/database.js';

interface RarityCount {
  secret_rare: number;
  super_rare: number;
  rare: number;
  uncommon: number;
  common: number;
}

interface LeaderboardEntry {
  username: string;
  user_id: string;
  secret_rare: number;
  super_rare: number;
  rare: number;
  uncommon: number;
  common: number;
  rank: number;
}

// Ordre des raretés de la plus rare à la moins rare pour le tri
const RARITY_ORDER = ['secret_rare', 'super_rare', 'rare', 'uncommon', 'common'] as const;

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      // Récupérer les statistiques de chaque joueur avec les comptages de cartes par rareté
      const usersStats = await Database.all<any>(`
        SELECT
          u.id as user_id,
          u.username,
          COUNT(CASE WHEN c.rarity = 'secret_rare' THEN 1 END) as secret_rare,
          COUNT(CASE WHEN c.rarity = 'super_rare' THEN 1 END) as super_rare,
          COUNT(CASE WHEN c.rarity = 'rare' THEN 1 END) as rare,
          COUNT(CASE WHEN c.rarity = 'uncommon' THEN 1 END) as uncommon,
          COUNT(CASE WHEN c.rarity = 'common' THEN 1 END) as common
        FROM users u
        LEFT JOIN user_collections uc ON u.id = uc.user_id
        LEFT JOIN cards c ON uc.card_id = c.id
        WHERE u.is_active = 1
        GROUP BY u.id, u.username
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

      // Prendre uniquement les 3 premiers
      const top3 = sortedUsers.slice(0, 3).map((user, index) => ({
        rank: index + 1,
        username: user.username,
        user_id: user.user_id,
        secret_rare: user.secret_rare,
        super_rare: user.super_rare,
        rare: user.rare,
        uncommon: user.uncommon,
        common: user.common
      }));

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
