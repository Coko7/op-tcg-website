import { Database } from './database.js';
import { v4 as uuidv4 } from 'uuid';

export enum AuditAction {
  // Authentification
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_PASSWORD_CHANGE = 'user_password_change',
  
  // Boosters
  BOOSTER_OPENED = 'booster_opened',
  BOOSTER_PURCHASED = 'booster_purchased',
  
  // Cartes
  CARD_SOLD = 'card_sold',
  CARD_FAVORITE_TOGGLE = 'card_favorite_toggle',
  
  // Berrys
  BERRYS_EARNED = 'berrys_earned',
  BERRYS_SPENT = 'berrys_spent',
  BERRYS_DAILY_REWARD = 'berrys_daily_reward',
  
  // Achievements
  ACHIEVEMENT_COMPLETED = 'achievement_completed',
  ACHIEVEMENT_CLAIMED = 'achievement_claimed',
  
  // Admin
  ADMIN_ACTION = 'admin_action',
  DATA_RESET = 'data_reset',
  
  // Sécurité
  FAILED_LOGIN_ATTEMPT = 'failed_login_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  action: AuditAction;
  severity: AuditSeverity;
  details: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class AuditLogger {
  /**
   * Log une action d'audit
   */
  static async log(
    action: AuditAction,
    details: any,
    options: {
      userId?: string;
      severity?: AuditSeverity;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    try {
      const id = uuidv4();
      const severity = options.severity || AuditSeverity.INFO;
      const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

      await Database.run(`
        INSERT INTO audit_logs (id, user_id, action, severity, details, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        id,
        options.userId || null,
        action,
        severity,
        detailsStr,
        options.ipAddress || null,
        options.userAgent || null
      ]);

      // Log dans la console selon la sévérité
      const logMessage = `[AUDIT] ${severity.toUpperCase()} - ${action}: ${detailsStr}`;
      switch (severity) {
        case AuditSeverity.CRITICAL:
        case AuditSeverity.ERROR:
          console.error(logMessage);
          break;
        case AuditSeverity.WARNING:
          console.warn(logMessage);
          break;
        default:
          console.log(logMessage);
      }
    } catch (error) {
      // Ne jamais laisser le logging faire planter l'application
      console.error('Erreur lors du logging d\'audit:', error);
    }
  }

  /**
   * Log une action utilisateur réussie
   */
  static async logSuccess(
    action: AuditAction,
    userId: string,
    details: any,
    req?: any
  ): Promise<void> {
    await this.log(action, details, {
      userId,
      severity: AuditSeverity.INFO,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log une tentative échouée
   */
  static async logFailure(
    action: AuditAction,
    details: any,
    req?: any,
    userId?: string
  ): Promise<void> {
    await this.log(action, details, {
      userId,
      severity: AuditSeverity.WARNING,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log une activité suspecte
   */
  static async logSuspicious(
    details: any,
    req?: any,
    userId?: string
  ): Promise<void> {
    await this.log(AuditAction.SUSPICIOUS_ACTIVITY, details, {
      userId,
      severity: AuditSeverity.CRITICAL,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Obtenir les logs d'audit pour un utilisateur
   */
  static async getUserLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    return await Database.all<AuditLogEntry>(`
      SELECT * FROM audit_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
  }

  /**
   * Obtenir les logs d'audit par action
   */
  static async getLogsByAction(
    action: AuditAction,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    return await Database.all<AuditLogEntry>(`
      SELECT * FROM audit_logs
      WHERE action = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [action, limit]);
  }

  /**
   * Obtenir les logs d'audit par sévérité
   */
  static async getLogsBySeverity(
    severity: AuditSeverity,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    return await Database.all<AuditLogEntry>(`
      SELECT * FROM audit_logs
      WHERE severity = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [severity, limit]);
  }

  /**
   * Nettoyer les vieux logs (garder seulement les X derniers jours)
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const result = await Database.run(`
      DELETE FROM audit_logs
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `, [daysToKeep]);

    return result.changes || 0;
  }

  /**
   * Obtenir les statistiques de sécurité
   */
  static async getSecurityStats(days: number = 7): Promise<{
    failed_logins: number;
    suspicious_activities: number;
    unauthorized_access: number;
    rate_limit_exceeded: number;
  }> {
    const stats = await Database.get<any>(`
      SELECT
        COUNT(CASE WHEN action = ? THEN 1 END) as failed_logins,
        COUNT(CASE WHEN action = ? THEN 1 END) as suspicious_activities,
        COUNT(CASE WHEN action = ? THEN 1 END) as unauthorized_access,
        COUNT(CASE WHEN action = ? THEN 1 END) as rate_limit_exceeded
      FROM audit_logs
      WHERE created_at >= datetime('now', '-' || ? || ' days')
    `, [
      AuditAction.FAILED_LOGIN_ATTEMPT,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.RATE_LIMIT_EXCEEDED,
      days
    ]);

    return {
      failed_logins: stats?.failed_logins || 0,
      suspicious_activities: stats?.suspicious_activities || 0,
      unauthorized_access: stats?.unauthorized_access || 0,
      rate_limit_exceeded: stats?.rate_limit_exceeded || 0
    };
  }
}
