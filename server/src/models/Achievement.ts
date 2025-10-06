import { Database } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export type AchievementType = 'boosters_opened' | 'unique_cards' | 'booster_cards';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  category: string;
  icon?: string;
  threshold: number;
  reward_berrys: number;
  booster_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  completed_at?: string;
  is_claimed: boolean;
  claimed_at?: string;
}

export interface AchievementWithProgress extends Achievement {
  progress: number;
  completed_at?: string;
  is_claimed: boolean;
  claimed_at?: string;
  completion_percentage: number;
}

export interface AchievementCreate {
  name: string;
  description: string;
  type: AchievementType;
  category: string;
  icon?: string;
  threshold: number;
  reward_berrys: number;
  booster_id?: string;
}

export class AchievementModel {
  // Créer un achievement
  static async create(data: AchievementCreate): Promise<Achievement> {
    const id = uuidv4();

    await Database.run(
      `INSERT INTO achievements (id, name, description, type, category, icon, threshold, reward_berrys, booster_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.description, data.type, data.category, data.icon || null, data.threshold, data.reward_berrys, data.booster_id || null]
    );

    const achievement = await this.findById(id);
    if (!achievement) {
      throw new Error('Erreur lors de la création de l\'achievement');
    }

    return achievement;
  }

  // Trouver un achievement par ID
  static async findById(id: string): Promise<Achievement | undefined> {
    return await Database.get<Achievement>(
      'SELECT * FROM achievements WHERE id = ?',
      [id]
    );
  }

  // Liste tous les achievements actifs
  static async listActive(): Promise<Achievement[]> {
    return await Database.all<Achievement>(
      'SELECT * FROM achievements WHERE is_active = 1 ORDER BY category, threshold'
    );
  }

  // Liste tous les achievements
  static async list(): Promise<Achievement[]> {
    return await Database.all<Achievement>(
      'SELECT * FROM achievements ORDER BY category, threshold'
    );
  }

  // Obtenir les achievements d'un utilisateur avec progression
  static async getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
    console.log('🔍 getUserAchievements model - userId:', userId);

    const achievements = await Database.all<any>(`
      SELECT
        a.*,
        COALESCE(ua.progress, 0) as progress,
        ua.completed_at,
        COALESCE(ua.is_claimed, 0) as is_claimed,
        ua.claimed_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      WHERE a.is_active = 1
      ORDER BY a.category, a.threshold
    `, [userId]);

    console.log('📊 Raw achievements from DB:', achievements.length);
    if (achievements.length > 0) {
      console.log('First achievement:', achievements[0]);
    }

    const result = achievements.map(a => ({
      ...a,
      is_claimed: a.is_claimed === 1,
      completion_percentage: Math.min(100, Math.round((a.progress / a.threshold) * 100))
    }));

    console.log('✅ Mapped achievements:', result.length);
    return result;
  }

  // Mettre à jour la progression d'un achievement
  static async updateProgress(userId: string, achievementId: string, progress: number): Promise<void> {
    // Vérifier si l'achievement existe pour cet utilisateur
    const existing = await Database.get(`
      SELECT * FROM user_achievements
      WHERE user_id = ? AND achievement_id = ?
    `, [userId, achievementId]);

    if (existing) {
      // Mettre à jour seulement si le nouveau progress est supérieur
      if (progress > existing.progress) {
        // Vérifier si l'achievement est complété
        const achievement = await this.findById(achievementId);
        const isCompleted = achievement && progress >= achievement.threshold;

        await Database.run(`
          UPDATE user_achievements
          SET progress = ?,
              completed_at = CASE WHEN ? AND completed_at IS NULL THEN datetime('now') ELSE completed_at END
          WHERE user_id = ? AND achievement_id = ?
        `, [progress, isCompleted ? 1 : 0, userId, achievementId]);
      }
    } else {
      // Créer une nouvelle entrée
      const achievement = await this.findById(achievementId);
      const isCompleted = achievement && progress >= achievement.threshold;

      await Database.run(`
        INSERT INTO user_achievements (id, user_id, achievement_id, progress, completed_at, is_claimed)
        VALUES (?, ?, ?, ?, ?, 0)
      `, [uuidv4(), userId, achievementId, progress, isCompleted ? new Date().toISOString() : null]);
    }
  }

  // Récupérer un achievement non réclamé
  static async claimAchievement(userId: string, achievementId: string): Promise<number> {
    // Vérifier si l'achievement est complété et non réclamé
    const userAchievement = await Database.get<any>(`
      SELECT ua.*, a.reward_berrys, a.threshold
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ? AND ua.achievement_id = ? AND ua.is_claimed = 0
    `, [userId, achievementId]);

    if (!userAchievement) {
      throw new Error('Achievement non trouvé ou déjà réclamé');
    }

    if (userAchievement.progress < userAchievement.threshold) {
      throw new Error('Achievement non complété');
    }

    // Marquer comme réclamé
    await Database.run(`
      UPDATE user_achievements
      SET is_claimed = 1, claimed_at = datetime('now')
      WHERE user_id = ? AND achievement_id = ?
    `, [userId, achievementId]);

    // Ajouter les Berrys à l'utilisateur
    await Database.run(`
      UPDATE users
      SET berrys = COALESCE(berrys, 0) + ?
      WHERE id = ?
    `, [userAchievement.reward_berrys, userId]);

    return userAchievement.reward_berrys;
  }

  // Obtenir les stats d'achievements d'un utilisateur
  static async getUserStats(userId: string): Promise<{
    total: number;
    completed: number;
    claimed: number;
    unclaimed: number;
    total_berrys_earned: number;
    total_berrys_available: number;
  }> {
    const stats = await Database.get<any>(`
      SELECT
        COUNT(DISTINCT a.id) as total,
        COUNT(DISTINCT CASE WHEN ua.progress >= a.threshold THEN ua.achievement_id END) as completed,
        COUNT(DISTINCT CASE WHEN ua.is_claimed = 1 THEN ua.achievement_id END) as claimed,
        COUNT(DISTINCT CASE WHEN ua.progress >= a.threshold AND ua.is_claimed = 0 THEN ua.achievement_id END) as unclaimed,
        SUM(CASE WHEN ua.is_claimed = 1 THEN a.reward_berrys ELSE 0 END) as total_berrys_earned,
        SUM(CASE WHEN ua.progress >= a.threshold AND ua.is_claimed = 0 THEN a.reward_berrys ELSE 0 END) as total_berrys_available
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      WHERE a.is_active = 1
    `, [userId]);

    return {
      total: stats?.total || 0,
      completed: stats?.completed || 0,
      claimed: stats?.claimed || 0,
      unclaimed: stats?.unclaimed || 0,
      total_berrys_earned: stats?.total_berrys_earned || 0,
      total_berrys_available: stats?.total_berrys_available || 0
    };
  }
}
