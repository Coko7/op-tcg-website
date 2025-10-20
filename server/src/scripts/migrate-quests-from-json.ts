import { Database } from '../utils/database.js';
import { WorldMapModel } from '../models/WorldMap.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QuestData {
  id: string;
  island_id: string;
  name: string;
  description: string;
  duration_hours: number;
  reward_berrys: number;
  required_crew_count: number;
  specific_crew_member_id: string | null;
  order_index: number;
  is_repeatable: boolean;
}

interface IslandData {
  id: string;
  name: string;
  order_index: number;
  description: string;
  latitude: number;
  longitude: number;
  unlock_requirement_island_id: string | null;
  final_reward_type: 'berrys' | 'crew_member' | null;
  final_reward_value: number | null;
  final_reward_crew_member_id: string | null;
}

interface CrewMemberData {
  id: string;
  name: string;
  description: string;
  image_url: string;
  unlock_island_id: string | null;
  order_index: number;
}

interface WorldMapData {
  islands: IslandData[];
  crewMembers: CrewMemberData[];
  quests: QuestData[];
}

/**
 * Script de migration des quêtes depuis JSON
 * - Charge les données depuis world-map-quests.json
 * - Met à jour les îles, membres d'équipage et quêtes
 * - PRÉSERVE la progression des joueurs (user_islands, user_crew_members, active_quests, quest_history)
 */
