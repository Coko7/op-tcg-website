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
          COUNT(CASE WHEN created_at >= datetime('now', '-1 day', 'start of day') THEN 1 END) as new_today,
          SUM(berrys) as total_berrys,
          AVG(berrys) as avg_berrys
        FROM users
        WHERE is_active = 1
      `);

      // Statistiques cartes et collections
      const cardStats = await Database.get<any>(`
        SELECT
          COUNT(DISTINCT card_id) as unique_cards,
          SUM(quantity) as total_collected
        FROM user_collections
      `);

      const avgCardsPerUser = await Database.get<any>(`
        SELECT AVG(total_cards) as avg_per_user
        FROM (
          SELECT COUNT(DISTINCT card_id) as total_cards
          FROM user_collections
          GROUP BY user_id
        )
      `);

      // Statistiques boosters
      const boosterStats = await Database.get<any>(`
        SELECT
          COUNT(*) as total_opened,
          COUNT(CASE WHEN opened_at >= datetime('now', '-7 days') THEN 1 END) as total_purchased
        FROM booster_openings
      `);

      // Booster le plus populaire
      const mostPopularBooster = await Database.get<any>(`
        SELECT b.name, COUNT(*) as count
        FROM booster_openings bo
        JOIN boosters b ON bo.booster_id = b.id
        GROUP BY bo.booster_id
        ORDER BY count DESC
        LIMIT 1
      `);

      // Top joueurs par Berrys
      const topPlayers = await Database.all(`
        SELECT
          username,
          berrys,
          (SELECT COUNT(DISTINCT card_id) FROM user_collections WHERE user_id = users.id) as cards_count
        FROM users
        WHERE is_active = 1 AND is_admin = 0
        ORDER BY berrys DESC
        LIMIT 10
      `);

      // Statistiques de sécurité (dernières 24h)
      const securityStats = await Database.get<any>(`
        SELECT
          COUNT(CASE WHEN action = 'failed_login_attempt' THEN 1 END) as failed_logins,
          COUNT(CASE WHEN action = 'suspicious_activity' THEN 1 END) as suspicious_activities
        FROM audit_logs
        WHERE created_at >= datetime('now', '-24 hours')
      `);

      res.json({
        success: true,
        stats: {
          users: {
            total: userStats.total_users || 0,
            active: userStats.active_today || 0,
            new_today: userStats.new_today || 0,
            admins: userStats.total_admins || 0
          },
          economy: {
            total_berrys: userStats.total_berrys || 0,
            avg_berrys: Math.round(userStats.avg_berrys || 0)
          },
          boosters: {
            total_opened: boosterStats.total_opened || 0,
            total_purchased: boosterStats.total_purchased || 0,
            most_popular: mostPopularBooster?.name || 'N/A'
          },
          cards: {
            total_collected: cardStats.total_collected || 0,
            unique_cards: cardStats.unique_cards || 0,
            avg_per_user: Math.round(avgCardsPerUser?.avg_per_user || 0)
          },
          security: {
            failed_logins_24h: securityStats.failed_logins || 0,
            suspicious_activities: securityStats.suspicious_activities || 0
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
          al.id,
          al.action as type,
          al.details,
          al.created_at,
          u.username
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.action IN (
          'user_login',
          'user_register',
          'booster_opened',
          'booster_purchased',
          'achievement_claimed',
          'card_received'
        )
        ORDER BY al.created_at DESC
        LIMIT ?
      `, [limit]);

      // Formater les activités avec des descriptions lisibles
      const formattedActivities = activities.map((activity: any) => {
        let description = '';

        switch (activity.type) {
          case 'user_login':
            description = `Connexion au jeu`;
            break;
          case 'user_register':
            description = `Nouvel utilisateur inscrit`;
            break;
          case 'booster_opened':
            description = `Ouverture d'un booster`;
            break;
          case 'booster_purchased':
            description = `Achat d'un booster`;
            break;
          case 'achievement_claimed':
            description = `Succès réclamé`;
            break;
          case 'card_received':
            description = `Nouvelle carte obtenue`;
            break;
          default:
            description = activity.type;
        }

        return {
          id: activity.id,
          type: activity.type,
          description: description,
          created_at: activity.created_at,
          username: activity.username || 'Système'
        };
      });

      res.json({
        success: true,
        activities: formattedActivities
      });

    } catch (error) {
      console.error('Erreur récupération activité récente:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}
