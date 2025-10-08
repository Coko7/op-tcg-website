import { Request, Response } from 'express';
import { Database } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogger, AuditAction } from '../utils/auditLogger.js';

const MAX_BERRYS = 999999999;

export class NotificationController {
  /**
   * [ADMIN] Créer une notification globale
   */
  static async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { title, message, reward_berrys, reward_boosters, expires_at } = req.body;

      // Validation
      if (!title || typeof title !== 'string' || title.length < 3 || title.length > 100) {
        res.status(400).json({
          error: 'Titre invalide (3-100 caractères requis)'
        });
        return;
      }

      if (!message || typeof message !== 'string' || message.length < 10 || message.length > 1000) {
        res.status(400).json({
          error: 'Message invalide (10-1000 caractères requis)'
        });
        return;
      }

      const rewardBerrys = parseInt(reward_berrys || 0);
      const rewardBoosters = parseInt(reward_boosters || 0);

      if (rewardBerrys < 0 || rewardBerrys > 10000) {
        res.status(400).json({
          error: 'Récompense Berrys invalide (0-10000)'
        });
        return;
      }

      if (rewardBoosters < 0 || rewardBoosters > 10) {
        res.status(400).json({
          error: 'Récompense boosters invalide (0-10)'
        });
        return;
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      await Database.run(`
        INSERT INTO notifications (
          id, title, message, reward_berrys, reward_boosters,
          is_active, created_by, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
      `, [id, title, message, rewardBerrys, rewardBoosters, adminId, now, expires_at || null]);

      // AUDIT
      await AuditLogger.logSuccess(AuditAction.ADMIN_ACTION, adminId!, {
        action: 'create_notification',
        notification_id: id,
        reward_berrys: rewardBerrys,
        reward_boosters: rewardBoosters
      }, req);

      res.status(201).json({
        success: true,
        data: {
          id,
          title,
          message,
          reward_berrys: rewardBerrys,
          reward_boosters: rewardBoosters
        }
      });

    } catch (error) {
      console.error('Erreur création notification:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * [USER] Récupérer les notifications non lues
   */
  static async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const now = new Date().toISOString();

      // Récupérer les notifications actives non encore lues par l'utilisateur
      const notifications = await Database.all(`
        SELECT
          n.id,
          n.title,
          n.message,
          n.reward_berrys,
          n.reward_boosters,
          n.created_at,
          n.expires_at,
          un.read_at,
          un.reward_claimed,
          un.claimed_at
        FROM notifications n
        LEFT JOIN user_notifications un
          ON n.id = un.notification_id AND un.user_id = ?
        WHERE n.is_active = 1
          AND (n.expires_at IS NULL OR n.expires_at > ?)
          AND un.id IS NULL
        ORDER BY n.created_at DESC
        LIMIT 50
      `, [userId, now]);

      res.json({
        success: true,
        data: notifications,
        unread_count: notifications.length
      });

    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * [USER] Marquer une notification comme lue et réclamer la récompense
   */
  static async claimNotificationReward(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    try {
      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const { notificationId } = req.params;

      if (!notificationId) {
        res.status(400).json({ error: 'ID notification requis' });
        return;
      }

      let rewardBerrys = 0;
      let rewardBoosters = 0;
      let newBalance = 0;

      // TRANSACTION ATOMIQUE
      await Database.transaction(async () => {
        // 1. Vérifier que la notification existe et est active
        const notification = await Database.get<any>(`
          SELECT * FROM notifications
          WHERE id = ? AND is_active = 1
        `, [notificationId]);

        if (!notification) {
          throw new Error('Notification introuvable ou inactive');
        }

        // Vérifier expiration
        if (notification.expires_at) {
          const expiresAt = new Date(notification.expires_at);
          if (expiresAt < new Date()) {
            throw new Error('Notification expirée');
          }
        }

        // 2. Vérifier que l'utilisateur n'a pas déjà réclamé
        const existingClaim = await Database.get<any>(`
          SELECT * FROM user_notifications
          WHERE user_id = ? AND notification_id = ?
        `, [userId, notificationId]);

        if (existingClaim) {
          throw new Error('Notification déjà réclamée');
        }

        rewardBerrys = notification.reward_berrys || 0;
        rewardBoosters = notification.reward_boosters || 0;

        // 3. Récupérer le solde actuel de l'utilisateur
        const user = await Database.get<any>(`
          SELECT berrys, available_boosters FROM users WHERE id = ?
        `, [userId]);

        if (!user) {
          throw new Error('Utilisateur introuvable');
        }

        const currentBerrys = user.berrys || 0;
        const currentBoosters = user.available_boosters || 0;

        // Vérifier les limites
        if (currentBerrys + rewardBerrys > MAX_BERRYS) {
          throw new Error('Limite de Berrys atteinte');
        }

        if (currentBoosters + rewardBoosters > 10) {
          throw new Error('Limite de boosters atteinte');
        }

        // 4. Appliquer les récompenses
        if (rewardBerrys > 0 || rewardBoosters > 0) {
          await Database.run(`
            UPDATE users
            SET berrys = berrys + ?,
                available_boosters = available_boosters + ?
            WHERE id = ?
          `, [rewardBerrys, rewardBoosters, userId]);
        }

        // 5. Marquer comme lue et réclamée
        const now = new Date().toISOString();
        const userNotifId = uuidv4();

        await Database.run(`
          INSERT INTO user_notifications (
            id, user_id, notification_id, read_at, reward_claimed, claimed_at
          ) VALUES (?, ?, ?, ?, 1, ?)
        `, [userNotifId, userId, notificationId, now, now]);

        newBalance = currentBerrys + rewardBerrys;
      });

      // AUDIT
      await AuditLogger.logSuccess(AuditAction.BERRYS_EARNED, userId, {
        source: 'notification_reward',
        notification_id: notificationId,
        berrys_earned: rewardBerrys,
        boosters_earned: rewardBoosters,
        new_balance: newBalance
      }, req);

      res.json({
        success: true,
        data: {
          berrys_earned: rewardBerrys,
          boosters_earned: rewardBoosters,
          new_balance: newBalance
        }
      });

    } catch (error: any) {
      console.error('Erreur réclamation notification:', error);

      if (error.message?.includes('déjà réclamée')) {
        res.status(400).json({ error: 'Notification déjà réclamée' });
      } else if (error.message?.includes('expirée')) {
        res.status(400).json({ error: 'Notification expirée' });
      } else if (error.message?.includes('Limite')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur serveur' });
      }
    }
  }

  /**
   * [ADMIN] Récupérer toutes les notifications
   */
  static async getAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      const notifications = await Database.all(`
        SELECT
          n.*,
          u.username as created_by_username,
          (SELECT COUNT(*) FROM user_notifications WHERE notification_id = n.id) as total_claims
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        ORDER BY n.created_at DESC
      `);

      res.json({
        success: true,
        data: notifications
      });

    } catch (error) {
      console.error('Erreur récupération notifications admin:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * [ADMIN] Désactiver une notification
   */
  static async deactivateNotification(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { notificationId } = req.params;

      await Database.run(`
        UPDATE notifications SET is_active = 0 WHERE id = ?
      `, [notificationId]);

      // AUDIT
      await AuditLogger.logSuccess(AuditAction.ADMIN_ACTION, adminId!, {
        action: 'deactivate_notification',
        notification_id: notificationId
      }, req);

      res.json({ success: true });

    } catch (error) {
      console.error('Erreur désactivation notification:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}
