import { Database } from '../utils/database.js';

/**
 * Script pour corriger la rareté des cartes Leader
 *
 * Problème: Les cartes avec category="Leader" dans Vegapull ont été importées
 * avec rarity="common" au lieu de rarity="leader" car le mapping ne gérait
 * pas correctement le cas où rarity="Leader" dans les données source.
 *
 * Solution: Mettre à jour toutes les cartes de type "Leader" pour avoir
 * la rareté "leader" au lieu de leur rareté actuelle incorrecte.
 */

async function fixLeaderRarity(): Promise<void> {
  console.log('🔧 Correction de la rareté des cartes Leader...\n');

  await Database.initialize();

  try {
    // 1. Vérifier combien de cartes Leader ont une mauvaise rareté
    const wrongRarityLeaders = await Database.get<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM cards
      WHERE type = 'Leader' AND rarity != 'leader'
    `);

    console.log(`📊 Cartes Leader avec rareté incorrecte: ${wrongRarityLeaders?.count || 0}`);

    if (!wrongRarityLeaders?.count || wrongRarityLeaders.count === 0) {
      console.log('✅ Aucune correction nécessaire - toutes les cartes Leader ont déjà la bonne rareté!');
      return;
    }

    // 2. Afficher quelques exemples avant correction
    const examples = await Database.all<{ id: string; name: string; type: string; rarity: string }>(`
      SELECT id, name, type, rarity
      FROM cards
      WHERE type = 'Leader' AND rarity != 'leader'
      LIMIT 5
    `);

    console.log('\n📋 Exemples de cartes à corriger:');
    examples.forEach(card => {
      console.log(`  - ${card.name} (${card.id}): rarity="${card.rarity}" -> "leader"`);
    });

    // 3. Correction
    console.log('\n🔄 Application de la correction...');

    const result = await Database.run(`
      UPDATE cards
      SET rarity = 'leader',
          updated_at = datetime('now')
      WHERE type = 'Leader' AND rarity != 'leader'
    `);

    console.log(`✅ ${wrongRarityLeaders.count} cartes Leader corrigées avec succès!`);

    // 4. Vérification finale
    const remainingIssues = await Database.get<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM cards
      WHERE type = 'Leader' AND rarity != 'leader'
    `);

    if (remainingIssues?.count === 0) {
      console.log('✅ Vérification: Toutes les cartes Leader ont maintenant la rareté "leader"');
    } else {
      console.log(`⚠️  Attention: ${remainingIssues?.count} cartes Leader ont encore une rareté incorrecte`);
    }

    // 5. Afficher les statistiques finales
    const stats = await Database.all<{ type: string; rarity: string; count: number }>(`
      SELECT type, rarity, COUNT(*) as count
      FROM cards
      WHERE type = 'Leader'
      GROUP BY type, rarity
      ORDER BY count DESC
    `);

    console.log('\n📊 Statistiques des cartes Leader par rareté:');
    stats.forEach(stat => {
      console.log(`  - ${stat.type} (${stat.rarity}): ${stat.count} cartes`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  }
}

// Script principal
async function main() {
  try {
    await fixLeaderRarity();
    console.log('\n🎉 Script terminé avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fixLeaderRarity };
