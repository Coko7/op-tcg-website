#!/usr/bin/env node

/**
 * Script pour envoyer une notification de compensation à tous les utilisateurs
 * Compense pour la perte de données avec 1000 berrys
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../data/database.sqlite');

/**
 * Envoyer la notification de compensation
 */
async function sendCompensation() {
  let db;

  try {
    console.log('🎁 Envoi de la compensation aux utilisateurs...\n');

    // Connexion à la base de données
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    // 1. Vérifier si la notification de compensation existe déjà
    const existingNotif = db.prepare(`
      SELECT id FROM notifications
      WHERE title = 'Cadeau de compensation'
    `).get();

    if (existingNotif) {
      console.log('⚠️  Une notification de compensation existe déjà');
      console.log('❓ Voulez-vous en créer une nouvelle ? (Ctrl+C pour annuler)');
      // En production, on skip si elle existe déjà
      console.log('✅ Skip - notification déjà envoyée');
      return;
    }

    // 2. Récupérer le premier admin
    const admin = db.prepare(`
      SELECT id, username FROM users WHERE is_admin = 1 LIMIT 1
    `).get();

    if (!admin) {
      console.error('❌ Erreur: Aucun administrateur trouvé');
      process.exit(1);
    }

    console.log(`👤 Admin trouvé: ${admin.username}`);

    // 3. Créer la notification
    const notificationId = uuidv4();
    const now = new Date().toISOString();

    const title = 'Cadeau de compensation';
    const message = `Chers joueurs,\n\nNous avons récemment constaté une perte de données qui a affecté certaines collections de cartes. Nous nous excusons sincèrement pour ce désagrément.\n\nPour vous remercier de votre patience et de votre compréhension, nous vous offrons 1000 Berrys en guise de compensation.\n\nMerci de faire partie de notre communauté !\n\n- L'équipe One Piece Booster Game`;
    const rewardBerrys = 1000;
    const rewardBoosters = 0;

    db.prepare(`
      INSERT INTO notifications (
        id, title, message, reward_berrys, reward_boosters,
        is_active, created_by, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, NULL)
    `).run(
      notificationId,
      title,
      message,
      rewardBerrys,
      rewardBoosters,
      admin.id,
      now
    );

    console.log('✅ Notification créée avec succès');
    console.log(`📝 ID: ${notificationId}`);
    console.log(`💰 Récompense: ${rewardBerrys} Berrys`);
    console.log('');

    // 4. Vérifier combien d'utilisateurs vont recevoir la notification
    const userCount = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE is_active = 1
    `).get();

    console.log(`👥 ${userCount.count} utilisateurs actifs recevront cette notification`);
    console.log('');

    // 5. Afficher les détails de la notification
    console.log('📋 Détails de la notification:');
    console.log(`   Titre: ${title}`);
    console.log(`   Message: ${message.substring(0, 100)}...`);
    console.log(`   Récompense: ${rewardBerrys} Berrys + ${rewardBoosters} Boosters`);
    console.log('');

    console.log('🎉 Compensation envoyée avec succès !');
    console.log('💡 Les utilisateurs pourront réclamer leur récompense dans l\'onglet Notifications');

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la compensation:', error);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
    }
  }
}

// Exécution
sendCompensation();
