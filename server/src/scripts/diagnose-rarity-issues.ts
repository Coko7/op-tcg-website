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

interface RarityComparison {
  vegapull_id: string;
  name: string;
  vegapull_rarity: string;
  db_rarity: string;
  matches: boolean;
}

// Mapping des raretés Vegapull vers nos raretés
const RARITY_MAPPING: Record<string, string> = {
  'Leader': 'leader',
  'SuperRare': 'super_rare',
  'Rare': 'rare',
  'Uncommon': 'uncommon',
  'Common': 'common',
  'SecretRare': 'secret_rare',
  'SpecialRare': 'secret_rare'
};

async function diagnoseRarityIssues(): Promise<void> {
  console.log('🔍 Diagnostic des raretés des cartes...\n');

  await Database.initialize();

  // Charger toutes les cartes Vegapull
  const vegapullDataPath = process.env.VEGAPULL_DATA_PATH ||
                           path.join(process.cwd(), 'public', 'data', 'vegapull');

  console.log(`📂 Lecture des données Vegapull depuis: ${vegapullDataPath}\n`);

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

  // Comparer les raretés
  const mismatches: RarityComparison[] = [];
  const matches: RarityComparison[] = [];
  const missing: string[] = [];

  for (const dbCard of dbCards) {
    const vegapullCard = vegapullCards.get(dbCard.vegapull_id);

    if (!vegapullCard) {
      missing.push(dbCard.vegapull_id);
      continue;
    }

    const expectedRarity = RARITY_MAPPING[vegapullCard.rarity] || 'common';
    const isMatch = dbCard.rarity === expectedRarity;

    const comparison: RarityComparison = {
      vegapull_id: dbCard.vegapull_id,
      name: dbCard.name,
      vegapull_rarity: vegapullCard.rarity,
      db_rarity: dbCard.rarity,
      matches: isMatch
    };

    if (isMatch) {
      matches.push(comparison);
    } else {
      mismatches.push(comparison);
    }
  }

  // Afficher les statistiques
  console.log('📊 RÉSULTATS DU DIAGNOSTIC\n');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`✅ Cartes avec rareté correcte: ${matches.length}`);
  console.log(`❌ Cartes avec rareté incorrecte: ${mismatches.length}`);
  console.log(`⚠️  Cartes en DB mais absentes de Vegapull: ${missing.length}\n`);

  if (mismatches.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('❌ CARTES AVEC RARETÉ INCORRECTE (premiers 20):\n');

    mismatches.slice(0, 20).forEach(card => {
      console.log(`  ${card.vegapull_id} - ${card.name}`);
      console.log(`    Vegapull: ${card.vegapull_rarity} -> ${RARITY_MAPPING[card.vegapull_rarity] || 'common'}`);
      console.log(`    DB:       ${card.db_rarity}`);
      console.log('');
    });

    if (mismatches.length > 20) {
      console.log(`  ... et ${mismatches.length - 20} autres cartes\n`);
    }

    // Grouper les erreurs par type de rareté source
    console.log('═══════════════════════════════════════════════════════');
    console.log('📈 RÉPARTITION DES ERREURS PAR RARETÉ SOURCE:\n');

    const errorsBySourceRarity = new Map<string, number>();
    mismatches.forEach(card => {
      const count = errorsBySourceRarity.get(card.vegapull_rarity) || 0;
      errorsBySourceRarity.set(card.vegapull_rarity, count + 1);
    });

    Array.from(errorsBySourceRarity.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([rarity, count]) => {
        const expected = RARITY_MAPPING[rarity] || 'common';
        console.log(`  ${rarity} (devrait être "${expected}"): ${count} cartes`);
      });

    console.log('');
  }

  if (missing.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️  CARTES EN DB MAIS ABSENTES DE VEGAPULL:\n');

    missing.slice(0, 10).forEach(id => {
      console.log(`  - ${id}`);
    });

    if (missing.length > 10) {
      console.log(`  ... et ${missing.length - 10} autres IDs\n`);
    }
  }

  // Analyse du mapping manquant
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 ANALYSE DU MAPPING:\n');

  const uniqueVegapullRarities = new Set<string>();
  vegapullCards.forEach(card => uniqueVegapullRarities.add(card.rarity));

  console.log('Raretés trouvées dans Vegapull:');
  Array.from(uniqueVegapullRarities).sort().forEach(rarity => {
    const mapped = RARITY_MAPPING[rarity];
    const status = mapped ? '✅' : '❌';
    console.log(`  ${status} "${rarity}" -> ${mapped || 'NON MAPPÉ (sera "common")'}`);
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════\n');

  // Retourner le nombre d'erreurs pour exit code
  return mismatches.length > 0 ? Promise.reject(new Error(`${mismatches.length} cartes avec rareté incorrecte`)) : Promise.resolve();
}

// Script principal
async function main() {
  try {
    await diagnoseRarityIssues();
    console.log('✅ Diagnostic terminé - Aucune erreur détectée!');
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ ${error.message}`);
    } else {
      console.error('\n❌ Erreur lors du diagnostic:', error);
    }
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { diagnoseRarityIssues };
