/**
 * Logger avec rotation automatique
 * Limite la taille des logs pour éviter l'explosion du container
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAX_LOG_SIZE = parseInt(process.env.MAX_LOG_SIZE || '10485760'); // 10MB par défaut
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const LOG_ENABLED = process.env.LOG_ENABLED !== 'false';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // debug, info, warn, error

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  private logFile: string | null = null;
  private currentLogSize = 0;
  private minLevel: number;

  constructor() {
    this.minLevel = LOG_LEVELS[LOG_LEVEL as LogLevel] || LOG_LEVELS.info;

    if (LOG_ENABLED && process.env.NODE_ENV === 'production') {
      this.initLogFile();
    }
  }

  /**
   * Initialiser le fichier de log
   */
  private initLogFile(): void {
    try {
      // Créer le répertoire de logs s'il n'existe pas
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      this.logFile = path.join(LOG_DIR, `app-${date}.log`);

      // Vérifier la taille du fichier existant
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        this.currentLogSize = stats.size;

        // Si le fichier est trop gros, le renommer
        if (this.currentLogSize > MAX_LOG_SIZE) {
          this.rotateLog();
        }
      }
    } catch (error) {
      console.error('Erreur initialisation logger:', error);
      this.logFile = null;
    }
  }

  /**
   * Rotation du fichier de log
   */
  private rotateLog(): void {
    if (!this.logFile || !fs.existsSync(this.logFile)) {
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const rotatedFile = this.logFile.replace('.log', `-${timestamp}.log`);

      fs.renameSync(this.logFile, rotatedFile);
      this.currentLogSize = 0;

      console.log(`📝 Log rotaté: ${path.basename(rotatedFile)}`);
    } catch (error) {
      console.error('Erreur rotation log:', error);
    }
  }

  /**
   * Écrire dans le fichier de log
   */
  private writeToFile(message: string): void {
    if (!this.logFile) {
      return;
    }

    try {
      const logMessage = `${new Date().toISOString()} ${message}\n`;
      const messageSize = Buffer.byteLength(logMessage, 'utf8');

      // Vérifier si on dépasse la taille max
      if (this.currentLogSize + messageSize > MAX_LOG_SIZE) {
        this.rotateLog();
      }

      fs.appendFileSync(this.logFile, logMessage);
      this.currentLogSize += messageSize;
    } catch (error) {
      // Ne pas logger l'erreur pour éviter la récursion
    }
  }

  /**
   * Vérifier si le niveau de log doit être affiché
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  /**
   * Formater le message
   */
  private formatMessage(level: string, ...args: any[]): string {
    const message = args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    return `[${level.toUpperCase()}] ${message}`;
  }

  /**
   * Log debug
   */
  debug(...args: any[]): void {
    if (!this.shouldLog('debug')) return;

    const message = this.formatMessage('debug', ...args);
    console.log(message);
    this.writeToFile(message);
  }

  /**
   * Log info
   */
  info(...args: any[]): void {
    if (!this.shouldLog('info')) return;

    const message = this.formatMessage('info', ...args);
    console.log(message);
    this.writeToFile(message);
  }

  /**
   * Log warn
   */
  warn(...args: any[]): void {
    if (!this.shouldLog('warn')) return;

    const message = this.formatMessage('warn', ...args);
    console.warn(message);
    this.writeToFile(message);
  }

  /**
   * Log error
   */
  error(...args: any[]): void {
    if (!this.shouldLog('error')) return;

    const message = this.formatMessage('error', ...args);
    console.error(message);
    this.writeToFile(message);
  }

  /**
   * Log générique (compatibilité console.log)
   */
  log(...args: any[]): void {
    this.info(...args);
  }
}

// Export singleton
export const logger = new Logger();

// Export pour remplacer console dans les imports
export default logger;
