#!/usr/bin/env node

/**
 * Script pour promouvoir un utilisateur en administrateur
 * Usage: node scripts/make-admin.js <username>
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Déterminer le chemin de la base de données
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/database.sqlite');

console.log('🔧 Script de promotion admin');
console.log(`📂 Base de données: ${dbPath}\n`);

// Récupérer le username depuis les arguments
const username = process.argv[2];

if (!username) {
  console.error('❌ Erreur: Nom d\'utilisateur requis');
  console.log('\n💡 Usage: node scripts/make-admin.js <username>');
  console.log('   Exemple: node scripts/make-admin.js john_doe');
  process.exit(1);
}

try {
  // Ouvrir la connexion à la base de données
  const db = new Database(dbPath);

  // Vérifier que l'utilisateur existe
  const user = db.prepare('SELECT id, username, is_admin FROM users WHERE username = ? AND is_active = 1').get(username);

  if (!user) {
    console.error(`❌ Utilisateur "${username}" introuvable ou inactif`);
    console.log('\n📋 Liste des utilisateurs disponibles:');

    const users = db.prepare('SELECT username, is_admin FROM users WHERE is_active = 1').all();
    users.forEach(u => {
      console.log(`   - ${u.username}${u.is_admin ? ' (déjà admin ⭐)' : ''}`);
    });

    db.close();
    process.exit(1);
  }

  // Vérifier si déjà admin
  if (user.is_admin) {
    console.log(`⚠️  L'utilisateur "${username}" est déjà administrateur`);
    db.close();
    process.exit(0);
  }

  // Promouvoir en admin
  const stmt = db.prepare('UPDATE users SET is_admin = 1, updated_at = ? WHERE id = ?');
  const now = new Date().toISOString();
  const result = stmt.run(now, user.id);

  if (result.changes > 0) {
    console.log(`✅ Utilisateur "${username}" promu en administrateur avec succès!`);
    console.log(`\n🔑 Vous pouvez maintenant vous connecter à l'interface admin:`);
    console.log(`   URL: http://localhost:5000/admin`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: <votre mot de passe>`);
  } else {
    console.error('❌ Erreur lors de la promotion');
  }

  db.close();

} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
