import { Database } from './database.js';
import fs from 'fs';
import path from 'path';

export interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

export class MigrationManager {
  private migrations: Migration[] = [];

  constructor() {
    this.loadMigrations();
  }

  private loadMigrations(): void {
    // Migration 1: Tables initiales
    this.migrations.push({
      version: 1,
      name: 'create_initial_tables',
      up: async () => {
        console.log('📦 Migration 1: Création des tables initiales...');

        // Table de versioning des migrations
        await Database.run(`
          CREATE TABLE IF NOT EXISTS schema_version (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version INTEGER NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Table des utilisateurs
        await Database.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_admin BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            available_boosters INTEGER DEFAULT 1,
            next_booster_time DATETIME,
            boosters_opened_today INTEGER DEFAULT 0,
            last_booster_opened DATETIME
          )
        `);

        // Table des boosters (référentiel)
        await Database.run(`
          CREATE TABLE IF NOT EXISTS boosters (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            series TEXT NOT NULL,
            description TEXT,
            release_date DATE,
            card_count INTEGER,
            image_url TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Table des cartes (référentiel)
        await Database.run(`
          CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            character_name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            attack INTEGER,
            defense INTEGER,
            cost INTEGER,
            power INTEGER,
            counter INTEGER,
            color TEXT, -- JSON array
            type TEXT,
            description TEXT,
            special_ability TEXT,
            image_url TEXT,
            booster_id TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booster_id) REFERENCES boosters(id) ON DELETE SET NULL
          )
        `);

        // Table des collections utilisateur
        await Database.run(`
          CREATE TABLE IF NOT EXISTS user_collections (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            card_id TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_favorite BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
            UNIQUE(user_id, card_id)
          )
        `);

        // Table des ouvertures de boosters (historique)
        await Database.run(`
          CREATE TABLE IF NOT EXISTS booster_openings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            booster_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            seed INTEGER NOT NULL,
            cards_obtained TEXT, -- JSON array des IDs de cartes
            opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (booster_id) REFERENCES boosters(id) ON DELETE SET NULL
          )
        `);

        // Index pour les performances
        await Database.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_user_collections_card_id ON user_collections(card_id)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_booster_openings_user_id ON booster_openings(user_id)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_cards_booster_id ON cards(booster_id)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity)');

        console.log('✅ Tables initiales créées');
      },
      down: async () => {
        console.log('🔄 Rollback Migration 1...');
        await Database.run('DROP TABLE IF EXISTS booster_openings');
        await Database.run('DROP TABLE IF EXISTS user_collections');
        await Database.run('DROP TABLE IF EXISTS cards');
        await Database.run('DROP TABLE IF EXISTS boosters');
        await Database.run('DROP TABLE IF EXISTS users');
        await Database.run('DROP TABLE IF EXISTS schema_version');
      }
    });

    // Migration 2: Table pour les tokens de session
    this.migrations.push({
      version: 2,
      name: 'add_user_sessions',
      up: async () => {
        console.log('📦 Migration 2: Ajout des sessions utilisateur...');

        await Database.run(`
          CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        await Database.run('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token)');

        console.log('✅ Sessions utilisateur ajoutées');
      },
      down: async () => {
        await Database.run('DROP TABLE IF EXISTS user_sessions');
      }
    });

    // Migration 3: Table pour les métadonnées de mise à jour des cartes
    this.migrations.push({
      version: 3,
      name: 'add_card_update_metadata',
      up: async () => {
        console.log('📦 Migration 3: Métadonnées de mise à jour...');

        await Database.run(`
          CREATE TABLE IF NOT EXISTS card_updates (
            id TEXT PRIMARY KEY,
            update_version TEXT NOT NULL,
            update_type TEXT NOT NULL, -- 'cards', 'boosters', 'both'
            cards_added INTEGER DEFAULT 0,
            cards_updated INTEGER DEFAULT 0,
            boosters_added INTEGER DEFAULT 0,
            boosters_updated INTEGER DEFAULT 0,
            vegapull_data_hash TEXT, -- Hash des données Vegapull pour détecter les changements
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            applied_by TEXT DEFAULT 'system'
          )
        `);

        // Table pour suivre les cartes manquantes (pour rollback)
        await Database.run(`
          CREATE TABLE IF NOT EXISTS missing_cards_backup (
            id TEXT PRIMARY KEY,
            card_id TEXT NOT NULL,
            card_data TEXT NOT NULL, -- JSON des données de la carte
            removed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            removal_reason TEXT
          )
        `);

        console.log('✅ Métadonnées de mise à jour ajoutées');
      },
      down: async () => {
        await Database.run('DROP TABLE IF EXISTS missing_cards_backup');
        await Database.run('DROP TABLE IF EXISTS card_updates');
      }
    });

    // Migration 4: Ajouter les colonnes pour les boosters et timers utilisateur
    this.migrations.push({
      version: 4,
      name: 'add_user_booster_columns',
      up: async () => {
        console.log('📦 Migration 4: Colonnes boosters utilisateur...');

        // Ajouter les colonnes manquantes à la table users
        try {
          await Database.run(`
            ALTER TABLE users ADD COLUMN available_boosters INTEGER DEFAULT 3
          `);
        } catch (error) {
          // La colonne existe peut-être déjà, ignorer l'erreur
          console.log('  ℹ️ Colonne available_boosters déjà présente');
        }

        try {
          await Database.run(`
            ALTER TABLE users ADD COLUMN next_booster_time TEXT
          `);
        } catch (error) {
          console.log('  ℹ️ Colonne next_booster_time déjà présente');
        }

        try {
          await Database.run(`
            ALTER TABLE users ADD COLUMN boosters_opened_today INTEGER DEFAULT 0
          `);
        } catch (error) {
          console.log('  ℹ️ Colonne boosters_opened_today déjà présente');
        }

        try {
          await Database.run(`
            ALTER TABLE users ADD COLUMN last_booster_opened TEXT
          `);
        } catch (error) {
          console.log('  ℹ️ Colonne last_booster_opened déjà présente');
        }

        console.log('✅ Colonnes boosters utilisateur ajoutées');
      },
      down: async () => {
        // SQLite ne supporte pas DROP COLUMN, on ne peut pas faire de rollback
        console.log('⚠️ Rollback non supporté pour cette migration (SQLite limitation)');
      }
    });

    // Migration 5: Ajouter les colonnes manquantes aux cartes
    this.migrations.push({
      version: 5,
      name: 'add_card_vegapull_columns',
      up: async () => {
        console.log('📦 Migration 5: Colonnes Vegapull pour les cartes...');

        // Ajouter les colonnes manquantes à la table cards
        try {
          await Database.run(`
            ALTER TABLE cards ADD COLUMN vegapull_id TEXT
          `);
        } catch (error) {
          console.log('  ℹ️ Colonne vegapull_id déjà présente');
        }

        try {
          await Database.run(`
            ALTER TABLE cards ADD COLUMN fallback_image_url TEXT
          `);
        } catch (error) {
          console.log('  ℹ️ Colonne fallback_image_url déjà présente');
        }

        // Corriger le nom de la colonne character_name vers character si nécessaire
        try {
          await Database.run(`
            ALTER TABLE cards RENAME COLUMN character_name TO character
          `);
        } catch (error) {
          console.log('  ℹ️ Colonne character déjà présente ou character_name n\'existe pas');
        }

        console.log('✅ Colonnes Vegapull pour les cartes ajoutées');
      },
      down: async () => {
        // SQLite ne supporte pas DROP COLUMN, on ne peut pas faire de rollback
        console.log('⚠️ Rollback non supporté pour cette migration (SQLite limitation)');
      }
    });

    // Migration 6: Supprimer la colonne email de la table users
    this.migrations.push({
      version: 6,
      name: 'remove_email_from_users',
      up: async () => {
        console.log('📦 Migration 6: Suppression de la colonne email...');

        // Créer une nouvelle table sans la colonne email
        await Database.run(`
          CREATE TABLE users_new (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_admin BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            available_boosters INTEGER DEFAULT 1,
            next_booster_time DATETIME,
            boosters_opened_today INTEGER DEFAULT 0,
            last_booster_opened DATETIME
          )
        `);

        // Copier les données sans la colonne email
        await Database.run(`
          INSERT INTO users_new (
            id, username, password_hash, created_at, updated_at,
            last_login, is_admin, is_active, available_boosters,
            next_booster_time, boosters_opened_today, last_booster_opened
          )
          SELECT
            id, username, password_hash, created_at, updated_at,
            last_login, is_admin, is_active,
            COALESCE(available_boosters, 1),
            next_booster_time,
            COALESCE(boosters_opened_today, 0),
            last_booster_opened
          FROM users
        `);

        // Supprimer l'ancienne table
        await Database.run('DROP TABLE users');

        // Renommer la nouvelle table
        await Database.run('ALTER TABLE users_new RENAME TO users');

        console.log('✅ Colonne email supprimée de la table users');
      },
      down: async () => {
        console.log('⚠️ Rollback non supporté pour cette migration');
      }
    });

    // Migration 7: Ajouter la colonne berrys
    this.migrations.push({
      version: 7,
      name: 'add_berrys_to_users',
      up: async () => {
        console.log('📦 Migration 7: Ajout de la colonne berrys...');

        try {
          await Database.run(`
            ALTER TABLE users ADD COLUMN berrys INTEGER DEFAULT 0
          `);
          console.log('✅ Colonne berrys ajoutée à la table users');
        } catch (error) {
          console.log('  ℹ️ Colonne berrys déjà présente');
        }
      },
      down: async () => {
        console.log('⚠️ Rollback non supporté pour cette migration (SQLite limitation)');
      }
    });

    // Migration 8: Ajouter les tables achievements
    this.migrations.push({
      version: 8,
      name: 'add_achievements_system',
      up: async () => {
        console.log('📦 Migration 8: Ajout du système d\'achievements...');

        // Table des achievements (référentiel)
        await Database.run(`
          CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            type TEXT NOT NULL, -- 'boosters_opened', 'unique_cards', 'booster_cards'
            category TEXT NOT NULL, -- catégorie pour grouper les achievements
            icon TEXT, -- nom d'icône ou emoji
            threshold INTEGER NOT NULL, -- valeur à atteindre
            reward_berrys INTEGER DEFAULT 0,
            booster_id TEXT, -- optionnel, pour les achievements liés à un booster spécifique
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booster_id) REFERENCES boosters(id) ON DELETE SET NULL
          )
        `);

        // Table pour suivre la progression des achievements
        await Database.run(`
          CREATE TABLE IF NOT EXISTS user_achievements (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            achievement_id TEXT NOT NULL,
            progress INTEGER DEFAULT 0,
            completed_at DATETIME,
            is_claimed BOOLEAN DEFAULT FALSE,
            claimed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
            UNIQUE(user_id, achievement_id)
          )
        `);

        // Index pour les performances
        await Database.run('CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)');
        await Database.run('CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id)');

        console.log('✅ Système d\'achievements créé');
      },
      down: async () => {
        console.log('🔄 Rollback Migration 8...');
        await Database.run('DROP TABLE IF EXISTS user_achievements');
        await Database.run('DROP TABLE IF EXISTS achievements');
      }
    });

    // Migration 9: Ajouter la colonne last_daily_reward pour les récompenses quotidiennes
    this.migrations.push({
      version: 9,
      name: 'add_daily_reward_to_users',
      up: async () => {
        console.log('📦 Migration 9: Ajout du système de récompense quotidienne...');

        try {
          await Database.run(`
            ALTER TABLE users ADD COLUMN last_daily_reward TEXT
          `);
          console.log('✅ Colonne last_daily_reward ajoutée à la table users');
        } catch (error) {
          console.log('  ℹ️ Colonne last_daily_reward déjà présente');
        }
      },
      down: async () => {
        console.log('⚠️ Rollback non supporté pour cette migration (SQLite limitation)');
      }
    });

    // Migration 10: Augmenter les récompenses des achievements de boosters
    this.migrations.push({
      version: 10,
      name: 'update_booster_achievement_rewards',
      up: async () => {
        console.log('📦 Migration 10: Augmentation des récompenses des achievements de boosters...');

        // Mettre à jour les achievements 50% (Collectionneur): 250 -> 500 Berrys
        await Database.run(`
          UPDATE achievements
          SET reward_berrys = 500
          WHERE type = 'booster_cards' AND icon = '🎯'
        `);
        console.log('  ✅ Achievements "Collectionneur" (50%) mis à jour: 250 -> 500 Berrys');

        // Mettre à jour les achievements 100% (Maître Complet): 500 -> 1000 Berrys
        await Database.run(`
          UPDATE achievements
          SET reward_berrys = 1000
          WHERE type = 'booster_cards' AND icon = '👑'
        `);
        console.log('  ✅ Achievements "Maître Complet" (100%) mis à jour: 500 -> 1000 Berrys');

        console.log('✅ Récompenses des achievements de boosters augmentées');
      },
      down: async () => {
        console.log('⚠️ Rollback non supporté pour cette migration');
      }
    });

    // Trier les migrations par version
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async getCurrentVersion(): Promise<number> {
    return await Database.getSchemaVersion();
  }

  async getLatestVersion(): Promise<number> {
    return this.migrations.length > 0 ?
      Math.max(...this.migrations.map(m => m.version)) : 0;
  }

  async migrate(targetVersion?: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const latestVersion = targetVersion || await this.getLatestVersion();

    console.log(`🔄 Migration de la version ${currentVersion} vers ${latestVersion}`);

    if (currentVersion === latestVersion) {
      console.log('✅ Base de données déjà à jour');
      return;
    }

    if (currentVersion > latestVersion) {
      throw new Error('Migration descendante non supportée pour le moment');
    }

    const migrationsToRun = this.migrations.filter(
      m => m.version > currentVersion && m.version <= latestVersion
    );

    if (migrationsToRun.length === 0) {
      console.log('ℹ️ Aucune migration à exécuter');
      return;
    }

    // Backup avant migration
    const backupPath = await Database.backup(`migration_backup_v${currentVersion}_${new Date().getTime()}.sqlite`);
    console.log(`🛡️ Backup créé: ${backupPath}`);

    try {
      // Exécuter les migrations sans transaction (better-sqlite3 ne supporte pas les async dans les transactions)
      for (const migration of migrationsToRun) {
        console.log(`▶️ Exécution de la migration ${migration.version}: ${migration.name}`);
        await migration.up();
        await Database.updateSchemaVersion(migration.version);
        console.log(`✅ Migration ${migration.version} terminée`);
      }

      const newVersion = await this.getCurrentVersion();
      console.log(`🎉 Migration terminée! Version: ${newVersion}`);

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      console.log(`🔄 Restaurer depuis le backup: ${backupPath}`);
      throw error;
    }
  }

  async rollback(targetVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();

    if (currentVersion <= targetVersion) {
      console.log('ℹ️ Aucun rollback nécessaire');
      return;
    }

    console.log(`🔄 Rollback de la version ${currentVersion} vers ${targetVersion}`);

    const migrationsToRollback = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse(); // Rollback en ordre inverse

    // Backup avant rollback
    const backupPath = await Database.backup(`rollback_backup_v${currentVersion}_${new Date().getTime()}.sqlite`);
    console.log(`🛡️ Backup créé: ${backupPath}`);

    try {
      // Exécuter les rollbacks sans transaction (better-sqlite3 ne supporte pas les async dans les transactions)
      for (const migration of migrationsToRollback) {
        if (migration.down) {
          console.log(`◀️ Rollback de la migration ${migration.version}: ${migration.name}`);
          await migration.down();
        } else {
          throw new Error(`Migration ${migration.version} n'a pas de fonction de rollback`);
        }
      }

      // Mettre à jour la version du schéma
      await Database.run('DELETE FROM schema_version WHERE version > ?', [targetVersion]);

      console.log(`🎉 Rollback terminé! Version: ${targetVersion}`);

    } catch (error) {
      console.error('❌ Erreur lors du rollback:', error);
      console.log(`🔄 Restaurer depuis le backup: ${backupPath}`);
      throw error;
    }
  }

  listMigrations(): void {
    console.log('\n📋 Migrations disponibles:');
    console.log('│');
    this.migrations.forEach(migration => {
      console.log(`├─ v${migration.version}: ${migration.name}`);
    });
    console.log('│');
  }

  async getStatus(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const latestVersion = await this.getLatestVersion();

    console.log('\n📊 Statut des migrations:');
    console.log(`├─ Version actuelle: ${currentVersion}`);
    console.log(`├─ Dernière version: ${latestVersion}`);

    if (currentVersion < latestVersion) {
      const pendingCount = this.migrations.filter(m => m.version > currentVersion).length;
      console.log(`├─ Migrations en attente: ${pendingCount}`);
    } else {
      console.log('├─ ✅ Base de données à jour');
    }
    console.log('│');
  }
}