import { Request, Response } from 'express';
import { Database } from '../utils/database.js';

export class DashboardController {
  /**
   * [ADMIN] Récupérer les statistiques du dashboard
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      // Statistiques utilisateurs
      const userStats = await Database.get<any>(`
        SELECT
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_admin = 1 THEN 1 END) as total_admins,
          COUNT(CASE WHEN last_login >= datetime('now', '-24 hours') THEN 1 END) as active_today,
          COUNT(CASE WHEN last_login >= datetime('now', '-7 days') THEN 1 END) as active_week,
          COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_users_week,
          SUM(berrys) as total_berrys,
          AVG(berrys) as avg_berrys
        FROM users
        WHERE is_active = 1
      `);

      // Statistiques cartes et collections
      const cardStats = await Database.get<any>(`
        SELECT
          COUNT(*) as total_cards,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_cards
        FROM cards
      `);

      const collectionStats = await Database.get<any>(`
        SELECT
          COUNT(*) as total_collections,
          SUM(quantity) as total_cards_owned,
          COUNT(DISTINCT user_id) as users_with_cards,
          AVG(quantity) as avg_cards_per_user
        FROM user_collections
      `);

      // Statistiques boosters
      const boosterStats = await Database.get<any>(`
        SELECT
          COUNT(*) as total_openings,
          COUNT(CASE WHEN opened_at >= datetime('now', '-24 hours') THEN 1 END) as opened_today,
          COUNT(CASE WHEN opened_at >= datetime('now', '-7 days') THEN 1 END) as opened_week
        FROM booster_openings
      `);

      // Top joueurs par Berrys
      const topPlayers = await Database.all(`
        SELECT
          username,
          berrys,
          (SELECT COUNT(*) FROM user_collections WHERE user_id = users.id) as total_cards,
          (SELECT SUM(quantity) FROM user_collections WHERE user_id = users.id) as cards_owned
        FROM users
        WHERE is_active = 1 AND is_admin = 0
        ORDER BY berrys DESC
        LIMIT 10
      `);

      // Statistiques achievements
      const achievementStats = await Database.get<any>(`
        SELECT
          COUNT(DISTINCT achievement_id) as total_achievements,
          COUNT(*) as total_completions,
          COUNT(CASE WHEN is_claimed = 1 THEN 1 END) as total_claimed
        FROM user_achievements
      `);

      // Statistiques de sécurité (dernières 24h)
      const securityStats = await Database.get<any>(`
        SELECT
          COUNT(CASE WHEN action = 'failed_login_attempt' THEN 1 END) as failed_logins,
          COUNT(CASE WHEN action = 'suspicious_activity' THEN 1 END) as suspicious_activities,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events
        FROM audit_logs
        WHERE created_at >= datetime('now', '-24 hours')
      `);

      res.json({
        success: true,
        data: {
          users: {
            total: userStats.total_users,
            admins: userStats.total_admins,
            active_today: userStats.active_today,
            active_week: userStats.active_week,
            new_week: userStats.new_users_week,
            total_berrys: userStats.total_berrys || 0,
            avg_berrys: Math.round(userStats.avg_berrys || 0)
          },
          cards: {
            total: cardStats.total_cards,
            active: cardStats.active_cards
          },
          collections: {
            total: collectionStats.total_collections || 0,
            total_cards_owned: collectionStats.total_cards_owned || 0,
            users_with_cards: collectionStats.users_with_cards || 0,
            avg_per_user: Math.round(collectionStats.avg_cards_per_user || 0)
          },
          boosters: {
            total_openings: boosterStats.total_openings,
            opened_today: boosterStats.opened_today,
            opened_week: boosterStats.opened_week
          },
          achievements: {
            total: achievementStats.total_achievements || 0,
            completions: achievementStats.total_completions || 0,
            claimed: achievementStats.total_claimed || 0
          },
          security: {
            failed_logins_24h: securityStats.failed_logins || 0,
            suspicious_activities_24h: securityStats.suspicious_activities || 0,
            critical_events_24h: securityStats.critical_events || 0
          },
          top_players: topPlayers
        }
      });

    } catch (error) {
      console.error('Erreur récupération stats dashboard:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * [ADMIN] Récupérer les utilisateurs connectés récemment
   */
  static async getOnlineUsers(req: Request, res: Response): Promise<void> {
    try {
      // Considéré "online" si dernière connexion < 5 min
      const onlineUsers = await Database.all(`
        SELECT
          id,
          username,
          last_login,
          berrys,
          available_boosters
        FROM users
        WHERE is_active = 1
          AND last_login >= datetime('now', '-5 minutes')
        ORDER BY last_login DESC
      `);

      res.json({
        success: true,
        data: {
          count: onlineUsers.length,
          users: onlineUsers
        }
      });

    } catch (error) {
      console.error('Erreur récupération utilisateurs online:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * [ADMIN] Activité récente
   */
  static async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const activities = await Database.all(`
        SELECT
          action,
          user_id,
          details,
          severity,
          created_at
        FROM audit_logs
        WHERE action IN (
          'user_login',
          'user_register',
          'booster_opened',
          'booster_purchased',
          'achievement_claimed'
        )
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit]);

      res.json({
        success: true,
        data: activities
      });

    } catch (error) {
      console.error('Erreur récupération activité récente:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}
