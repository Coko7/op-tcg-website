#!/usr/bin/env node

/**
 * Log Rotation Script
 * Nettoie les logs anciens pour éviter l'explosion de la taille du container
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAX_LOG_AGE_DAYS = parseInt(process.env.MAX_LOG_AGE_DAYS || '7');
const MAX_LOG_SIZE_MB = parseInt(process.env.MAX_LOG_SIZE_MB || '100');
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../logs');

/**
 * Convertir les jours en millisecondes
 */
function daysToMs(days) {
  return days * 24 * 60 * 60 * 1000;
}

/**
 * Convertir les octets en MB
 */
function bytesToMB(bytes) {
  return bytes / (1024 * 1024);
}

/**
 * Nettoyer les fichiers logs anciens
 */
async function cleanOldLogs() {
  try {
    console.log('🧹 Nettoyage des logs anciens...');
    console.log(`📁 Répertoire: ${LOG_DIR}`);
    console.log(`⏰ Max âge: ${MAX_LOG_AGE_DAYS} jours`);
    console.log(`💾 Max taille: ${MAX_LOG_SIZE_MB} MB`);

    // Vérifier si le répertoire existe
    if (!fs.existsSync(LOG_DIR)) {
      console.log('✅ Aucun répertoire de logs trouvé');
      return;
    }

    const now = Date.now();
    const maxAge = daysToMs(MAX_LOG_AGE_DAYS);
    const files = fs.readdirSync(LOG_DIR);

    let deletedCount = 0;
    let freedSpace = 0;

    for (const file of files) {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);

      // Vérifier si c'est un fichier (pas un dossier)
      if (!stats.isFile()) {
        continue;
      }

      const fileAge = now - stats.mtimeMs;
      const fileSizeMB = bytesToMB(stats.size);

      // Supprimer si trop vieux
      if (fileAge > maxAge) {
        console.log(`  ✗ ${file} (${Math.floor(fileAge / daysToMs(1))} jours)`);
        fs.unlinkSync(filePath);
        deletedCount++;
        freedSpace += stats.size;
        continue;
      }

      // Supprimer si trop gros
      if (fileSizeMB > MAX_LOG_SIZE_MB) {
        console.log(`  ✗ ${file} (${fileSizeMB.toFixed(2)} MB)`);
        fs.unlinkSync(filePath);
        deletedCount++;
        freedSpace += stats.size;
      }
    }

    console.log(`\n✅ ${deletedCount} fichiers supprimés`);
    console.log(`💾 ${bytesToMB(freedSpace).toFixed(2)} MB libérés`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des logs:', error);
    process.exit(1);
  }
}

/**
 * Nettoyer les fichiers de migration backup anciens
 */
async function cleanOldMigrationBackups() {
  try {
    console.log('\n🧹 Nettoyage des backups de migration anciens...');

    const serverDir = path.join(__dirname, '..');
    const files = fs.readdirSync(serverDir);
    const migrationBackups = files.filter(f => f.startsWith('migration_backup_'));

    if (migrationBackups.length === 0) {
      console.log('✅ Aucun backup de migration trouvé');
      return;
    }

    // Garder uniquement les 5 derniers backups de migration
    const MAX_MIGRATION_BACKUPS = 5;

    // Trier par date de modification (plus récent en premier)
    const sortedBackups = migrationBackups
      .map(file => ({
        name: file,
        path: path.join(serverDir, file),
        mtime: fs.statSync(path.join(serverDir, file)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);

    let deletedCount = 0;
    let freedSpace = 0;

    // Supprimer les backups au-delà de la limite
    for (let i = MAX_MIGRATION_BACKUPS; i < sortedBackups.length; i++) {
      const backup = sortedBackups[i];
      const stats = fs.statSync(backup.path);

      console.log(`  ✗ ${backup.name}`);
      fs.unlinkSync(backup.path);
      deletedCount++;
      freedSpace += stats.size;
    }

    console.log(`\n✅ ${deletedCount} backups de migration supprimés`);
    console.log(`💾 ${bytesToMB(freedSpace).toFixed(2)} MB libérés`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des backups:', error);
  }
}

/**
 * Nettoyer les fichiers temporaires
 */
async function cleanTempFiles() {
  try {
    console.log('\n🧹 Nettoyage des fichiers temporaires...');

    const serverDir = path.join(__dirname, '..');
    const files = fs.readdirSync(serverDir);

    // Nettoyer les fichiers .log
    const logFiles = files.filter(f => f.endsWith('.log'));

    let deletedCount = 0;
    let freedSpace = 0;

    for (const file of logFiles) {
      const filePath = path.join(serverDir, file);
      const stats = fs.statSync(filePath);

      console.log(`  ✗ ${file}`);
      fs.unlinkSync(filePath);
      deletedCount++;
      freedSpace += stats.size;
    }

    // Nettoyer les fichiers SQLite temporaires (WAL, SHM) sauf database.sqlite-*
    const tempSqliteFiles = files.filter(f =>
      (f.endsWith('-shm') || f.endsWith('-wal')) &&
      !f.startsWith('database.sqlite')
    );

    for (const file of tempSqliteFiles) {
      const filePath = path.join(serverDir, file);
      const stats = fs.statSync(filePath);

      console.log(`  ✗ ${file}`);
      fs.unlinkSync(filePath);
      deletedCount++;
      freedSpace += stats.size;
    }

    console.log(`\n✅ ${deletedCount} fichiers temporaires supprimés`);
    console.log(`💾 ${bytesToMB(freedSpace).toFixed(2)} MB libérés`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des fichiers temporaires:', error);
  }
}

// Exécution
(async () => {
  console.log('🚀 Démarrage du nettoyage...\n');

  await cleanOldLogs();
  await cleanOldMigrationBackups();
  await cleanTempFiles();

  console.log('\n🎉 Nettoyage terminé avec succès');
})();
