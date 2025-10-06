import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  is_admin: boolean;
}

declare module 'express' {
  interface Request {
    user?: any;
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Token d\'authentification requis'
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        error: 'Utilisateur introuvable'
      });
      return;
    }

    req.user = user;
    next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Token invalide'
      });
      return;
    }

    console.error('Erreur lors de l\'authentification:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentification requise'
    });
    return;
  }

  if (!req.user.is_admin) {
    res.status(403).json({
      error: 'Droits administrateur requis'
    });
    return;
  }

  next();
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        const user = await UserModel.findById(decoded.userId);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Token invalide ou expiré, mais on continue sans utilisateur
        console.log('Token optionnel invalide:', error instanceof Error ? error.message : 'Erreur inconnue');
      }
    }

    next();

  } catch (error) {
    console.error('Erreur lors de l\'authentification optionnelle:', error);
    next(); // On continue même en cas d'erreur
  }
};