import fs from 'fs';
import path from 'path';

interface VegapullCard {
  id: string;
  name: string;
  rarity: string;
  category: string;
}

/**
 * Script pour analyser TOUTES les valeurs de rareté présentes dans les fichiers Vegapull
 * Permet d'identifier les orthographes/variantes que nous n'avons pas dans le mapping
 */
async function analyzeVegapullRarities(): Promise<void> {
  console.log('🔍 Analyse des raretés dans les fichiers Vegapull...\n');

  const vegapullDataPath = process.env.VEGAPULL_DATA_PATH ||
                           path.join(process.cwd(), 'public', 'data', 'vegapull');

  console.log(`📂 Lecture depuis: ${vegapullDataPath}\n`);

  if (!fs.existsSync(vegapullDataPath)) {
    console.error(`❌ Dossier non trouvé: ${vegapullDataPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(vegapullDataPath)
    .filter(file => file.startsWith('cards_') && file.endsWith('.json'))
    .sort();

  console.log(`📄 ${files.length} fichiers à analyser\n`);

  // Map pour stocker toutes les raretés uniques avec leur comptage et exemples
  const raritiesMap = new Map<string, { count: number; examples: string[]; files: Set<string> }>();

  // Map pour les catégories également (pour vérifier la cohérence)
  const categoriesMap = new Map<string, { count: number; examples: string[] }>();

  let totalCards = 0;

  // Analyser tous les fichiers
  for (const file of files) {
    const filePath = path.join(vegapullDataPath, file);
    const cardsData: VegapullCard[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const card of cardsData) {
      totalCards++;

      // Analyser la rareté
      if (!raritiesMap.has(card.rarity)) {
        raritiesMap.set(card.rarity, { count: 0, examples: [], files: new Set() });
      }
      const rarityData = raritiesMap.get(card.rarity)!;
      rarityData.count++;
      rarityData.files.add(file);
      if (rarityData.examples.length < 3) {
        rarityData.examples.push(`${card.id} - ${card.name}`);
      }

      // Analyser la catégorie
      if (!categoriesMap.has(card.category)) {
        categoriesMap.set(card.category, { count: 0, examples: [] });
      }
      const categoryData = categoriesMap.get(card.category)!;
      categoryData.count++;
      if (categoryData.examples.length < 3) {
        categoryData.examples.push(`${card.id} - ${card.name}`);
      }
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RÉSULTATS DE L\'ANALYSE\n');
  console.log(`Total de cartes analysées: ${totalCards}`);
  console.log(`Fichiers analysés: ${files.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Afficher toutes les raretés trouvées
  console.log('🎴 RARETÉS TROUVÉES DANS VEGAPULL:\n');

  // Trier par nombre décroissant
  const sortedRarities = Array.from(raritiesMap.entries())
    .sort((a, b) => b[1].count - a[1].count);

  sortedRarities.forEach(([rarity, data]) => {
    console.log(`  📌 "${rarity}"`);
    console.log(`     Nombre: ${data.count} cartes`);
    console.log(`     Fichiers: ${data.files.size} fichier(s)`);
    console.log(`     Exemples:`);
    data.examples.forEach(ex => console.log(`       - ${ex}`));
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Afficher toutes les catégories trouvées
  console.log('📂 CATÉGORIES TROUVÉES:\n');

  const sortedCategories = Array.from(categoriesMap.entries())
    .sort((a, b) => b[1].count - a[1].count);

  sortedCategories.forEach(([category, data]) => {
    console.log(`  📌 "${category}": ${data.count} cartes`);
    console.log(`     Exemples: ${data.examples.slice(0, 2).join(', ')}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');

  // Vérifier le mapping actuel
  const CURRENT_MAPPING: Record<string, string> = {
    'Leader': 'leader',
    'SuperRare': 'super_rare',
    'Rare': 'rare',
    'Uncommon': 'uncommon',
    'Common': 'common',
    'SecretRare': 'secret_rare',
    'SpecialRare': 'secret_rare'
  };

  console.log('🔍 VÉRIFICATION DU MAPPING ACTUEL:\n');

  const mappedRarities = new Set(Object.keys(CURRENT_MAPPING));
  const foundRarities = new Set(raritiesMap.keys());

  // Raretés dans Vegapull mais pas dans le mapping
  const missingInMapping: string[] = [];
  foundRarities.forEach(rarity => {
    if (!mappedRarities.has(rarity)) {
      missingInMapping.push(rarity);
    }
  });

  // Raretés dans le mapping mais pas dans Vegapull
  const unusedInMapping: string[] = [];
  mappedRarities.forEach(rarity => {
    if (!foundRarities.has(rarity)) {
      unusedInMapping.push(rarity);
    }
  });

  if (missingInMapping.length > 0) {
    console.log('❌ RARETÉS MANQUANTES DANS LE MAPPING (PROBLÈME CRITIQUE!):\n');
    missingInMapping.forEach(rarity => {
      const data = raritiesMap.get(rarity)!;
      console.log(`  ⚠️  "${rarity}" - ${data.count} cartes concernées`);
      console.log(`      Ces cartes seront importées comme "common" (fallback)!`);
      console.log(`      Exemples: ${data.examples[0]}`);
      console.log('');
    });
  } else {
    console.log('✅ Toutes les raretés Vegapull sont dans le mapping\n');
  }

  if (unusedInMapping.length > 0) {
    console.log('⚠️  RARETÉS DANS LE MAPPING MAIS PAS DANS VEGAPULL:\n');
    unusedInMapping.forEach(rarity => {
      console.log(`  - "${rarity}" (peut-être pour futurs boosters)`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Générer le mapping correct
  console.log('💡 MAPPING RECOMMANDÉ:\n');
  console.log('const RARITY_MAPPING: Record<string, string> = {');

  sortedRarities.forEach(([rarity, data]) => {
    const mappedValue = CURRENT_MAPPING[rarity] || `'${rarity.toLowerCase().replace(/\s+/g, '_')}'`;
    const comment = data.count > 100 ? '// Très fréquent' : data.count > 10 ? '' : '// Rare';
    console.log(`  '${rarity}': ${mappedValue}, ${comment}`);
  });

  console.log('};\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Exit code basé sur les problèmes trouvés
  if (missingInMapping.length > 0) {
    console.log(`❌ ${missingInMapping.length} rareté(s) manquante(s) dans le mapping!`);
    console.log('   Ces cartes seront mal importées!\n');
    process.exit(1);
  } else {
    console.log('✅ Analyse terminée - Aucun problème détecté\n');
    process.exit(0);
  }
}

// Script principal
async function main() {
  try {
    await analyzeVegapullRarities();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeVegapullRarities };
