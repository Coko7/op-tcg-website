import { Request, Response } from 'express';
import { AchievementModel } from '../models/Achievement.js';

export class AchievementController {
  // Obtenir tous les achievements de l'utilisateur avec progression
  static async getUserAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      console.log('👤 getUserAchievements - User ID:', userId);

      if (!userId) {
        console.log('❌ Utilisateur non authentifié');
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      console.log('🔍 Récupération des achievements pour user:', userId);
      const achievements = await AchievementModel.getUserAchievements(userId);
      console.log('✅ Achievements récupérés:', achievements.length);

      res.json({
        success: true,
        data: achievements
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des achievements:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Récupérer les récompenses d'un achievement
  static async claimAchievement(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { achievementId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      if (!achievementId) {
        res.status(400).json({ error: 'Achievement ID requis' });
        return;
      }

      const berrysEarned = await AchievementModel.claimAchievement(userId, achievementId);

      res.json({
        success: true,
        data: {
          berrys_earned: berrysEarned
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'achievement:', error);
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Obtenir les statistiques des achievements
  static async getAchievementStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      console.log('📊 getAchievementStats - User ID:', userId);

      if (!userId) {
        console.log('❌ Utilisateur non authentifié pour les stats');
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      console.log('🔍 Récupération des stats pour user:', userId);
      const stats = await AchievementModel.getUserStats(userId);
      console.log('✅ Stats récupérées:', stats);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats achievements:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Lister tous les achievements disponibles (pour admin)
  static async listAllAchievements(req: Request, res: Response): Promise<void> {
    try {
      const achievements = await AchievementModel.list();

      res.json({
        success: true,
        data: achievements
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des achievements:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}
