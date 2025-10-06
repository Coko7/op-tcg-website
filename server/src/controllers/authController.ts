import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserModel, UserCreate } from '../models/User.js';
import { Database } from '../utils/database.js';

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthenticatedUser {
  id: string;
  username: string;
  is_admin: boolean;
  berrys?: number;
}

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          error: 'Nom d\'utilisateur et mot de passe requis',
          details: { username: !username, password: !password }
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          error: 'Le mot de passe doit contenir au moins 6 caractères'
        });
        return;
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        res.status(409).json({
          error: 'Ce nom d\'utilisateur est déjà pris'
        });
        return;
      }

      const userData: UserCreate = { username, password };
      const user = await UserModel.create(userData);

      const tokens = await AuthController.generateTokens(user);
      const userResponse = AuthController.sanitizeUser(user);

      res.status(201).json({
        message: 'Compte créé avec succès',
        user: userResponse,
        ...tokens
      });

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          error: 'Nom d\'utilisateur et mot de passe requis'
        });
        return;
      }

      const user = await UserModel.findByUsername(username);
      if (!user) {
        res.status(401).json({
          error: 'Nom d\'utilisateur ou mot de passe incorrect'
        });
        return;
      }

      const isValidPassword = await UserModel.verifyPassword(user, password);
      if (!isValidPassword) {
        res.status(401).json({
          error: 'Nom d\'utilisateur ou mot de passe incorrect'
        });
        return;
      }

      await UserModel.updateLastLogin(user.id);

      const tokens = await AuthController.generateTokens(user);
      const userResponse = AuthController.sanitizeUser(user);

      res.json({
        message: 'Connexion réussie',
        user: userResponse,
        ...tokens
      });

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json({
          error: 'Token de rafraîchissement requis'
        });
        return;
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string, sessionId: string };

      const session = await Database.get(`
        SELECT * FROM user_sessions
        WHERE id = ? AND refresh_token = ? AND is_active = 1 AND expires_at > datetime('now')
      `, [decoded.sessionId, refreshToken]);

      if (!session) {
        res.status(401).json({
          error: 'Token de rafraîchissement invalide'
        });
        return;
      }

      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        res.status(401).json({
          error: 'Utilisateur introuvable'
        });
        return;
      }

      await Database.run(`
        UPDATE user_sessions
        SET last_used_at = datetime('now')
        WHERE id = ?
      `, [decoded.sessionId]);

      const newAccessToken = jwt.sign(
        { userId: user.id, username: user.username, is_admin: user.is_admin },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as any
      );

      const expiresIn = AuthController.getExpirationTime(JWT_EXPIRES_IN);

      res.json({
        accessToken: newAccessToken,
        expiresIn
      });

    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      res.status(401).json({
        error: 'Token de rafraîchissement invalide'
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        try {
          const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sessionId: string };
          await Database.run(`
            UPDATE user_sessions
            SET is_active = 0
            WHERE id = ?
          `, [decoded.sessionId]);
        } catch (error) {
          console.log('Token de rafraîchissement invalide lors de la déconnexion');
        }
      }

      res.json({
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const stats = await UserModel.getUserStats(user.id);

      res.json({
        user: AuthController.sanitizeUser(user),
        stats
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  private static async generateTokens(user: any): Promise<AuthTokens> {
    const sessionId = uuidv4();
    const expiresIn = AuthController.getExpirationTime(JWT_EXPIRES_IN);
    const refreshExpiresAt = new Date(Date.now() + AuthController.getExpirationTime(JWT_REFRESH_EXPIRES_IN) * 1000);

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    const refreshToken = jwt.sign(
      { userId: user.id, sessionId },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN } as any
    );

    await Database.run(`
      INSERT INTO user_sessions (id, user_id, refresh_token, expires_at)
      VALUES (?, ?, ?, ?)
    `, [sessionId, user.id, refreshToken, refreshExpiresAt.toISOString()]);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  private static sanitizeUser(user: any): AuthenticatedUser {
    return {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      berrys: user.berrys || 0
    };
  }

  private static getExpirationTime(timeString: string): number {
    const matches = timeString.match(/(\d+)([smhd])/);
    if (!matches) return 900; // 15 minutes par défaut

    const value = parseInt(matches[1]);
    const unit = matches[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900;
    }
  }
}