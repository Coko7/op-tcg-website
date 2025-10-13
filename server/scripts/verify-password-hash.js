#!/usr/bin/env node

/**
 * Script pour vérifier qu'un mot de passe correspond à un hash bcrypt
 * Utile pour tester un hash avant de l'appliquer en base de données
 *
 * Usage:
 *   node scripts/verify-password-hash.js "mot_de_passe" "hash_bcrypt"
 */

import bcrypt from 'bcryptjs';

async function verifyPasswordHash() {
  const password = process.argv[2];
  const hash = process.argv[3];

  if (!password || !hash) {
    console.error('❌ Erreur: Arguments manquants');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/verify-password-hash.js "mot_de_passe" "hash_bcrypt"');
    console.log('');
    console.log('Exemple:');
    console.log('  node scripts/verify-password-hash.js "password123" "$2a$12$abc..."');
    process.exit(1);
  }

  console.log('🔍 Vérification du hash...');
  console.log('');
  console.log('📝 Paramètres:');
  console.log(`   Mot de passe: ${'*'.repeat(password.length)} (${password.length} caractères)`);
  console.log(`   Hash: ${hash.substring(0, 20)}...`);
  console.log('');

  try {
    const startTime = Date.now();
    const isValid = await bcrypt.compare(password, hash);
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (isValid) {
      console.log('✅ Le mot de passe correspond au hash!');
      console.log('');
      console.log('   Le hash est valide et peut être utilisé en base de données.');
    } else {
      console.log('❌ Le mot de passe ne correspond PAS au hash!');
      console.log('');
      console.log('   Vérifiez que vous utilisez le bon mot de passe ou le bon hash.');
    }

    console.log('');
    console.log(`⏱️  Temps de vérification: ${duration}ms`);

    process.exit(isValid ? 0 : 1);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Exécuter la fonction
verifyPasswordHash();
