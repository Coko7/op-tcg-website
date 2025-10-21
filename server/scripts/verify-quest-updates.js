#!/usr/bin/env node

/**
 * Script de vérification automatique des mises à jour des quêtes
 * S'exécute après le démarrage pour confirmer que tout est bien appliqué
 */

const sqlite3 = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || './data/database.sqlite';
const JSON_PATH = './config/world-map-quests.json';

console.log('🔍 Vérification des mises à jour des quêtes...\n');

// Vérifier que les fichiers existent
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Base de données non trouvée:', DB_PATH);
  process.exit(1);
}

if (!fs.existsSync(JSON_PATH)) {
  console.error('❌ Fichier JSON des quêtes non trouvé:', JSON_PATH);
  process.exit(1);
}

try {
  // Charger le JSON
  const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  const jsonQuests = jsonData.quests;

  console.log(`✅ Fichier JSON chargé: ${jsonQuests.length} quêtes`);

  // Connexion à la DB
  const db = sqlite3(DB_PATH, { readonly: true });

  // Vérifier quelques quêtes clés
  const testQuests = [
    { id: 'quest_fuchsia_1', expectedReward: 50, name: 'Chercher de la viande' },
    { id: 'quest_orange_2', expectedReward: 375, name: 'Combattre Buggy' },
    { id: 'quest_syrup_2', expectedReward: 900, name: 'Déjouer le plan de Kuro' },
    { id: 'quest_water7_2', expectedReward: 4000, name: 'Sauver Robin' }
  ];

  let allCorrect = true;
  let errors = [];

  console.log('\n📋 Vérification des récompenses:');
  console.log('─'.repeat(70));

  for (const test of testQuests) {
    const quest = db.prepare('SELECT id, name, reward_berrys FROM quests WHERE id = ?').get(test.id);

    if (!quest) {
      errors.push(`  ❌ ${test.id}: Quête non trouvée en DB`);
      allCorrect = false;
      continue;
    }

    const isCorrect = quest.reward_berrys === test.expectedReward;
    const status = isCorrect ? '✅' : '❌';
    const details = isCorrect
      ? `${test.expectedReward} berrys`
      : `${quest.reward_berrys} berrys (attendu: ${test.expectedReward})`;

    console.log(`${status} ${test.name.padEnd(30)} ${details}`);

    if (!isCorrect) {
      allCorrect = false;
      errors.push(`  ❌ ${test.id}: ${quest.reward_berrys} au lieu de ${test.expectedReward}`);
    }
  }

  console.log('─'.repeat(70));

  // Vérifier le total
  const totalInDb = db.prepare('SELECT COUNT(*) as count FROM quests WHERE is_active = 1').get().count;
  console.log(`\n📊 Total quêtes actives en DB: ${totalInDb}`);

  if (totalInDb !== jsonQuests.length) {
    console.warn(`⚠️  ATTENTION: Le JSON contient ${jsonQuests.length} quêtes mais la DB en a ${totalInDb}`);
    allCorrect = false;
  }

  // Afficher le résultat final
  console.log('\n' + '═'.repeat(70));
  if (allCorrect) {
    console.log('✅ SUCCÈS: Toutes les quêtes sont correctement mises à jour !');
    console.log('═'.repeat(70));
    process.exit(0);
  } else {
    console.log('❌ ÉCHEC: Des quêtes n\'ont pas les bonnes valeurs');
    console.log('═'.repeat(70));
    console.log('\n⚠️  Erreurs détectées:');
    errors.forEach(err => console.log(err));
    console.log('\n💡 Solution:');
    console.log('   Exécutez manuellement: node dist/scripts/migrate-quests-from-json.js');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Erreur lors de la vérification:', error.message);
  process.exit(1);
}
