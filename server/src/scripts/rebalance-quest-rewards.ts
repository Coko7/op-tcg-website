/**
 * Script pour rééquilibrer les récompenses des quêtes selon une formule mathématique
 * Formule: (duration_hours * required_crew_count * 5) + bonus multi-membre
 *
 * Base: 1h + 1 membre = 5 berrys
 * Bonus multi-membre: +20% si 2+ membres, +40% si 3+ membres, +60% si 4+ membres, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

/**
 * Calcule la récompense en berrys pour une quête
 * @param durationHours Durée de la quête en heures
 * @param requiredCrewCount Nombre de membres d'équipage requis
 * @returns Récompense en berrys
 */
function calculateQuestReward(durationHours: number, requiredCrewCount: number): number {
  // Base: 5 berrys par heure par membre (comme demandé: 1h + 1 membre = 5 berrys)
  const baseReward = durationHours * requiredCrewCount * 5;

  // Bonus multi-membre: +25% par membre supplémentaire après le premier
  // Cela encourage fortement les quêtes à plusieurs membres
  let multiCrewBonus = 0;
  if (requiredCrewCount > 1) {
    const bonusPercentage = (requiredCrewCount - 1) * 0.25; // 25% par membre supplémentaire
    multiCrewBonus = baseReward * bonusPercentage;
  }

  // Arrondir au multiple de 5 supérieur pour avoir des nombres propres
  const totalReward = Math.ceil((baseReward + multiCrewBonus) / 5) * 5;

  return totalReward;
}

/**
 * Rééquilibre toutes les récompenses de quêtes
 */
function rebalanceQuests() {
  const configPath = path.join(__dirname, '../../config/world-map-quests.json');

  // Lire le fichier de configuration
  const configData = fs.readFileSync(configPath, 'utf-8');
  const config: WorldMapConfig = JSON.parse(configData);

  console.log('🔄 Rééquilibrage des récompenses de quêtes...\n');

  // Mettre à jour les récompenses
  const updatedQuests = config.quests.map(quest => {
    const oldReward = quest.reward_berrys;
    const newReward = calculateQuestReward(quest.duration_hours, quest.required_crew_count);

    const change = newReward - oldReward;
    const changePercent = oldReward > 0 ? ((change / oldReward) * 100).toFixed(1) : 'N/A';

    console.log(`📋 ${quest.name}`);
    console.log(`   ⏰ Durée: ${quest.duration_hours}h | 👥 Membres: ${quest.required_crew_count}`);
    console.log(`   💰 ${oldReward} → ${newReward} berrys (${change >= 0 ? '+' : ''}${change}, ${changePercent}%)`);
    console.log('');

    return {
      ...quest,
      reward_berrys: newReward
    };
  });

  // Créer la nouvelle configuration
  const updatedConfig: WorldMapConfig = {
    ...config,
    quests: updatedQuests
  };

  // Sauvegarder
  fs.writeFileSync(
    configPath,
    JSON.stringify(updatedConfig, null, 2),
    'utf-8'
  );

  console.log('✅ Récompenses rééquilibrées avec succès !');

  // Statistiques
  const totalOld = config.quests.reduce((sum, q) => sum + q.reward_berrys, 0);
  const totalNew = updatedQuests.reduce((sum, q) => sum + q.reward_berrys, 0);
  const avgOld = Math.round(totalOld / config.quests.length);
  const avgNew = Math.round(totalNew / updatedQuests.length);

  console.log('\n📊 Statistiques:');
  console.log(`   Total des récompenses: ${totalOld} → ${totalNew} berrys`);
  console.log(`   Moyenne par quête: ${avgOld} → ${avgNew} berrys`);
  console.log(`   Nombre de quêtes: ${config.quests.length}`);
}

// Exécuter le rééquilibrage
try {
  rebalanceQuests();
} catch (error) {
  console.error('❌ Erreur lors du rééquilibrage:', error);
  process.exit(1);
}
