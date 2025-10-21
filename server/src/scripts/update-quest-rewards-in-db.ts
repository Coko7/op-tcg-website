/**
 * Script pour mettre à jour les récompenses des quêtes dans la base de données
 * Utilise la configuration mise à jour depuis world-map-quests.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database } from '../utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Quest {
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

interface WorldMapConfig {
  islands: any[];
  crewMembers: any[];
  quests: Quest[];
}

async function updateQuestRewardsInDatabase() {
  console.log('🔄 Mise à jour des récompenses dans la base de données...\n');

  try {
    // Lire la configuration mise à jour
    const configPath = path.join(__dirname, '../../config/world-map-quests.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config: WorldMapConfig = JSON.parse(configData);

    let updatedCount = 0;

    // Mettre à jour chaque quête
    for (const quest of config.quests) {
      await Database.run(
        `UPDATE quests
         SET reward_berrys = ?
         WHERE id = ?`,
        [quest.reward_berrys, quest.id]
      );

      console.log(`✓ ${quest.name}: ${quest.reward_berrys} berrys`);
      updatedCount++;
    }

    console.log(`\n✅ ${updatedCount} quêtes mises à jour avec succès !`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    process.exit(1);
  }
}

// Exécuter la mise à jour
updateQuestRewardsInDatabase()
  .then(() => {
    console.log('\n🎉 Mise à jour terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
