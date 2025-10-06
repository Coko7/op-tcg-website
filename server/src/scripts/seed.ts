import dotenv from 'dotenv';
import { Database } from '../utils/database.js';
import { UserModel } from '../models/User.js';

// Charger les variables d'environnement
dotenv.config();

async function seedDatabase() {
  try {
    console.log('🌱 Début du seeding de la base de données...');

    // Initialiser la base de données
    await Database.initialize();

    // Créer l'utilisateur admin
    const adminData = {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123456'
    };

    // Vérifier si l'admin existe déjà
    const existingAdmin = await UserModel.findByUsername(adminData.username);
    if (existingAdmin) {
      console.log('👑 Utilisateur admin existe déjà:', adminData.username);
    } else {
      const admin = await UserModel.create(adminData);

      // Mettre l'utilisateur comme admin
      await UserModel.update(admin.id, { is_admin: true });

      console.log('👑 Utilisateur admin créé:', adminData.username);
    }

    // Créer un utilisateur de test
    const testUserData = {
      username: 'testuser',
      password: 'user123456'
    };

    const existingTestUser = await UserModel.findByUsername(testUserData.username);
    if (existingTestUser) {
      console.log('👤 Utilisateur de test existe déjà:', testUserData.username);
    } else {
      await UserModel.create(testUserData);
      console.log('👤 Utilisateur de test créé:', testUserData.username);
    }

    console.log('✅ Seeding terminé avec succès!');

    console.log('\n📋 Comptes disponibles:');
    console.log(`Admin: ${adminData.username} / ${adminData.password}`);
    console.log(`User:  ${testUserData.username} / ${testUserData.password}`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  } finally {
    await Database.close();
    process.exit(0);
  }
}

// Exécuter le seeding
seedDatabase();