import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

export class Database {
  private static instance: sqlite3.Database | null = null;
  private static dbPath: string;

  static initialize(dbPath?: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      this.dbPath = dbPath || process.env.DATABASE_PATH || './database.sqlite';

      // Créer le dossier parent si nécessaire
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.instance = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Erreur lors de l\'ouverture de la base de données:', err.message);
          reject(err);
        } else {
          console.log('✅ Base de données SQLite connectée:', this.dbPath);

          // Activer les clés étrangères
          this.instance!.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) {
              console.error('❌ Erreur lors de l\'activation des clés étrangères:', pragmaErr.message);
              reject(pragmaErr);
            } else {
              resolve(this.instance!);
            }
          });
        }
      });
    });
  }

  static getInstance(): sqlite3.Database {
    if (!this.instance) {
      throw new Error('Base de données non initialisée. Appelez Database.initialize() d\'abord.');
    }
    return this.instance;
  }

  // Exécuter une requête avec promesses
  static run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.getInstance().run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  // Récupérer une ligne
  static get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.getInstance().get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  // Récupérer toutes les lignes
  static all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.getInstance().all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  // Transaction
  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.run('BEGIN');
    try {
      const result = await callback();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  // Fermer la base de données
  static close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.instance) {
        this.instance.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('🔒 Base de données fermée');
            this.instance = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
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