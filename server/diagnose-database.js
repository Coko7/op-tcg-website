#!/usr/bin/env node

/**
 * Script de diagnostic de la base de données
 * Vérifie l'intégrité et affiche les statistiques
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

console.log('\n🔍 Diagnostic de la base de données');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📁 Chemin: ${dbPath}\n`);

try {
  const db = new Database(dbPath, { readonly: true });

  // Vérifier les tables principales
  console.log('📊 Tables existantes:');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    ORDER BY name
  `).all();

  tables.forEach(t => console.log(`  ✓ ${t.name}`));
  console.log('');

  // Statistiques utilisateurs
  console.log('👥 Statistiques Utilisateurs:');
  const userStats = db.prepare(`
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_admin = 1 THEN 1 END) as admins,
      SUM(berrys) as total_berrys,
      AVG(berrys) as avg_berrys
    FROM users
  `).get();

  console.log(`  Total utilisateurs: ${userStats.total_users}`);
  console.log(`  Admins: ${userStats.admins}`);
  console.log(`  Total Berrys: ${userStats.total_berrys || 0}`);
  console.log(`  Moyenne Berrys: ${Math.round(userStats.avg_berrys || 0)}`);
  console.log('');

  // Statistiques cartes
  console.log('🃏 Statistiques Cartes:');
  const cardStats = db.prepare(`
    SELECT
      COUNT(*) as total_cards,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_cards
    FROM cards
  `).get();

  console.log(`  Total cartes: ${cardStats.total_cards}`);
  console.log(`  Cartes actives: ${cardStats.active_cards}`);
  console.log('');

  // Statistiques collections
  console.log('📚 Statistiques Collections:');
  const collectionStats = db.prepare(`
    SELECT
      COUNT(DISTINCT user_id) as users_with_cards,
      COUNT(*) as total_collection_entries,
      SUM(quantity) as total_cards_owned,
      AVG(quantity) as avg_quantity_per_entry
    FROM user_collections
  `).get();

  console.log(`  Utilisateurs avec des cartes: ${collectionStats.users_with_cards}`);
  console.log(`  Entrées de collection: ${collectionStats.total_collection_entries}`);
  console.log(`  Total cartes possédées: ${collectionStats.total_cards_owned || 0}`);
  console.log(`  Moyenne par entrée: ${Math.round(collectionStats.avg_quantity_per_entry || 0)}`);
  console.log('');

  // Collections par utilisateur
  console.log('📦 Collections par utilisateur:');
  const userCollections = db.prepare(`
    SELECT
      u.username,
      COUNT(uc.card_id) as unique_cards,
      SUM(uc.quantity) as total_cards,
      u.berrys
    FROM users u
    LEFT JOIN user_collections uc ON u.id = uc.user_id
    GROUP BY u.id
    ORDER BY total_cards DESC
    LIMIT 10
  `).all();

  if (userCollections.length === 0) {
    console.log('  ⚠️  Aucune collection trouvée !');
  } else {
    userCollections.forEach(uc => {
      console.log(`  ${uc.username}: ${uc.total_cards || 0} cartes (${uc.unique_cards || 0} uniques) - ${uc.berrys || 0} Berrys`);
    });
  }
  console.log('');

  // Vérifier l'intégrité
  console.log('🔧 Vérifications d\'intégrité:');

  // Orphan collections (cartes dans user_collections qui n'existent pas dans cards)
  const orphanCollections = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_collections uc
    LEFT JOIN cards c ON uc.card_id = c.id
    WHERE c.id IS NULL
  `).get();

  if (orphanCollections.count > 0) {
    console.log(`  ⚠️  ${orphanCollections.count} entrées orphelines (cartes inexistantes)`);
  } else {
    console.log(`  ✓ Aucune collection orpheline`);
  }

  // Orphan users (collections pour des utilisateurs qui n'existent pas)
  const orphanUsers = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_collections uc
    LEFT JOIN users u ON uc.user_id = u.id
    WHERE u.id IS NULL
  `).get();

  if (orphanUsers.count > 0) {
    console.log(`  ⚠️  ${orphanUsers.count} collections pour utilisateurs inexistants`);
  } else {
    console.log(`  ✓ Toutes les collections ont un utilisateur valide`);
  }

  // Vérifier les colonnes de user_collections
  console.log('\n📋 Structure table user_collections:');
  const ucColumns = db.prepare(`PRAGMA table_info(user_collections)`).all();
  ucColumns.forEach(col => {
    console.log(`  ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.pk ? ', PRIMARY KEY' : ''})`);
  });

  // Vérifier les colonnes de cards
  console.log('\n📋 Structure table cards:');
  const cardsColumns = db.prepare(`PRAGMA table_info(cards)`).all();
  cardsColumns.forEach(col => {
    console.log(`  ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.pk ? ', PRIMARY KEY' : ''})`);
  });

  console.log('\n✅ Diagnostic terminé\n');

  db.close();
} catch (error) {
  console.error('\n❌ Erreur:', error.message);
  console.error(error);
  process.exit(1);
}
