#!/usr/bin/env node

/**
 * Script de restauration d'urgence
 * Restaure la base de données depuis le backup le plus récent
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const backupDir = __dirname;
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('\n⚠️  SCRIPT DE RESTAURATION D\'URGENCE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Trouver tous les backups
const backupFiles = fs.readdirSync(backupDir)
  .filter(f => f.startsWith('migration_backup_') && f.endsWith('.sqlite'))
  .map(f => {
    const stats = fs.statSync(path.join(backupDir, f));
    const match = f.match(/migration_backup_v(\d+)_(\d+)\.sqlite/);
    return {
      name: f,
      path: path.join(backupDir, f),
      version: match ? parseInt(match[1]) : 0,
      timestamp: match ? parseInt(match[2]) : 0,
      size: stats.size,
      date: stats.mtime
    };
  })
  .sort((a, b) => b.timestamp - a.timestamp); // Plus récent d'abord

if (backupFiles.length === 0) {
  console.error('❌ Aucun fichier de backup trouvé!');
  console.log('\nRecherche dans: ', backupDir);
  console.log('Pattern: migration_backup_v*.sqlite\n');
  process.exit(1);
}

console.log('📋 Backups disponibles:\n');
backupFiles.forEach((file, index) => {
  const date = new Date(file.date).toLocaleString();
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  console.log(`  ${index + 1}. v${file.version} - ${date} (${sizeMB} MB)`);
  console.log(`     ${file.name}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Analyser le backup le plus récent
const Database = require('better-sqlite3');

console.log('🔍 Analyse du backup le plus récent...\n');
const latestBackup = backupFiles[0];

try {
  const db = new Database(latestBackup.path, { readonly: true });

  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const collections = db.prepare('SELECT COUNT(*) as count FROM user_collections').get();
  const cards = db.prepare('SELECT COUNT(*) as count FROM cards').get();

  console.log(`📊 Contenu du backup v${latestBackup.version}:`);
  console.log(`   Utilisateurs: ${users.count}`);
  console.log(`   Collections: ${collections.count}`);
  console.log(`   Cartes: ${cards.count}`);

  db.close();
  console.log('\n');

} catch (error) {
  console.error(`⚠️  Impossible d'analyser le backup: ${error.message}\n`);
}

// Analyser la DB actuelle
if (fs.existsSync(dbPath)) {
  console.log('🔍 Analyse de la base actuelle...\n');

  try {
    const db = new Database(dbPath, { readonly: true });

    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const collections = db.prepare('SELECT COUNT(*) as count FROM user_collections').get();
    const cards = db.prepare('SELECT COUNT(*) as count FROM cards').get();

    console.log('📊 Base de données actuelle:');
    console.log(`   Utilisateurs: ${users.count}`);
    console.log(`   Collections: ${collections.count}`);
    console.log(`   Cartes: ${cards.count}`);

    db.close();
    console.log('\n');

  } catch (error) {
    console.error(`⚠️  Impossible d'analyser la DB actuelle: ${error.message}\n`);
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Demander confirmation
rl.question('⚠️  Voulez-vous restaurer depuis le backup le plus récent? (oui/non): ', (answer) => {
  if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'y') {
    console.log('\n❌ Restauration annulée.\n');
    rl.close();
    process.exit(0);
  }

  console.log('\n🔄 Restauration en cours...\n');

  try {
    // Backup de la DB actuelle
    if (fs.existsSync(dbPath)) {
      const emergencyBackup = path.join(backupDir, `emergency_backup_${Date.now()}.sqlite`);
      console.log(`💾 Sauvegarde de la DB actuelle vers:`);
      console.log(`   ${emergencyBackup}\n`);
      fs.copyFileSync(dbPath, emergencyBackup);
    }

    // Restaurer
    console.log(`📥 Restauration depuis:`);
    console.log(`   ${latestBackup.name}\n`);
    fs.copyFileSync(latestBackup.path, dbPath);

    // Vérifier
    const db = new Database(dbPath, { readonly: true });
    const version = db.prepare('PRAGMA user_version').get();
    const collections = db.prepare('SELECT COUNT(*) as count FROM user_collections').get();

    console.log('✅ Restauration réussie!\n');
    console.log('📊 Nouvelle base de données:');
    console.log(`   Version schéma: v${version.user_version}`);
    console.log(`   Collections: ${collections.count}\n`);

    db.close();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  ÉTAPES SUIVANTES:');
    console.log('');
    console.log('1. Relancer les migrations pour mettre à jour le schéma:');
    console.log('   node server/scripts/run-migrations.js');
    console.log('');
    console.log('2. Redémarrer le serveur:');
    console.log('   npm run dev  (local)');
    console.log('   OU');
    console.log('   docker-compose restart backend  (Docker)');
    console.log('');
    console.log('3. Vérifier que les collections sont de retour:');
    console.log('   node server/quick-check.js');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR lors de la restauration:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
});