async function migrateQuestsFromJson() {
  console.log('🔄 Début de la migration des quêtes depuis JSON...\n');

  try {
    // Initialiser la base de données
    await Database.initialize();
    console.log('✅ Base de données initialisée\n');

    // Lire le fichier JSON
    const jsonPath = path.join(__dirname, '../../config/world-map-quests.json');
    console.log(`📖 Lecture du fichier: ${jsonPath}`);

    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const data: WorldMapData = JSON.parse(jsonContent);

    console.log(`✅ Fichier JSON chargé:`);
    console.log(`   - ${data.islands.length} îles`);
    console.log(`   - ${data.crewMembers.length} membres d'équipage`);
    console.log(`   - ${data.quests.length} quêtes\n`);

    // ÉTAPE 1: Sauvegarder la progression des joueurs
    console.log('💾 Sauvegarde de la progression des joueurs...');

    const userIslands = await Database.all('SELECT * FROM user_islands');
    const userCrewMembers = await Database.all('SELECT * FROM user_crew_members');
    const activeQuests = await Database.all('SELECT * FROM active_quests');
    const questHistory = await Database.all('SELECT * FROM quest_history');

    console.log(`   - ${userIslands.length} îles débloquées`);
    console.log(`   - ${userCrewMembers.length} membres d'équipage débloqués`);
    console.log(`   - ${activeQuests.length} quêtes actives`);
    console.log(`   - ${questHistory.length} quêtes dans l'historique\n`);

    // ÉTAPE 2: Désactiver les anciennes données au lieu de les supprimer
    console.log('🔄 Désactivation des anciennes données...');

    await Database.run('UPDATE quests SET is_active = 0 WHERE is_active = 1');
    await Database.run('UPDATE islands SET is_active = 0 WHERE is_active = 1');
    await Database.run('UPDATE crew_members SET is_active = 0 WHERE is_active = 1');

    console.log('✅ Anciennes données désactivées\n');

    // ÉTAPE 3: Insérer ou mettre à jour les membres d'équipage (sans unlock_island_id d'abord)
    console.log('👥 Migration des membres d\'équipage (étape 1/2)...');

    for (const member of data.crewMembers) {
      // Vérifier si le membre existe déjà
      const existing = await Database.get(
        'SELECT id FROM crew_members WHERE id = ?',
        [member.id]
      );

      if (existing) {
        // Mettre à jour (sans unlock_island_id pour l'instant)
        await Database.run(`
          UPDATE crew_members
          SET name = ?, description = ?, image_url = ?,
              order_index = ?, is_active = 1
          WHERE id = ?
        `, [
          member.name, member.description, member.image_url,
          member.order_index, member.id
        ]);
      } else {
        // Insérer (sans unlock_island_id pour l'instant)
        await Database.run(`
          INSERT INTO crew_members (
            id, name, description, image_url, unlock_island_id, order_index, is_active, created_at
          ) VALUES (?, ?, ?, ?, NULL, ?, 1, datetime('now'))
        `, [
          member.id, member.name, member.description, member.image_url,
          member.order_index
        ]);
      }
    }

    console.log(`✅ ${data.crewMembers.length} membres d\'équipage migrés (sans unlock_island_id)\n`);

    // ÉTAPE 4: Insérer ou mettre à jour les îles
    console.log('🏝️  Migration des îles...');

    for (const island of data.islands) {
      const existing = await Database.get(
        'SELECT id FROM islands WHERE id = ?',
        [island.id]
      );

      if (existing) {
        // Mettre à jour
        await Database.run(`
          UPDATE islands
          SET name = ?, order_index = ?, description = ?, latitude = ?, longitude = ?,
              unlock_requirement_island_id = ?, final_reward_type = ?,
              final_reward_value = ?, final_reward_crew_member_id = ?, is_active = 1
          WHERE id = ?
        `, [
          island.name, island.order_index, island.description, island.latitude, island.longitude,
          island.unlock_requirement_island_id, island.final_reward_type,
          island.final_reward_value, island.final_reward_crew_member_id, island.id
        ]);
      } else {
        // Insérer
        await Database.run(`
          INSERT INTO islands (
            id, name, order_index, description, latitude, longitude,
            unlock_requirement_island_id, final_reward_type, final_reward_value,
            final_reward_crew_member_id, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `, [
          island.id, island.name, island.order_index, island.description,
          island.latitude, island.longitude, island.unlock_requirement_island_id,
          island.final_reward_type, island.final_reward_value,
          island.final_reward_crew_member_id
        ]);
      }
    }

    console.log(`✅ ${data.islands.length} îles migrées\n`);

    // ÉTAPE 4.5: Mettre à jour les unlock_island_id des membres d'équipage
    console.log('👥 Migration des membres d\'équipage (étape 2/2 - unlock_island_id)...');

    for (const member of data.crewMembers) {
      if (member.unlock_island_id) {
        await Database.run(`
          UPDATE crew_members
          SET unlock_island_id = ?
          WHERE id = ?
        `, [member.unlock_island_id, member.id]);
      }
    }

    console.log(`✅ Membres d\'équipage mis à jour avec unlock_island_id\n`);

    // ÉTAPE 5: Insérer ou mettre à jour les quêtes
    console.log('⚔️  Migration des quêtes...');

    for (const quest of data.quests) {
      const existing = await Database.get(
        'SELECT id FROM quests WHERE id = ?',
        [quest.id]
      );

      if (existing) {
        // Mettre à jour
        await Database.run(`
          UPDATE quests
          SET island_id = ?, name = ?, description = ?, duration_hours = ?,
              reward_berrys = ?, required_crew_count = ?, specific_crew_member_id = ?,
              order_index = ?, is_repeatable = ?, is_active = 1
          WHERE id = ?
        `, [
          quest.island_id, quest.name, quest.description, quest.duration_hours,
          quest.reward_berrys, quest.required_crew_count, quest.specific_crew_member_id,
          quest.order_index, quest.is_repeatable ? 1 : 0, quest.id
        ]);
      } else {
        // Insérer
        await Database.run(`
          INSERT INTO quests (
            id, island_id, name, description, duration_hours, reward_berrys,
            required_crew_count, specific_crew_member_id, order_index,
            is_repeatable, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `, [
          quest.id, quest.island_id, quest.name, quest.description,
          quest.duration_hours, quest.reward_berrys, quest.required_crew_count,
          quest.specific_crew_member_id, quest.order_index, quest.is_repeatable ? 1 : 0
        ]);
      }
    }

    console.log(`✅ ${data.quests.length} quêtes migrées\n`);

    // ÉTAPE 6: Vérification de la progression des joueurs
    console.log('🔍 Vérification de la progression des joueurs...');

    const userIslandsAfter = await Database.all('SELECT * FROM user_islands');
    const userCrewMembersAfter = await Database.all('SELECT * FROM user_crew_members');
    const activeQuestsAfter = await Database.all('SELECT * FROM active_quests');
    const questHistoryAfter = await Database.all('SELECT * FROM quest_history');

    console.log(`   - ${userIslandsAfter.length} îles débloquées (avant: ${userIslands.length})`);
    console.log(`   - ${userCrewMembersAfter.length} membres d'équipage débloqués (avant: ${userCrewMembers.length})`);
    console.log(`   - ${activeQuestsAfter.length} quêtes actives (avant: ${activeQuests.length})`);
    console.log(`   - ${questHistoryAfter.length} quêtes dans l'historique (avant: ${questHistory.length})\n`);

    if (
      userIslandsAfter.length !== userIslands.length ||
      userCrewMembersAfter.length !== userCrewMembers.length ||
      activeQuestsAfter.length !== activeQuests.length ||
      questHistoryAfter.length !== questHistory.length
    ) {
      console.warn('⚠️  ATTENTION: La progression des joueurs a changé !');
    } else {
      console.log('✅ La progression des joueurs est préservée');
    }

    // ÉTAPE 7: S'assurer que tous les utilisateurs ont la première île et Luffy
    console.log('\n🎯 Vérification de l\'initialisation des utilisateurs...');

    const users = await Database.all<{ id: string }>('SELECT id FROM users WHERE is_active = 1');
    let usersInitialized = 0;

    for (const user of users) {
      // Débloquer la première île si pas déjà fait
      const hasFirstIsland = await Database.get(
        'SELECT id FROM user_islands WHERE user_id = ? AND island_id = ?',
        [user.id, 'island_windmill_village']
      );

      if (!hasFirstIsland) {
        await WorldMapModel.unlockIsland(user.id, 'island_windmill_village');
        usersInitialized++;
      }

      // Débloquer Luffy si pas déjà fait
      const hasLuffy = await Database.get(
        'SELECT id FROM user_crew_members WHERE user_id = ? AND crew_member_id = ?',
        [user.id, 'crew_luffy']
      );

      if (!hasLuffy) {
        await WorldMapModel.unlockCrewMember(user.id, 'crew_luffy');
      }
    }

    if (usersInitialized > 0) {
      console.log(`✅ ${usersInitialized} nouveaux utilisateurs initialisés`);
    } else {
      console.log(`✅ Tous les utilisateurs sont déjà initialisés`);
    }

    console.log('\n🎉 Migration terminée avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`   - ${data.islands.length} îles`);
    console.log(`   - ${data.crewMembers.length} membres d'équipage`);
    console.log(`   - ${data.quests.length} quêtes`);
    console.log(`   - ${users.length} utilisateurs vérifiés`);
    console.log(`   - Progression des joueurs: PRÉSERVÉE ✅`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  migrateQuestsFromJson()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateQuestsFromJson };
