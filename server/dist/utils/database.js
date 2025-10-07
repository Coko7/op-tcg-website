import Database_BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
export class Database {
    static instance = null;
    static dbPath;
    static async initialize(dbPath) {
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
        }
        catch (err) {
            console.error('❌ Erreur lors de l\'ouverture de la base de données:', err.message);
            throw err;
        }
    }
    static getInstance() {
        if (!this.instance) {
            throw new Error('Base de données non initialisée. Appelez Database.initialize() d\'abord.');
        }
        return this.instance;
    }
    // Exécuter une requête avec promesses
    static async run(sql, params = []) {
        return this.getInstance().prepare(sql).run(...params);
    }
    // Récupérer une ligne
    static async get(sql, params = []) {
        return this.getInstance().prepare(sql).get(...params);
    }
    // Récupérer toutes les lignes
    static async all(sql, params = []) {
        return this.getInstance().prepare(sql).all(...params);
    }
    // Transaction
    static async transaction(callback) {
        const txn = this.getInstance().transaction(callback);
        return txn();
    }
    // Fermer la base de données
    static async close() {
        if (this.instance) {
            this.instance.close();
            console.log('🔒 Base de données fermée');
            this.instance = null;
        }
    }
    // Obtenir la version du schéma actuel
    static async getSchemaVersion() {
        try {
            const result = await this.get('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1');
            return result?.version || 0;
        }
        catch (error) {
            // Si la table n'existe pas, on est à la version 0
            return 0;
        }
    }
    // Mettre à jour la version du schéma
    static async updateSchemaVersion(version) {
        await this.run('INSERT INTO schema_version (version, applied_at) VALUES (?, datetime("now"))', [version]);
    }
    // Backup de la base de données
    static async backup(backupPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = backupPath || `backup_${timestamp}.sqlite`;
        // Simple copie du fichier SQLite
        const sourcePath = this.dbPath;
        const destPath = path.resolve(backupFile);
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`📦 Backup créé: ${destPath}`);
            return destPath;
        }
        else {
            throw new Error('Fichier de base de données non trouvé');
        }
    }
}
//# sourceMappingURL=database.js.map