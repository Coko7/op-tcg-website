import Database_BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Validates SQL query to prevent certain dangerous operations
 */
function validateQuery(sql: string): void {
  const dangerousPatterns = [
    /ATTACH\s+DATABASE/i,
    /PRAGMA\s+(?!foreign_keys|journal_mode|synchronous|temp_store|mmap_size)/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      throw new Error('Requête SQL non autorisée détectée');
    }
  }
}

/**
 * Sanitize table and column names
 */
function sanitizeIdentifier(identifier: string): string {
  // Only allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(identifier)) {
    throw new Error(`Identifiant invalide: ${identifier}`);
  }
  return identifier;
}

export class Database {
  private static instance: Database_BetterSqlite3.Database | null = null;
  private static dbPath: string;
  private static readonly MAX_QUERY_LENGTH = 10000;

  static async initialize(dbPath?: string): Promise<Database_BetterSqlite3.Database> {
    this.dbPath = dbPath || process.env.DATABASE_PATH || './database.sqlite';

    // Validate database path to prevent path traversal
    const resolvedPath = path.resolve(this.dbPath);
    const expectedDir = path.resolve(process.cwd());

    if (!resolvedPath.startsWith(expectedDir) && process.env.NODE_ENV === 'production') {
      throw new Error('Chemin de base de données invalide');
    }

    // Créer le dossier parent si nécessaire
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      this.instance = new Database_BetterSqlite3(this.dbPath);
      console.log('✅ Base de données SQLite connectée:', this.dbPath);

      // Configuration de sécurité
      this.instance.pragma('foreign_keys = ON');
      this.instance.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
      this.instance.pragma('synchronous = FULL'); // Maximum data safety

      // Set a timeout for busy database
      this.instance.pragma('busy_timeout = 5000');

      return this.instance;
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'ouverture de la base de données:', err.message);
      throw err;
    }
  }

  static getInstance(): Database_BetterSqlite3.Database {
    if (!this.instance) {
      throw new Error('Base de données non initialisée. Appelez Database.initialize() d\'abord.');
    }
    return this.instance;
  }

  // Exécuter une requête avec promesses et validation
  static async run(sql: string, params: any[] = []): Promise<Database_BetterSqlite3.RunResult> {
    // Validate query length
    if (sql.length > this.MAX_QUERY_LENGTH) {
      throw new Error('Requête SQL trop longue');
    }

    // Validate query
    validateQuery(sql);

    // Validate params
    if (!Array.isArray(params)) {
      throw new Error('Les paramètres doivent être un tableau');
    }

    try {
      return this.getInstance().prepare(sql).run(...params);
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la requête:', error);
      throw error;
    }
  }

  // Récupérer une ligne
  static async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    // Validate query length
    if (sql.length > this.MAX_QUERY_LENGTH) {
      throw new Error('Requête SQL trop longue');
    }

    // Validate query
    validateQuery(sql);

    // Validate params
    if (!Array.isArray(params)) {
      throw new Error('Les paramètres doivent être un tableau');
    }

    try {
      return this.getInstance().prepare(sql).get(...params) as T | undefined;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  }

  // Récupérer toutes les lignes
  static async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    // Validate query length
    if (sql.length > this.MAX_QUERY_LENGTH) {
      throw new Error('Requête SQL trop longue');
    }

    // Validate query
    validateQuery(sql);

    // Validate params
    if (!Array.isArray(params)) {
      throw new Error('Les paramètres doivent être un tableau');
    }

    try {
      return this.getInstance().prepare(sql).all(...params) as T[];
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  }

  // Transaction - Better-sqlite3 ne supporte pas les fonctions async dans les transactions
  // On doit gérer manuellement BEGIN/COMMIT/ROLLBACK
  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const db = this.getInstance();

    try {
      // Démarrer la transaction
      db.prepare('BEGIN IMMEDIATE').run();

      // Exécuter le callback
      const result = await callback();

      // Valider la transaction
      db.prepare('COMMIT').run();

      return result;
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      try {
        db.prepare('ROLLBACK').run();
      } catch (rollbackError) {
        console.error('Erreur lors du rollback:', rollbackError);
      }
      throw error;
    }
  }

  // Fermer la base de données
  static async close(): Promise<void> {
    if (this.instance) {
      this.instance.close();
      console.log('🔒 Base de données fermée');
      this.instance = null;
    }
  }

  // Obtenir la version du schéma actuel
  static async getSchemaVersion(): Promise<number> {
    try {
      const result = await this.get<{ version: number }>('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1');
      return result?.version || 0;
    } catch (error) {
      // Si la table n'existe pas, on est à la version 0
      return 0;
    }
  }

  // Mettre à jour la version du schéma
  static async updateSchemaVersion(version: number): Promise<void> {
    await this.run("INSERT INTO schema_version (version, applied_at) VALUES (?, datetime('now'))", [version]);
  }

  // Backup de la base de données
  static async backup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = backupPath || `backup_${timestamp}.sqlite`;

    // Simple copie du fichier SQLite
    const sourcePath = this.dbPath;
    const destPath = path.resolve(backupFile);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`📦 Backup créé: ${destPath}`);
      return destPath;
    } else {
      throw new Error('Fichier de base de données non trouvé');
    }
  }
}