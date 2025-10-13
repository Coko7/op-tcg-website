import fs from 'fs';
import path from 'path';
import { Database } from '../utils/database.js';

interface VegapullCard {
  id: string;
  pack_id: string;
  name: string;
  rarity: string;
  category: string;
}

// Mapping des raretés Vegapull vers nos raretés (DOIT être identique à import-vegapull-data.ts)
const RARITY_MAPPING: Record<string, string> = {
  'Leader': 'leader',
  'SuperRare': 'super_rare',
  'Rare': 'rare',
  'Uncommon': 'uncommon',
  'Common': 'common',
  'SecretRare': 'secret_rare',
  'SpecialRare': 'secret_rare'
};

/**
 * Script pour corriger TOUTES les raretés incorrectes dans la base de données
 * en les comparant avec les données source Vegapull
 */
async function fixAllRarities(): Promise<void> {
  console.log('🔧 Correction de toutes les raretés des cartes...\n');

  await Database.initialize();

  try {
    // Charger toutes les cartes Vegapull
    const vegapullDataPath = process.env.VEGAPULL_DATA_PATH ||
                             path.join(process.cwd(), 'public', 'data', 'vegapull');

    console.log(`📂 Lecture des données Vegapull depuis: ${vegapullDataPath}`);

    if (!fs.existsSync(vegapullDataPath)) {
      throw new Error(`Dossier Vegapull non trouvé: ${vegapullDataPath}`);
    }

    const files = fs.readdirSync(vegapullDataPath)
      .filter(file => file.startsWith('cards_') && file.endsWith('.json'));

    const vegapullCards = new Map<string, VegapullCard>();

    // Charger toutes les cartes Vegapull
    for (const file of files) {
      const filePath = path.join(vegapullDataPath, file);
      const cardsData: VegapullCard[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      for (const card of cardsData) {
        vegapullCards.set(card.id, card);
      }
    }

    console.log(`✅ ${vegapullCards.size} cartes Vegapull chargées\n`);

    // Récupérer toutes les cartes de la DB qui ont un vegapull_id
    const dbCards = await Database.all<{
      id: string;
      name: string;
      rarity: string;
      vegapull_id: string
    }>(`
      SELECT id, name, rarity, vegapull_id
      FROM cards
      WHERE vegapull_id IS NOT NULL AND vegapull_id != ''
    `);

    console.log(`✅ ${dbCards.length} cartes avec vegapull_id dans la DB\n`);

    // Identifier les cartes à corriger
    const toFix: Array<{ dbId: string; vegapullId: string; name: string; currentRarity: string; correctRarity: string }> = [];

    for (const dbCard of dbCards) {
      const vegapullCard = vegapullCards.get(dbCard.vegapull_id);

      if (!vegapullCard) {
        continue; // Skip si pas trouvée dans Vegapull
      }

      const expectedRarity = RARITY_MAPPING[vegapullCard.rarity] || 'common';

      if (dbCard.rarity !== expectedRarity) {
        toFix.push({
          dbId: dbCard.id,
          vegapullId: dbCard.vegapull_id,
          name: dbCard.name,
          currentRarity: dbCard.rarity,
          correctRarity: expectedRarity
        });
      }
    }

    console.log(`📊 ${toFix.length} cartes avec rareté incorrecte détectées\n`);

    if (toFix.length === 0) {
      console.log('✅ Aucune correction nécessaire - toutes les raretés sont correctes!');
      return;
    }

    // Afficher quelques exemples
    console.log('📋 Exemples de cartes à corriger (premiers 10):');
    toFix.slice(0, 10).forEach(card => {
      console.log(`  ${card.vegapullId} - ${card.name}`);
      console.log(`    Actuel: "${card.currentRarity}" -> Correct: "${card.correctRarity}"`);
    });
    console.log('');

    // Grouper par type de correction
    const correctionStats = new Map<string, number>();
    toFix.forEach(card => {
      const key = `${card.currentRarity} -> ${card.correctRarity}`;
      correctionStats.set(key, (correctionStats.get(key) || 0) + 1);
    });

    console.log('📈 Répartition des corrections:');
    Array.from(correctionStats.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([correction, count]) => {
        console.log(`  ${correction}: ${count} cartes`);
      });
    console.log('');

    // Appliquer les corrections
    console.log('🔄 Application des corrections...');

    let corrected = 0;
    let errors = 0;

    await Database.transaction(async () => {
      for (const card of toFix) {
        try {
          await Database.run(`
            UPDATE cards
            SET rarity = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `, [card.correctRarity, card.dbId]);
          corrected++;

          if (corrected % 100 === 0) {
            console.log(`  Progression: ${corrected}/${toFix.length} cartes corrigées...`);
          }
        } catch (error) {
          console.error(`  ❌ Erreur pour ${card.vegapullId}:`, error);
          errors++;
        }
      }
    });

    console.log('');
    console.log(`✅ ${corrected} cartes corrigées avec succès`);
    if (errors > 0) {
      console.log(`❌ ${errors} erreurs lors de la correction`);
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale...');

    const remainingIssues = await Database.all<{
      id: string;
      vegapull_id: string;
      rarity: string
    }>(`
      SELECT id, vegapull_id, rarity
      FROM cards
      WHERE vegapull_id IS NOT NULL AND vegapull_id != ''
      LIMIT 1000
    `);

    let stillWrong = 0;
    for (const dbCard of remainingIssues) {
      const vegapullCard = vegapullCards.get(dbCard.vegapull_id);
      if (vegapullCard) {
        const expectedRarity = RARITY_MAPPING[vegapullCard.rarity] || 'common';
        if (dbCard.rarity !== expectedRarity) {
          stillWrong++;
        }
      }
    }

    if (stillWrong === 0) {
      console.log('✅ Vérification: Toutes les raretés sont maintenant correctes!');
    } else {
      console.log(`⚠️  Attention: ${stillWrong} cartes ont encore une rareté incorrecte`);
    }

    // Afficher les statistiques finales par rareté
    const finalStats = await Database.all<{ rarity: string; count: number }>(`
      SELECT rarity, COUNT(*) as count
      FROM cards
      WHERE is_active = 1
      GROUP BY rarity
      ORDER BY count DESC
    `);

    console.log('\n📊 Répartition finale des cartes par rareté:');
    finalStats.forEach(stat => {
      console.log(`  ${stat.rarity}: ${stat.count} cartes`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  }
}

// Script principal
async function main() {
  try {
    await fixAllRarities();
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

export { fixAllRarities };
