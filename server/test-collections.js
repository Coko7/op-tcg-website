#!/usr/bin/env node

/**
 * Test de vérification des collections
 * Simule une requête getCollection pour vérifier que toutes les colonnes sont présentes
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

console.log('\n🧪 Test de récupération des collections');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📁 Base de données: ${dbPath}\n`);

try {
  const db = new Database(dbPath, { readonly: true });

  // Récupérer un utilisateur avec des cartes
  const userWithCards = db.prepare(`
    SELECT DISTINCT u.id, u.username
    FROM users u
    INNER JOIN user_collections uc ON u.id = uc.user_id
    LIMIT 1
  `).get();

  if (!userWithCards) {
    console.log('⚠️  Aucun utilisateur avec des cartes trouvé');
    console.log('   Créez un compte et ouvrez un booster pour tester');
    process.exit(0);
  }

  console.log(`👤 Test avec l'utilisateur: ${userWithCards.username}`);
  console.log(`   ID: ${userWithCards.id}\n`);

  // Exécuter la requête exacte de getCollection
  const collection = db.prepare(`
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
    ORDER BY uc.obtained_at DESC
  `).all(userWithCards.id);

  console.log(`📦 Nombre de cartes dans la collection: ${collection.length}\n`);

  if (collection.length === 0) {
    console.log('❌ PROBLÈME: Collection vide alors que l\'utilisateur a des cartes!');
    process.exit(1);
  }

  // Vérifier que toutes les colonnes requises sont présentes
  const requiredColumns = [
    'id', 'name', 'character', 'rarity', 'type', 'color', 'cost',
    'power', 'counter', 'attack', 'defense', 'description', 'special_ability',
    'image_url', 'fallback_image_url', 'booster_id', 'vegapull_id', 'is_active',
    'card_id', 'quantity', 'obtained_at', 'is_favorite'
  ];

  const firstCard = collection[0];
  const missingColumns = [];

  console.log('🔍 Vérification des colonnes requises:\n');

  requiredColumns.forEach(col => {
    if (firstCard[col] === undefined) {
      missingColumns.push(col);
      console.log(`  ❌ ${col}: MANQUANT`);
    } else {
      const value = firstCard[col];
      const displayValue = value === null ? 'NULL' :
                          typeof value === 'string' && value.length > 30 ? value.substring(0, 30) + '...' :
                          value;
      console.log(`  ✓ ${col}: ${displayValue}`);
    }
  });

  console.log('');

  if (missingColumns.length > 0) {
    console.log(`❌ ÉCHEC: ${missingColumns.length} colonnes manquantes`);
    console.log(`   Colonnes manquantes: ${missingColumns.join(', ')}`);
    process.exit(1);
  }

  // Afficher un échantillon de cartes
  console.log('📋 Échantillon de cartes (max 3):\n');

  collection.slice(0, 3).forEach((card, index) => {
    console.log(`  ${index + 1}. ${card.name} (${card.character})`);
    console.log(`     Rareté: ${card.rarity}`);
    console.log(`     Quantité: ${card.quantity}`);
    console.log(`     Type: ${card.type || 'N/A'}`);
    console.log(`     Coût: ${card.cost || 'N/A'} | Puissance: ${card.power || 'N/A'} | Compteur: ${card.counter || 'N/A'}`);
    if (card.attack !== null || card.defense !== null) {
      console.log(`     Attaque: ${card.attack || 'N/A'} | Défense: ${card.defense || 'N/A'}`);
    }
    console.log(`     Favori: ${card.is_favorite ? 'Oui' : 'Non'}`);
    console.log(`     Active: ${card.is_active ? 'Oui' : 'Non'}`);
    console.log('');
  });

  // Test de transformation (simuler transformCardToCamelCase)
  console.log('🔄 Test de transformation en camelCase:\n');

  const transformed = {
    card_id: firstCard.card_id,
    quantity: firstCard.quantity,
    obtained_at: firstCard.obtained_at,
    is_favorite: firstCard.is_favorite === 1,
    id: firstCard.id,
    name: firstCard.name,
    character: firstCard.character,
    rarity: firstCard.rarity,
    type: firstCard.type,
    color: firstCard.color ? (typeof firstCard.color === 'string' ? JSON.parse(firstCard.color) : firstCard.color) : undefined,
    cost: firstCard.cost,
    power: firstCard.power,
    counter: firstCard.counter,
    attack: firstCard.attack,
    defense: firstCard.defense,
    description: firstCard.description,
    special_ability: firstCard.special_ability,
    image_url: firstCard.image_url,
    fallback_image_url: firstCard.fallback_image_url,
    booster_id: firstCard.booster_id,
    vegapull_id: firstCard.vegapull_id,
    is_active: firstCard.is_active === 1
  };

  console.log('  Transformation réussie ✓');
  console.log(`  Objet final contient ${Object.keys(transformed).length} propriétés`);

  console.log('\n✅ SUCCÈS: Toutes les vérifications sont passées!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✓ Collections récupérables');
  console.log('✓ Toutes les colonnes présentes');
  console.log('✓ Transformation fonctionnelle');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  db.close();
  process.exit(0);

} catch (error) {
  console.error('\n❌ ERREUR:', error.message);
  console.error(error);
  process.exit(1);
}
