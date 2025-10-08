#!/usr/bin/env node

/**
 * Script de backup automatique de la base de données
 * Crée un backup compressé avec rotation (garde les 30 derniers jours)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '30'); // Garder 30 jours

console.log('\n📦 Backup de la base de données');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function createBackup() {
  try {
    // Créer le dossier de backup s'il n'existe pas
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`✅ Dossier de backup créé: ${BACKUP_DIR}`);
    }

    // Vérifier que la DB existe
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ Base de données introuvable:', DB_PATH);
      process.exit(1);
    }

    // Nom du backup avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupName = `backup_${timestamp}_${time}.sqlite`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    console.log(`📁 Source: ${DB_PATH}`);
    console.log(`📁 Destination: ${backupPath}`);

    // Copier la base de données
    console.log('\n🔄 Copie en cours...');
    fs.copyFileSync(DB_PATH, backupPath);

    const stats = fs.statSync(backupPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(`✅ Backup créé: ${sizeMB} MB`);

    // Compresser le backup (optionnel si gzip est disponible)
    try {
      console.log('🗜️  Compression...');
      await execAsync(`gzip -9 "${backupPath}"`);
      const gzPath = `${backupPath}.gz`;
      if (fs.existsSync(gzPath)) {
        const gzStats = fs.statSync(gzPath);
        const gzSizeMB = (gzStats.size / 1024 / 1024).toFixed(2);
        const ratio = ((1 - gzStats.size / stats.size) * 100).toFixed(1);
        console.log(`✅ Compressé: ${gzSizeMB} MB (${ratio}% de réduction)`);
      }
    } catch (error) {
      console.log('ℹ️  Compression non disponible (pas grave)');
    }

    // Nettoyer les vieux backups
    console.log('\n🧹 Nettoyage des anciens backups...');
    cleanOldBackups();

    console.log('\n✅ Backup terminé avec succès!\n');
    return backupPath;

  } catch (error) {
    console.error('\n❌ Erreur lors du backup:', error.message);
    throw error;
  }
}

function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && (f.endsWith('.sqlite') || f.endsWith('.sqlite.gz')))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime); // Plus récent d'abord

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    console.log(`   Suppression de ${toDelete.length} ancien(s) backup(s)`);

    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`   ✓ Supprimé: ${file.name}`);
    });
  } else {
    console.log(`   Backups actuels: ${files.length}/${MAX_BACKUPS}`);
  }
}

// Exécuter le backup
createBackup()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
