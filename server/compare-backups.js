#!/usr/bin/env node

/**
 * Compare les backups pour voir où les collections ont été perdues
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n📊 Comparaison des Backups');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Trouver tous les backups
const backupFiles = fs.readdirSync(__dirname)
  .filter(f => f.startsWith('migration_backup_') && f.endsWith('.sqlite'))
  .map(f => {
    const match = f.match(/migration_backup_v(\d+)_(\d+)\.sqlite/);
    return {
      name: f,
      path: path.join(__dirname, f),
      version: match ? parseInt(match[1]) : 0,
      timestamp: match ? parseInt(match[2]) : 0
    };
  })
  .sort((a, b) => a.version - b.version);

if (backupFiles.length === 0) {
  console.log('⚠️  Aucun backup trouvé\n');
  process.exit(0);
}

console.log('📋 Backups trouvés:\n');

const results = [];

for (const backup of backupFiles) {
  try {
    const db = new Database(backup.path, { readonly: true });

    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const collections = db.prepare('SELECT COUNT(*) as count FROM user_collections').get();
    const cards = db.prepare('SELECT COUNT(*) as count FROM cards').get();

    const date = new Date(backup.timestamp).toLocaleString();

    results.push({
      version: backup.version,
      name: backup.name,
      date,
      users: users.count,
      collections: collections.count,
      cards: cards.count
    });

    db.close();
  } catch (error) {
    console.log(`⚠️  Impossible de lire ${backup.name}: ${error.message}`);
  }
}

// Afficher les résultats
console.log('Version | Users | Collections | Cards | Date');
console.log('--------|-------|-------------|-------|------------------');

results.forEach(r => {
  const v = r.version.toString().padStart(7);
  const u = r.users.toString().padStart(5);
  const c = r.collections.toString().padStart(11);
  const k = r.cards.toString().padStart(5);
  console.log(`${v} | ${u} | ${c} | ${k} | ${r.date}`);
});

// Comparer avec la DB actuelle
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const currentDbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

if (fs.existsSync(currentDbPath)) {
  try {
    const db = new Database(currentDbPath, { readonly: true });

    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const collections = db.prepare('SELECT COUNT(*) as count FROM user_collections').get();
    const cards = db.prepare('SELECT COUNT(*) as count FROM cards').get();

    console.log('📊 Base de données ACTUELLE:');
    console.log(`   Utilisateurs: ${users.count}`);
    console.log(`   Collections: ${collections.count}`);
    console.log(`   Cartes: ${cards.count}`);

    db.close();

    // Trouver le backup avec le plus de collections
    const maxCollections = Math.max(...results.map(r => r.collections));
    const bestBackup = results.find(r => r.collections === maxCollections);

    if (bestBackup && bestBackup.collections > collections.count) {
      console.log('\n⚠️  PERTE DE DONNÉES DÉTECTÉE!');
      console.log(`   Backup v${bestBackup.version} avait ${bestBackup.collections} collections`);
      console.log(`   Base actuelle n'en a que ${collections.count}`);
      console.log(`   PERTE: ${bestBackup.collections - collections.count} collections\n`);
      console.log('💡 Pour restaurer:');
      console.log(`   node server/emergency-restore.js`);
      console.log(`   Ou copier manuellement: ${bestBackup.name}`);
    } else if (collections.count === 0) {
      console.log('\n⚠️  Base de données actuelle est VIDE!');
      if (bestBackup) {
        console.log(`   Meilleur backup: v${bestBackup.version} (${bestBackup.collections} collections)`);
        console.log('\n💡 Pour restaurer:');
        console.log(`   node server/emergency-restore.js`);
      }
    } else {
      console.log('\n✅ Pas de perte apparente de données');
    }

  } catch (error) {
    console.log(`⚠️  Impossible de lire la DB actuelle: ${error.message}`);
  }
}

console.log('\n');
