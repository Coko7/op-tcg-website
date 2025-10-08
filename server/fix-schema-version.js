#!/usr/bin/env node

/**
 * Script pour fixer la version du schéma
 * Si la structure est correcte mais la version est à 0, on la met à jour
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

console.log('\n🔧 Correction de la version du schéma');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📁 Base de données: ${dbPath}\n`);

try {
  const db = new Database(dbPath);

  // Vérifier la version actuelle
  const currentVersion = db.prepare('PRAGMA user_version').get();
  console.log(`Version actuelle: ${currentVersion.user_version}`);

  if (currentVersion.user_version === 12) {
    console.log('✅ La version est déjà à jour!\n');
    db.close();
    process.exit(0);
  }

  // Vérifier que la structure est complète
  console.log('\n🔍 Vérification de la structure...');

  const userColumns = db.prepare('PRAGMA table_info(users)').all();
  const hasBerrys = userColumns.find(col => col.name === 'berrys');
  const hasDailyReward = userColumns.find(col => col.name === 'last_daily_reward');

  if (!hasBerrys || !hasDailyReward) {
    console.log('❌ Structure incomplète, impossible de mettre à jour la version');
    console.log('   Exécutez plutôt: node server/scripts/run-migrations.js');
    db.close();
    process.exit(1);
  }

  console.log('✅ Structure semble complète');

  // Vérifier les tables essentielles
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table'
  `).all().map(t => t.name);

  const requiredTables = [
    'users', 'cards', 'boosters', 'user_collections',
    'booster_openings', 'achievements', 'user_achievements', 'audit_logs'
  ];

  const missingTables = requiredTables.filter(t => !tables.includes(t));

  if (missingTables.length > 0) {
    console.log(`❌ Tables manquantes: ${missingTables.join(', ')}`);
    console.log('   Exécutez: node server/scripts/run-migrations.js');
    db.close();
    process.exit(1);
  }

  console.log('✅ Toutes les tables présentes');

  // Mettre à jour la version du schéma
  console.log('\n🔄 Mise à jour de la version vers 12...');
  db.prepare('PRAGMA user_version = 12').run();

  // Vérifier
  const newVersion = db.prepare('PRAGMA user_version').get();
  console.log(`✅ Version mise à jour: ${newVersion.user_version}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Correction terminée!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  db.close();
  process.exit(0);

} catch (error) {
  console.error('\n❌ Erreur:', error.message);
  console.error(error.stack);
  process.exit(1);
}
