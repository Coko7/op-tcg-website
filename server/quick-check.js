#!/usr/bin/env node

/**
 * Vérification rapide du nombre de collections
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

console.log('\n🔍 Vérification rapide');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const db = new Database(dbPath, { readonly: true });

  // Compter les utilisateurs
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`👥 Utilisateurs: ${users.count}`);

  // Compter les collections
  const collections = db.prepare('SELECT COUNT(*) as count FROM user_collections').get();
  console.log(`📚 Collections: ${collections.count}`);

  // Compter les cartes
  const cards = db.prepare('SELECT COUNT(*) as count FROM cards').get();
  console.log(`🃏 Cartes: ${cards.count}`);

  // Si collections > 0, montrer un exemple
  if (collections.count > 0) {
    console.log('\n✅ Collections trouvées!');

    const example = db.prepare(`
      SELECT uc.user_id, uc.card_id, uc.quantity, u.username, c.name
      FROM user_collections uc
      LEFT JOIN users u ON uc.user_id = u.id
      LEFT JOIN cards c ON uc.card_id = c.id
      LIMIT 1
    `).get();

    if (example) {
      console.log(`   Exemple: ${example.username} possède ${example.quantity}x ${example.name || 'UNKNOWN CARD'}`);

      if (!example.name) {
        console.log('\n⚠️  PROBLÈME: La carte n\'existe pas dans la table cards!');
        console.log(`   card_id: ${example.card_id}`);
      }
    }
  } else {
    console.log('\n❌ Aucune collection trouvée!');
    console.log('   Les données ont peut-être été perdues lors de la migration.');
  }

  db.close();
  console.log('\n');

} catch (error) {
  console.error('\n❌ Erreur:', error.message);
  process.exit(1);
}
