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
        ua.claimed_at,
        b.name as booster_name
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      LEFT JOIN boosters b ON a.booster_id = b.id
      WHERE a.is_active = 1
      ORDER BY
        a.category,
        CASE WHEN a.booster_id IS NULL THEN 0 ELSE 1 END,
        b.name,
        a.threshold
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
    // SÉCURITÉ: Validation stricte des entrées
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID invalide');
    }
    if (!achievementId || typeof achievementId !== 'string') {
      throw new Error('Achievement ID invalide');
    }
    if (typeof progress !== 'number' || progress < 0 || !Number.isFinite(progress)) {
      throw new Error('Progress invalide');
    }

    // Vérifier que l'achievement existe et récupérer son seuil
    const achievement = await this.findById(achievementId);
    if (!achievement) {
      throw new Error('Achievement introuvable');
    }

    // SÉCURITÉ: Limiter le progress au threshold maximum + petite marge
    const maxAllowedProgress = achievement.threshold * 1.1; // 10% de marge
    if (progress > maxAllowedProgress) {
      console.warn(`⚠️ Progress suspect pour achievement ${achievementId}: ${progress} > ${maxAllowedProgress}`);
      progress = achievement.threshold; // Limiter au threshold exact
    }

    // Vérifier si l'achievement existe pour cet utilisateur
    const existing = await Database.get(`
      SELECT * FROM user_achievements
      WHERE user_id = ? AND achievement_id = ?
    `, [userId, achievementId]);

    if (existing) {
      // Mettre à jour seulement si le nouveau progress est supérieur
      if (progress > existing.progress) {
        const isCompleted = progress >= achievement.threshold;

        await Database.run(`
          UPDATE user_achievements
          SET progress = ?,
              completed_at = CASE WHEN ? AND completed_at IS NULL THEN datetime('now') ELSE completed_at END
          WHERE user_id = ? AND achievement_id = ?
        `, [progress, isCompleted ? 1 : 0, userId, achievementId]);
      }
    } else {
      // Créer une nouvelle entrée
      const isCompleted = progress >= achievement.threshold;

      await Database.run(`
        INSERT INTO user_achievements (id, user_id, achievement_id, progress, completed_at, is_claimed)
        VALUES (?, ?, ?, ?, ?, 0)
      `, [uuidv4(), userId, achievementId, progress, isCompleted ? new Date().toISOString() : null]);
    }
  }

  // Récupérer un achievement non réclamé
  static async claimAchievement(userId: string, achievementId: string): Promise<number> {
    // SÉCURITÉ: Valider les entrées
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID invalide');
    }
    if (!achievementId || typeof achievementId !== 'string') {
      throw new Error('Achievement ID invalide');
    }

    // SÉCURITÉ: Vérifier si l'achievement est complété et non réclamé avec verrouillage
    const userAchievement = await Database.get<any>(`
      SELECT ua.*, a.reward_berrys, a.threshold, a.is_active
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ? AND ua.achievement_id = ? AND ua.is_claimed = 0
    `, [userId, achievementId]);

    if (!userAchievement) {
      throw new Error('Achievement non trouvé ou déjà réclamé');
    }

    // SÉCURITÉ: Vérifier que l'achievement est actif
    if (!userAchievement.is_active) {
      throw new Error('Achievement désactivé');
    }

    // SÉCURITÉ: Vérifier que le threshold est atteint
    if (userAchievement.progress < userAchievement.threshold) {
      throw new Error(`Achievement non complété (${userAchievement.progress}/${userAchievement.threshold})`);
    }

    // SÉCURITÉ: Valider le montant de récompense pour éviter manipulation
    if (userAchievement.reward_berrys < 0 || userAchievement.reward_berrys > 10000) {
      throw new Error('Montant de récompense invalide');
    }

    const MAX_BERRYS = 999999999;

    // SÉCURITÉ: Transaction atomique pour éviter double-claim
    await Database.transaction(async () => {
      // Vérifier une dernière fois que c'est non réclamé (protection race condition)
      const finalCheck = await Database.get<any>(`
        SELECT is_claimed FROM user_achievements
        WHERE user_id = ? AND achievement_id = ?
      `, [userId, achievementId]);

      if (!finalCheck || finalCheck.is_claimed !== 0) {
        throw new Error('Achievement déjà réclamé');
      }

      // Vérifier qu'on ne dépasse pas le max de Berrys
      const currentUser = await Database.get<any>(`
        SELECT berrys FROM users WHERE id = ?
      `, [userId]);

      const currentBerrys = currentUser?.berrys || 0;
      if (currentBerrys + userAchievement.reward_berrys > MAX_BERRYS) {
        throw new Error('Limite de Berrys atteinte');
      }

      // Marquer comme réclamé
      const updateResult = await Database.run(`
        UPDATE user_achievements
        SET is_claimed = 1, claimed_at = datetime('now')
        WHERE user_id = ? AND achievement_id = ? AND is_claimed = 0
      `, [userId, achievementId]);

      if (updateResult.changes === 0) {
        throw new Error('Échec de la mise à jour de l\'achievement');
      }

      // Ajouter les Berrys à l'utilisateur
      await Database.run(`
        UPDATE users
        SET berrys = COALESCE(berrys, 0) + ?
        WHERE id = ?
      `, [userAchievement.reward_berrys, userId]);
    });

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
