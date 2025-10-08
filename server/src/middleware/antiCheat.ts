import { Request, Response, NextFunction } from 'express';
import { AuditLogger, AuditAction } from '../utils/auditLogger.js';

interface UserActionTracker {
  lastActions: Array<{ action: string; timestamp: number }>;
  suspicionScore: number;
  lastWarning: number;
  blockedUntil?: number;
}

const userTrackers = new Map<string, UserActionTracker>();

interface AntiCheatConfig {
  maxPerMinute?: number;
  maxPerHour?: number;
  minDelay?: number;
  maxSuspicionScore?: number;
}

/**
 * Middleware anti-triche pour détecter les comportements anormaux
 */
export const antiCheatMiddleware = (action: string, config: AntiCheatConfig = {}) => {
  const {
    maxPerMinute = 30,
    maxPerHour = 300,
    minDelay = 500,
    maxSuspicionScore = 100
  } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      next();
      return;
    }

    const now = Date.now();
    let tracker = userTrackers.get(userId);

    if (!tracker) {
      tracker = {
        lastActions: [],
        suspicionScore: 0,
        lastWarning: 0
      };
      userTrackers.set(userId, tracker);
    }

    // Vérifier si l'utilisateur est bloqué
    if (tracker.blockedUntil && tracker.blockedUntil > now) {
      await AuditLogger.logSuspicious({
        type: 'blocked_user_attempt',
        action,
        blocked_until: new Date(tracker.blockedUntil).toISOString()
      }, req, userId);

      res.status(429).json({
        error: 'Compte temporairement bloqué pour activité suspecte',
        unblockAt: new Date(tracker.blockedUntil).toISOString()
      });
      return;
    }

    // Nettoyer les anciennes actions (plus de 1 heure)
    const oneHourAgo = now - 60 * 60 * 1000;
    tracker.lastActions = tracker.lastActions.filter(a => a.timestamp > oneHourAgo);

    // Vérifier la fréquence par minute
    const oneMinuteAgo = now - 60 * 1000;
    const actionsLastMinute = tracker.lastActions.filter(
      a => a.action === action && a.timestamp > oneMinuteAgo
    ).length;

    if (actionsLastMinute >= maxPerMinute) {
      tracker.suspicionScore += 10;

      await AuditLogger.logSuspicious({
        type: 'rate_limit_exceeded',
        action,
        count: actionsLastMinute,
        limit: maxPerMinute,
        period: '1 minute',
        suspicion_score: tracker.suspicionScore
      }, req, userId);

      res.status(429).json({
        error: 'Trop de requêtes, veuillez ralentir'
      });
      return;
    }

    // Vérifier la fréquence par heure
    const actionsLastHour = tracker.lastActions.filter(
      a => a.action === action
    ).length;

    if (actionsLastHour >= maxPerHour) {
      tracker.suspicionScore += 20;

      await AuditLogger.logSuspicious({
        type: 'hourly_rate_limit_exceeded',
        action,
        count: actionsLastHour,
        limit: maxPerHour,
        suspicion_score: tracker.suspicionScore
      }, req, userId);

      res.status(429).json({
        error: 'Limite horaire atteinte, réessayez plus tard'
      });
      return;
    }

    // Vérifier le délai minimum entre actions
    const lastActionOfType = tracker.lastActions
      .filter(a => a.action === action)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (lastActionOfType && (now - lastActionOfType.timestamp) < minDelay) {
      tracker.suspicionScore += 5;

      await AuditLogger.logSuspicious({
        type: 'min_delay_violation',
        action,
        delay: now - lastActionOfType.timestamp,
        min_delay: minDelay,
        suspicion_score: tracker.suspicionScore
      }, req, userId);

      res.status(429).json({
        error: 'Veuillez attendre avant de réessayer'
      });
      return;
    }

    // Détecter les patterns suspects (actions trop régulières = bot)
    if (tracker.lastActions.length >= 10) {
      const recentActions = tracker.lastActions.slice(-10);
      const delays = [];

      for (let i = 1; i < recentActions.length; i++) {
        delays.push(recentActions[i].timestamp - recentActions[i - 1].timestamp);
      }

      const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
      const variance = delays.reduce((sum, delay) => sum + Math.pow(delay - avgDelay, 2), 0) / delays.length;
      const stdDev = Math.sqrt(variance);

      // Si l'écart-type est très faible, c'est suspect (actions trop régulières)
      if (stdDev < 100 && avgDelay < 2000) {
        tracker.suspicionScore += 30;

        await AuditLogger.logSuspicious({
          type: 'bot_pattern_detected',
          action,
          avg_delay: avgDelay,
          std_dev: stdDev,
          suspicion_score: tracker.suspicionScore
        }, req, userId);
      }
    }

    // Bloquer si le score de suspicion est trop élevé
    if (tracker.suspicionScore >= maxSuspicionScore) {
      tracker.blockedUntil = now + 30 * 60 * 1000; // Bloquer pour 30 minutes

      await AuditLogger.logSuspicious({
        type: 'user_auto_blocked',
        action,
        suspicion_score: tracker.suspicionScore,
        blocked_duration: '30 minutes'
      }, req, userId);

      res.status(429).json({
        error: 'Compte bloqué pour activité suspecte',
        unblockAt: new Date(tracker.blockedUntil).toISOString()
      });
      return;
    }

    // Avertir l'utilisateur si le score augmente
    if (tracker.suspicionScore > 50 && (now - tracker.lastWarning) > 60000) {
      tracker.lastWarning = now;
      console.warn(`⚠️ Utilisateur ${userId} - Score de suspicion: ${tracker.suspicionScore}`);
    }

    // Enregistrer l'action
    tracker.lastActions.push({
      action,
      timestamp: now
    });

    // Décrémenter légèrement le score de suspicion si tout va bien
    if (tracker.suspicionScore > 0) {
      tracker.suspicionScore = Math.max(0, tracker.suspicionScore - 0.1);
    }

    next();
  };
};

