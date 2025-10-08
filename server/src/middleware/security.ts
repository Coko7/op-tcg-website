import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuditLogger, AuditAction } from '../utils/auditLogger.js';

/**
 * Middleware pour ajouter des headers de sécurité supplémentaires
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Middleware pour limiter la taille des requêtes
 */
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength) > maxSize) {
      res.status(413).json({
        error: 'Requête trop volumineuse',
        maxSize: `${maxSize / (1024 * 1024)}MB`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware pour détecter et bloquer les tentatives d'injection SQL
 */
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /(;\s*DROP)/gi,
    /(--|\#|\/\*|\*\/)/g,
    /('|")\s*(OR|AND)\s*('|")/gi,
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // Check query params
  if (checkValue(req.query)) {
    console.warn('⚠️ Tentative d\'injection SQL détectée dans les paramètres de requête:', req.query);

    // Log activité suspecte
    AuditLogger.logSuspicious({
      type: 'sql_injection_attempt',
      location: 'query_params',
      data: req.query
    }, req, (req as any).user?.id);

    res.status(400).json({
      error: 'Requête invalide'
    });
    return;
  }

  // Check body
  if (checkValue(req.body)) {
    console.warn('⚠️ Tentative d\'injection SQL détectée dans le corps de la requête:', req.body);

    // Log activité suspecte
    AuditLogger.logSuspicious({
      type: 'sql_injection_attempt',
      location: 'body',
      data: req.body
    }, req, (req as any).user?.id);

    res.status(400).json({
      error: 'Requête invalide'
    });
    return;
  }

  next();
};

/**
 * Middleware pour logger les activités suspectes
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-forwarded-host',
  ];

  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  // Log only suspicious activity or errors
  const originalSend = res.send;
  res.send = function(data: any) {
    if (res.statusCode >= 400) {
      console.warn('🔒 Activité suspecte:', {
        ...logData,
        statusCode: res.statusCode,
      });
    }
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware pour détecter les user agents suspects
 */
export const userAgentValidation = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.headers['user-agent'];

  // Liste de user agents suspects
  const suspiciousAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /burp/i,
    /dirbuster/i,
    /acunetix/i,
  ];

  if (userAgent && suspiciousAgents.some(pattern => pattern.test(userAgent))) {
    console.warn('⚠️ User agent suspect détecté:', userAgent);

    // Log activité suspecte
    AuditLogger.logSuspicious({
      type: 'suspicious_user_agent',
      user_agent: userAgent
    }, req, (req as any).user?.id);

    res.status(403).json({
      error: 'Accès refusé'
    });
    return;
  }

  next();
};

/**
 * Middleware pour prévenir les attaques par timing
 */
export const constantTimeResponse = async (
  handler: (req: Request, res: Response) => Promise<void>,
  minDuration: number = 200
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    try {
      await handler(req, res);
    } finally {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDuration - elapsed);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    }
  };
};

/**
 * Middleware pour limiter les paramètres de requête
 */
export const limitQueryParams = (maxParams: number = 50) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const paramCount = Object.keys(req.query).length;

    if (paramCount > maxParams) {
      res.status(400).json({
        error: 'Trop de paramètres dans la requête',
        max: maxParams
      });
      return;
    }

    next();
  };
};

/**
 * Middleware pour empêcher le path traversal
 */
export const pathTraversalProtection = (req: Request, res: Response, next: NextFunction): void => {
  const pathTraversalPatterns = [
    /\.\./g,
    /%2e%2e/gi,
    /\.\\/g,
    /%5c/gi,
  ];

  const checkPath = (value: any): boolean => {
    if (typeof value === 'string') {
      return pathTraversalPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkPath);
    }
    return false;
  };

  if (checkPath(req.path) || checkPath(req.query) || checkPath(req.body)) {
    console.warn('⚠️ Tentative de path traversal détectée:', req.path);

    // Log activité suspecte
    AuditLogger.logSuspicious({
      type: 'path_traversal_attempt',
      path: req.path,
      query: req.query,
      body: req.body
    }, req, (req as any).user?.id);

    res.status(400).json({
      error: 'Chemin invalide'
    });
    return;
  }

  next();
};
