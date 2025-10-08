#!/usr/bin/env node

/**
 * Script de restauration depuis le dernier backup de migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = __dirname;

// Trouver tous les fichiers de backup
const backupFiles = fs.readdirSync(backupDir)
  .filter(f => f.startsWith('migration_backup_') && f.endsWith('.sqlite'))
  .sort()
  .reverse();

if (backupFiles.length === 0) {
  console.error('❌ Aucun fichier de backup trouvé');
  process.exit(1);
}

console.log('\n📋 Fichiers de backup disponibles:');
backupFiles.forEach((file, index) => {
  const stats = fs.statSync(path.join(backupDir, file));
  const date = new Date(stats.mtime).toLocaleString();
  console.log(`  ${index + 1}. ${file} (${date})`);
});

const latestBackup = backupFiles[0];
const backupPath = path.join(backupDir, latestBackup);
const dbPath = path.join(backupDir, 'database.sqlite');

console.log(`\n🔄 Restauration depuis: ${latestBackup}`);
console.log(`   Taille: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB`);

// Sauvegarder la DB actuelle avant restauration
if (fs.existsSync(dbPath)) {
  const currentBackupName = `database_before_restore_${Date.now()}.sqlite`;
  const currentBackupPath = path.join(backupDir, currentBackupName);
  fs.copyFileSync(dbPath, currentBackupPath);
  console.log(`   💾 DB actuelle sauvegardée: ${currentBackupName}`);
}

// Restaurer
try {
  fs.copyFileSync(backupPath, dbPath);
  console.log(`✅ Restauration réussie!`);
  console.log(`\n⚠️  Note: Redémarrez le serveur pour appliquer les changements`);
} catch (error) {
  console.error(`❌ Erreur lors de la restauration:`, error.message);
  process.exit(1);
}
