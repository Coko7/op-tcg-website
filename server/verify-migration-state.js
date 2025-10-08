#!/usr/bin/env node

/**
 * Vérification complète de l'état de la base de données et des migrations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

console.log('\n🔍 Vérification complète de la base de données');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📁 Chemin: ${dbPath}\n`);

try {
  const db = new Database(dbPath);

  // 1. Vérifier la version du schéma
  console.log('📊 Version du schéma:');
  const version = db.prepare('PRAGMA user_version').get();
  console.log(`   Version actuelle: ${version.user_version}`);
  console.log('');

  // 2. Vérifier la structure de la table users
  console.log('👤 Structure de la table users:');
  const userColumns = db.prepare('PRAGMA table_info(users)').all();

  console.log(`   Nombre de colonnes: ${userColumns.length}`);
  console.log('   Colonnes présentes:');
  userColumns.forEach(col => {
    console.log(`     - ${col.name} (${col.type})`);
  });
  console.log('');

  // Vérifier les colonnes critiques
  const requiredColumns = ['id', 'username', 'password_hash', 'berrys', 'last_daily_reward', 'available_boosters'];
  const missingColumns = requiredColumns.filter(
    col => !userColumns.find(c => c.name === col)
  );

  if (missingColumns.length > 0) {
    console.log(`   ❌ Colonnes manquantes: ${missingColumns.join(', ')}`);
  } else {
    console.log(`   ✅ Toutes les colonnes critiques présentes`);
  }
  console.log('');

  // 3. Vérifier la structure de user_collections
  console.log('📚 Structure de la table user_collections:');
  const ucColumns = db.prepare('PRAGMA table_info(user_collections)').all();

  console.log(`   Nombre de colonnes: ${ucColumns.length}`);
  console.log('   Colonnes présentes:');
  ucColumns.forEach(col => {
    console.log(`     - ${col.name} (${col.type})`);
  });
  console.log('');

  // 4. Vérifier les contraintes et indexes
  console.log('🔗 Indexes sur user_collections:');
  const indexes = db.prepare(`
    SELECT name, sql FROM sqlite_master
    WHERE type='index' AND tbl_name='user_collections'
  `).all();

  if (indexes.length === 0) {
    console.log('   ⚠️  Aucun index trouvé');
  } else {
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}`);
    });
  }
  console.log('');

  // 5. Vérifier les clés étrangères
  console.log('🔐 Clés étrangères sur user_collections:');
  const foreignKeys = db.prepare('PRAGMA foreign_key_list(user_collections)').all();

  if (foreignKeys.length === 0) {
    console.log('   ⚠️  Aucune clé étrangère trouvée');
  } else {
    foreignKeys.forEach(fk => {
      console.log(`   - ${fk.from} -> ${fk.table}.${fk.to}`);
    });
  }
  console.log('');

  // 6. Statistiques de données
  console.log('📊 Statistiques des données:');

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`   Total utilisateurs: ${userCount.count}`);

  const cardCount = db.prepare('SELECT COUNT(*) as count FROM cards').get();
  console.log(`   Total cartes: ${cardCount.count}`);

  const collectionCount = db.prepare('SELECT COUNT(*) as count FROM user_collections').get();
  console.log(`   Total collections: ${collectionCount.count}`);
  console.log('');

  // 7. Test de requête de collection
  console.log('🧪 Test de requête getCollection:');

  const testUser = db.prepare(`
    SELECT u.id, u.username
    FROM users u
    INNER JOIN user_collections uc ON u.id = uc.user_id
    LIMIT 1
  `).get();

  if (!testUser) {
    console.log('   ⚠️  Aucun utilisateur avec des cartes pour tester');
  } else {
    console.log(`   Test avec: ${testUser.username} (${testUser.id})`);

    try {
      const testCollection = db.prepare(`
        SELECT
          uc.user_id,
          uc.card_id,
          uc.quantity,
          uc.obtained_at,
          uc.is_favorite,
          c.id,
          c.name,
          c.character,
          c.rarity,
          c.type,
          c.color,
          c.cost,
          c.power,
          c.counter,
          c.attack,
          c.defense,
          c.description,
          c.special_ability,
          c.image_url,
          c.fallback_image_url,
          c.booster_id,
          c.vegapull_id,
          c.is_active
        FROM user_collections uc
        JOIN cards c ON uc.card_id = c.id
        WHERE uc.user_id = ?
        LIMIT 1
      `).get(testUser.id);

      if (!testCollection) {
        console.log('   ❌ Requête retourne aucun résultat !');
      } else {
        console.log('   ✅ Requête fonctionne');
        console.log(`   Carte de test: ${testCollection.name}`);

        // Vérifier toutes les colonnes
        const requiredCardColumns = [
          'id', 'card_id', 'quantity', 'obtained_at', 'is_favorite',
          'name', 'character', 'rarity', 'type', 'attack', 'defense',
          'booster_id', 'vegapull_id', 'is_active'
        ];

        const missingCardCols = requiredCardColumns.filter(
          col => testCollection[col] === undefined
        );

        if (missingCardCols.length > 0) {
          console.log(`   ❌ Colonnes manquantes: ${missingCardCols.join(', ')}`);
        } else {
          console.log('   ✅ Toutes les colonnes présentes');
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors de la requête: ${error.message}`);
    }
  }
  console.log('');

  // 8. Vérifier les données orphelines
  console.log('🔍 Vérification d\'intégrité:');

  // Collections orphelines (user_id n'existe pas)
  const orphanCollections = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_collections uc
    LEFT JOIN users u ON uc.user_id = u.id
    WHERE u.id IS NULL
  `).get();

  if (orphanCollections.count > 0) {
    console.log(`   ⚠️  ${orphanCollections.count} collections orphelines (user_id invalide)`);
  } else {
    console.log('   ✅ Pas de collections orphelines');
  }

  // Collections avec card_id invalide
  const invalidCards = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_collections uc
    LEFT JOIN cards c ON uc.card_id = c.id
    WHERE c.id IS NULL
  `).get();

  if (invalidCards.count > 0) {
    console.log(`   ⚠️  ${invalidCards.count} collections avec card_id invalide`);
  } else {
    console.log('   ✅ Pas de card_id invalides');
  }
  console.log('');

  // 9. Échantillon de données
  console.log('📦 Échantillon user_collections (3 premières):');
  const samples = db.prepare(`
    SELECT uc.*, u.username, c.name as card_name
    FROM user_collections uc
    LEFT JOIN users u ON uc.user_id = u.id
    LEFT JOIN cards c ON uc.card_id = c.id
    LIMIT 3
  `).all();

  if (samples.length === 0) {
    console.log('   ⚠️  Table user_collections est vide !');
  } else {
    samples.forEach((s, i) => {
      console.log(`   ${i + 1}. User: ${s.username || 'UNKNOWN'} | Card: ${s.card_name || 'UNKNOWN'} | Qty: ${s.quantity}`);
      console.log(`      user_id: ${s.user_id} | card_id: ${s.card_id}`);
    });
  }
  console.log('');

  // 10. Résumé final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RÉSUMÉ:');
  console.log(`   Version schéma: v${version.user_version}`);
  console.log(`   Colonnes users: ${userColumns.length} (attendu: 14)`);
  console.log(`   Colonnes user_collections: ${ucColumns.length} (attendu: 5-6)`);
  console.log(`   Collections totales: ${collectionCount.count}`);

  if (missingColumns.length > 0 || orphanCollections.count > 0 || invalidCards.count > 0) {
    console.log('   ❌ Problèmes détectés - voir détails ci-dessus');
  } else if (collectionCount.count === 0) {
    console.log('   ⚠️  Base de données vide (normal pour nouvelle installation)');
  } else {
    console.log('   ✅ Base de données semble OK');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  db.close();
  process.exit(0);

} catch (error) {
  console.error('\n❌ ERREUR FATALE:', error.message);
  console.error(error.stack);
  process.exit(1);
}
