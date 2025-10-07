import Database_BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class Database {
  private static instance: Database_BetterSqlite3.Database | null = null;
  private static dbPath: string;

  static async initialize(dbPath?: string): Promise<Database_BetterSqlite3.Database> {
    this.dbPath = dbPath || process.env.DATABASE_PATH || './database.sqlite';

    // Créer le dossier parent si nécessaire
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      this.instance = new Database_BetterSqlite3(this.dbPath);
      console.log('✅ Base de données SQLite connectée:', this.dbPath);

      // Activer les clés étrangères
      this.instance.pragma('foreign_keys = ON');

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

  // Exécuter une requête avec promesses
  static async run(sql: string, params: any[] = []): Promise<Database_BetterSqlite3.RunResult> {
    return this.getInstance().prepare(sql).run(...params);
  }

  // Récupérer une ligne
  static async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.getInstance().prepare(sql).get(...params) as T | undefined;
  }

  // Récupérer toutes les lignes
  static async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.getInstance().prepare(sql).all(...params) as T[];
  }

  // Transaction
  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const txn = this.getInstance().transaction(callback);
    return txn();
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
    await this.run('INSERT INTO schema_version (version, applied_at) VALUES (?, datetime("now"))', [version]);
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