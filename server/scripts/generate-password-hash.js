#!/usr/bin/env node

/**
 * Script pour générer un hash de mot de passe bcrypt
 * Utile pour réinitialiser manuellement le mot de passe d'un utilisateur
 *
 * Usage:
 *   node scripts/generate-password-hash.js "mon_nouveau_mot_de_passe"
 *   node scripts/generate-password-hash.js "mon_nouveau_mot_de_passe" 12
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function generatePasswordHash() {
  // Récupérer le mot de passe depuis les arguments
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Erreur: Mot de passe manquant');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/generate-password-hash.js "mon_mot_de_passe"');
    console.log('  node scripts/generate-password-hash.js "mon_mot_de_passe" 12  # Spécifier les rounds');
    console.log('');
    console.log('Exemples:');
    console.log('  node scripts/generate-password-hash.js "password123"');
    console.log('  node scripts/generate-password-hash.js "P@ssw0rd!" 10');
    process.exit(1);
  }

  // Récupérer le nombre de rounds (argument optionnel ou depuis .env ou défaut)
  const roundsArg = process.argv[3];
  const rounds = roundsArg
    ? parseInt(roundsArg, 10)
    : parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

  // Validation
  if (isNaN(rounds) || rounds < 4 || rounds > 31) {
    console.error('❌ Erreur: Le nombre de rounds doit être entre 4 et 31');
    console.log(`   Valeur fournie: ${roundsArg || 'non spécifié'}`);
    process.exit(1);
  }

  console.log('🔐 Génération du hash de mot de passe...');
  console.log('');
  console.log('📝 Paramètres:');
  console.log(`   Mot de passe: ${'*'.repeat(password.length)} (${password.length} caractères)`);
  console.log(`   Rounds bcrypt: ${rounds}`);
  console.log('');

  try {
    const startTime = Date.now();
    const hash = await bcrypt.hash(password, rounds);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('✅ Hash généré avec succès!');
    console.log('');
    console.log('📋 Hash bcrypt:');
    console.log(`   ${hash}`);
    console.log('');
    console.log(`⏱️  Temps de génération: ${duration}ms`);
    console.log('');
    console.log('💾 Requête SQL pour mettre à jour en base de données:');
    console.log('');
    console.log('   UPDATE users');
    console.log(`   SET password_hash = '${hash}',`);
    console.log(`       updated_at = datetime('now')`);
    console.log("   WHERE username = 'NOM_UTILISATEUR';");
    console.log('');
    console.log('⚠️  Remplacez NOM_UTILISATEUR par le username de l\'utilisateur concerné');
    console.log('');
    console.log('🔍 Pour vérifier que le hash fonctionne:');
    console.log(`   node scripts/verify-password-hash.js "${password}" "${hash}"`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération du hash:', error);
    process.exit(1);
  }
}

// Exécuter la fonction
generatePasswordHash();