/**
 * Middleware pour vérifier la cohérence des ressources
 */
export const resourceConsistencyCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req as any).user?.id;

  if (!userId) {
    next();
    return;
  }

  try {
    const { Database } = await import('../utils/database.js');

    const user = await Database.get<any>(`
      SELECT berrys, available_boosters FROM users WHERE id = ?
    `, [userId]);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    // Vérifier les limites
    const MAX_BERRYS = 999999999;
    const MAX_BOOSTERS = 10;

    if (user.berrys < 0 || user.berrys > MAX_BERRYS) {
      await AuditLogger.logSuspicious({
        type: 'invalid_berrys_amount',
        berrys: user.berrys
      }, req, userId);

      await Database.run(`
        UPDATE users SET berrys = ? WHERE id = ?
      `, [Math.max(0, Math.min(user.berrys, MAX_BERRYS)), userId]);
    }

    if (user.available_boosters < 0 || user.available_boosters > MAX_BOOSTERS) {
      await AuditLogger.logSuspicious({
        type: 'invalid_boosters_amount',
        available_boosters: user.available_boosters
      }, req, userId);

      await Database.run(`
        UPDATE users SET available_boosters = ? WHERE id = ?
      `, [Math.max(0, Math.min(user.available_boosters, MAX_BOOSTERS)), userId]);
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification de cohérence:', error);
    next();
  }
};

/**
 * Middleware pour vérifier la cohérence temporelle
 */
export const temporalConsistencyCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req as any).user?.id;

  if (!userId) {
    next();
    return;
  }

  try {
    const { Database } = await import('../utils/database.js');

    const user = await Database.get<any>(`
      SELECT last_daily_reward, last_booster_opened FROM users WHERE id = ?
    `, [userId]);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    const now = Date.now();

    // Vérifier que les timestamps ne sont pas dans le futur
    if (user.last_daily_reward) {
      const lastReward = new Date(user.last_daily_reward).getTime();
      if (lastReward > now + 60000) { // Tolérance de 1 minute
        await AuditLogger.logSuspicious({
          type: 'future_timestamp_detected',
          field: 'last_daily_reward',
          timestamp: user.last_daily_reward
        }, req, userId);

        await Database.run(`
          UPDATE users SET last_daily_reward = NULL WHERE id = ?
        `, [userId]);
      }
    }

    if (user.last_booster_opened) {
      const lastBooster = new Date(user.last_booster_opened).getTime();
      if (lastBooster > now + 60000) {
        await AuditLogger.logSuspicious({
          type: 'future_timestamp_detected',
          field: 'last_booster_opened',
          timestamp: user.last_booster_opened
        }, req, userId);

        await Database.run(`
          UPDATE users SET last_booster_opened = NULL WHERE id = ?
        `, [userId]);
      }
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification temporelle:', error);
    next();
  }
};

/**
 * Nettoyer les trackers inactifs (toutes les heures)
 */
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [userId, tracker] of userTrackers.entries()) {
    const hasRecentActivity = tracker.lastActions.some(a => a.timestamp > oneHourAgo);
    const isBlocked = tracker.blockedUntil && tracker.blockedUntil > now;

    if (!hasRecentActivity && !isBlocked) {
      userTrackers.delete(userId);
    }
  }
}, 60 * 60 * 1000);
