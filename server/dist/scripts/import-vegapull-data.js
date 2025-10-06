import fs from 'fs';
import path from 'path';
import { Database } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';
// Mapping des raretés Vegapull vers nos raretés
const RARITY_MAPPING = {
    'Leader': 'super_rare',
    'SuperRare': 'super_rare',
    'Rare': 'rare',
    'Uncommon': 'uncommon',
    'Common': 'common',
    'SecretRare': 'secret_rare',
    'SpecialRare': 'secret_rare'
};
// Mapping des catégories Vegapull vers nos types
const CATEGORY_MAPPING = {
    'Leader': 'Leader',
    'Character': 'Character',
    'Event': 'Event',
    'Stage': 'Stage'
};
class VegapullImporter {
    dataPath;
    constructor(customPath) {
        // Utiliser le chemin personnalisé, ou la variable d'environnement, ou le chemin par défaut
        this.dataPath = customPath ||
            process.env.VEGAPULL_DATA_PATH ||
            path.join(process.cwd(), 'public', 'data', 'vegapull');
    }
    async importData() {
        console.log('🏴‍☠️ Début de l\'importation des données Vegapull...');
        await Database.initialize();
        try {
            // Importer les boosters d'abord
            await this.importBookers();
            // Puis importer toutes les cartes
            await this.importCards();
            console.log('✅ Importation terminée avec succès!');
        }
        catch (error) {
            console.error('❌ Erreur lors de l\'importation:', error);
            throw error;
        }
    }
    async importBookers() {
        console.log('📦 Importation des boosters...');
        // Créer la table de mapping temporaire si elle n'existe pas
        await Database.run(`
      CREATE TABLE IF NOT EXISTS pack_booster_mapping (
        pack_id TEXT PRIMARY KEY,
        booster_id TEXT NOT NULL
      )
    `);
        const packsPath = path.join(this.dataPath, 'packs.json');
        if (!fs.existsSync(packsPath)) {
            throw new Error(`Fichier packs.json non trouvé: ${packsPath}`);
        }
        const packsData = JSON.parse(fs.readFileSync(packsPath, 'utf8'));
        for (const pack of packsData) {
            // Utiliser l'ID du pack Vegapull comme ID du booster pour stabilité
            const boosterId = pack.id;
            // Construire le nom du booster
            let boosterName = pack.title_parts.title;
            if (pack.title_parts.prefix) {
                boosterName = `${pack.title_parts.prefix} - ${boosterName}`;
            }
            if (pack.title_parts.label) {
                boosterName += ` [${pack.title_parts.label}]`;
            }
            // Insérer ou mettre à jour le booster
            await Database.run(`
        INSERT OR REPLACE INTO boosters (
          id, name, code, series, description,
          image_url, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
                boosterId,
                boosterName,
                pack.title_parts.label || pack.id,
                pack.title_parts.prefix || 'One Piece TCG',
                pack.raw_title,
                `/images/boosters/${pack.id}.png`,
                1
            ]);
            // Sauvegarder la correspondance pack_id -> booster_id pour les cartes
            await Database.run(`
        INSERT OR REPLACE INTO pack_booster_mapping (pack_id, booster_id)
        VALUES (?, ?)
      `, [pack.id, boosterId]);
        }
        console.log(`✅ ${packsData.length} boosters importés`);
    }
    async importCards() {
        console.log('🃏 Importation des cartes...');
        const files = fs.readdirSync(this.dataPath)
            .filter(file => file.startsWith('cards_') && file.endsWith('.json'));
        let totalCards = 0;
        for (const file of files) {
            console.log(`📄 Traitement de ${file}...`);
            const filePath = path.join(this.dataPath, file);
            const cardsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            for (const vegapullCard of cardsData) {
                await this.importCard(vegapullCard);
                totalCards++;
            }
            console.log(`  ✅ ${cardsData.length} cartes traitées`);
        }
        console.log(`✅ ${totalCards} cartes importées au total`);
    }
    async importCard(vegapullCard) {
        // Récupérer l'ID du booster correspondant
        const boosterMapping = await Database.get(`
      SELECT booster_id FROM pack_booster_mapping WHERE pack_id = ?
    `, [vegapullCard.pack_id]);
        const boosterId = boosterMapping?.booster_id || null;
        // Mapper la rareté
        const rarity = RARITY_MAPPING[vegapullCard.rarity] || 'common';
        // Mapper le type de carte
        const cardType = CATEGORY_MAPPING[vegapullCard.category] || 'Character';
        // Construire l'URL de l'image
        const imageUrl = vegapullCard.img_full_url || `/images/cards/${vegapullCard.id}.png`;
        const fallbackImageUrl = `/images/cards/placeholder.png`;
        // Générer un ID unique pour notre base
        const cardId = uuidv4();
        // Insérer ou mettre à jour la carte
        await Database.run(`
      INSERT OR REPLACE INTO cards (
        id, name, character, rarity, attack, defense,
        cost, power, counter, color, type, description,
        special_ability, image_url, fallback_image_url,
        booster_id, vegapull_id, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
            cardId,
            vegapullCard.name,
            vegapullCard.name, // character = name pour simplifier
            rarity,
            null, // attack - pas dans les données Vegapull
            null, // defense - pas dans les données Vegapull
            vegapullCard.cost,
            vegapullCard.power,
            vegapullCard.counter,
            JSON.stringify(vegapullCard.colors), // couleurs au format JSON
            cardType,
            vegapullCard.effect || '',
            vegapullCard.trigger || '',
            imageUrl,
            fallbackImageUrl,
            boosterId,
            vegapullCard.id, // Sauvegarder l'ID Vegapull original
            1
        ]);
    }
    async cleanup() {
        // Nettoyer la table de mapping temporaire
        await Database.run('DROP TABLE IF EXISTS pack_booster_mapping');
    }
}
// Script principal
async function main() {
    const importer = new VegapullImporter();
    try {
        await importer.importData();
        await importer.cleanup();
        console.log('🎉 Importation Vegapull terminée!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    }
}
// Exécuter si appelé directement (syntaxe ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
export { VegapullImporter };
//# sourceMappingURL=import-vegapull-data.js.map