import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Database } from '../utils/database.js';
import { CardModel, CardCreate } from '../models/Card.js';
import { BoosterModel, BoosterCreate } from '../models/Booster.js';

interface VegapullCard {
  id: string;
  name: string;
  character: string;
  rarity: string;
  attack?: number;
  defense?: number;
  cost?: number;
  power?: number;
  counter?: number;
  color?: string[];
  type?: string;
  description?: string;
  special_ability?: string;
  image_url?: string;
  booster_id?: string;
}

interface VegapullBooster {
  id: string;
  title_parts: {
    title: string;
    label?: string;
    prefix?: string;
  };
}

interface UpdateResult {
  success: boolean;
  cardsAdded: number;
  cardsUpdated: number;
  boostersAdded: number;
  boostersUpdated: number;
  errors: string[];
}

export class CardUpdateService {
  private vegapullDataPath: string;
  private vegapullImagesPath: string;

  constructor() {
    this.vegapullDataPath = process.env.VEGAPULL_DATA_PATH || '../public/data/vegapull';
    this.vegapullImagesPath = process.env.VEGAPULL_IMAGES_PATH || '../public/images/cards';
  }

  /**
   * Met à jour toutes les cartes et boosters depuis les données Vegapull
   */
  async updateFromVegapull(forceUpdate: boolean = false): Promise<UpdateResult> {
    console.log('🔄 Début de la mise à jour depuis Vegapull...');

    const result: UpdateResult = {
      success: false,
      cardsAdded: 0,
      cardsUpdated: 0,
      boostersAdded: 0,
      boostersUpdated: 0,
      errors: []
    };

    try {
      // Vérifier si une mise à jour est nécessaire
      if (!forceUpdate) {
        const needsUpdate = await this.checkIfUpdateNeeded();
        if (!needsUpdate) {
          console.log('ℹ️ Aucune mise à jour nécessaire');
          result.success = true;
          return result;
        }
      }

      // Backup avant mise à jour
      const backupPath = await Database.backup(`cards_update_backup_${Date.now()}.sqlite`);
      console.log(`🛡️ Backup créé: ${backupPath}`);

      await Database.transaction(async () => {
        // 1. Mettre à jour les boosters
        console.log('📦 Mise à jour des boosters...');
        const boosterResult = await this.updateBoosters();
        result.boostersAdded = boosterResult.added;
        result.boostersUpdated = boosterResult.updated;

        // 2. Mettre à jour les cartes
        console.log('🃏 Mise à jour des cartes...');
        const cardResult = await this.updateCards();
        result.cardsAdded = cardResult.added;
        result.cardsUpdated = cardResult.updated;

        // 3. Enregistrer la mise à jour
        await this.recordUpdate(result);
      });

      result.success = true;
      console.log('✅ Mise à jour terminée avec succès');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      result.errors.push(errorMsg);
      console.error('❌ Erreur lors de la mise à jour:', error);
    }

    return result;
  }

  /**
   * Vérifie si une mise à jour est nécessaire en comparant les hash
   */
  private async checkIfUpdateNeeded(): Promise<boolean> {
    try {
      const currentHash = await this.calculateVegapullDataHash();
      const lastUpdate = await Database.get<{ vegapull_data_hash: string }>(`
        SELECT vegapull_data_hash
        FROM card_updates
        ORDER BY applied_at DESC
        LIMIT 1
      `);

      if (!lastUpdate || lastUpdate.vegapull_data_hash !== currentHash) {
        console.log('🔍 Changements détectés dans les données Vegapull');
        return true;
      }

      return false;
    } catch (error) {
      console.log('⚠️ Impossible de vérifier les changements, forçage de la mise à jour');
      return true;
    }
  }

  /**
   * Met à jour les boosters depuis les données Vegapull
   */
  private async updateBoosters(): Promise<{ added: number; updated: number }> {
    const packsPath = path.join(this.vegapullDataPath, 'packs.json');

    if (!fs.existsSync(packsPath)) {
      throw new Error('Fichier packs.json non trouvé');
    }

    const packsData = JSON.parse(fs.readFileSync(packsPath, 'utf8')) as VegapullBooster[];

    let added = 0;
    let updated = 0;

    for (const pack of packsData) {
      const boosterData: BoosterCreate = {
        id: pack.id,
        name: pack.title_parts.title,
        code: pack.title_parts.label || pack.id.toUpperCase(),
        series: pack.title_parts.prefix || 'BOOSTER PACK',
        description: `Booster pack ${pack.title_parts.title} de la série ${pack.title_parts.prefix || 'One Piece TCG'}`,
        release_date: '2022-07-08', // Date par défaut, peut être mise à jour plus tard
        card_count: 121, // Valeur par défaut
        image_url: `/boosters/${pack.id.toLowerCase()}.jpg`
      };

      const result = await BoosterModel.upsert(boosterData);
      if (result.wasCreated) {
        added++;
      } else if (result.wasUpdated) {
        updated++;
      }
    }

    console.log(`📦 Boosters: ${added} ajoutés, ${updated} mis à jour`);
    return { added, updated };
  }

  /**
   * Met à jour les cartes depuis les données Vegapull
   */
  private async updateCards(): Promise<{ added: number; updated: number }> {
    const allCards: VegapullCard[] = [];

    // Lire toutes les cartes depuis les fichiers de packs
    const packsDir = this.vegapullDataPath;
    const packFiles = fs.readdirSync(packsDir)
      .filter(file => file.startsWith('pack_') && file.endsWith('.json'));

    for (const packFile of packFiles) {
      try {
        const packPath = path.join(packsDir, packFile);
        const packData = JSON.parse(fs.readFileSync(packPath, 'utf8'));

        if (packData.cards && Array.isArray(packData.cards)) {
          allCards.push(...packData.cards.map((card: any) => ({
            ...card,
            character: card.character || card.character_name || card.name,
            booster_id: packData.id || packFile.replace('pack_', '').replace('.json', '')
          })));
        }
      } catch (error) {
        console.warn(`⚠️ Erreur lors de la lecture du pack ${packFile}:`, error);
      }
    }

    console.log(`📊 ${allCards.length} cartes trouvées dans les données Vegapull`);

    // Convertir et traiter les cartes par batch
    const BATCH_SIZE = 100;
    let totalAdded = 0;
    let totalUpdated = 0;

    for (let i = 0; i < allCards.length; i += BATCH_SIZE) {
      const batch = allCards.slice(i, i + BATCH_SIZE);
      const cardData = batch.map(card => this.convertVegapullCard(card));

      const result = await CardModel.batchUpsert(cardData);
      totalAdded += result.created;
      totalUpdated += result.updated;

      // Progress log
      const progress = Math.min(i + BATCH_SIZE, allCards.length);
      console.log(`📈 Progression: ${progress}/${allCards.length} cartes traitées`);
    }

    // Détecter les cartes supprimées (présentes en DB mais plus dans Vegapull)
    await this.handleRemovedCards(allCards);

    console.log(`🃏 Cartes: ${totalAdded} ajoutées, ${totalUpdated} mises à jour`);
    return { added: totalAdded, updated: totalUpdated };
  }

  /**
   * Convertit une carte Vegapull vers notre format
   */
  private convertVegapullCard(vegapullCard: VegapullCard): CardCreate {
    // Mapper les raretés si nécessaire
    const rarityMapping: Record<string, string> = {
      'C': 'common',
      'UC': 'uncommon',
      'R': 'rare',
      'SR': 'super_rare',
      'SEC': 'secret_rare',
      'L': 'rare' // Leaders traités comme rare
    };

    return {
      id: vegapullCard.id,
      name: vegapullCard.name,
      character_name: vegapullCard.character,
      rarity: rarityMapping[vegapullCard.rarity] || vegapullCard.rarity.toLowerCase(),
      attack: vegapullCard.attack,
      defense: vegapullCard.defense,
      cost: vegapullCard.cost,
      power: vegapullCard.power,
      counter: vegapullCard.counter,
      color: vegapullCard.color,
      type: vegapullCard.type,
      description: vegapullCard.description || '',
      special_ability: vegapullCard.special_ability,
      image_url: vegapullCard.image_url || this.generateImageUrl(vegapullCard.id),
      booster_id: vegapullCard.booster_id
    };
  }

  /**
   * Génère une URL d'image pour une carte
   */
  private generateImageUrl(cardId: string): string {
    return `/images/cards/${cardId.toLowerCase()}.jpg`;
  }

  /**
   * Gère les cartes supprimées (plus présentes dans Vegapull)
   */
  private async handleRemovedCards(vegapullCards: VegapullCard[]): Promise<void> {
    const vegapullIds = new Set(vegapullCards.map(card => card.id));
    const dbCards = await CardModel.findAll(999999); // Récupérer toutes les cartes

    const removedCards = dbCards.filter(card => !vegapullIds.has(card.id));

    if (removedCards.length > 0) {
      console.log(`⚠️ ${removedCards.length} cartes supprimées détectées`);

      // Backup des cartes supprimées avant désactivation
      for (const card of removedCards) {
        await Database.run(`
          INSERT INTO missing_cards_backup (id, card_id, card_data, removal_reason)
          VALUES (?, ?, ?, ?)
        `, [
          crypto.randomUUID(),
          card.id,
          JSON.stringify(card),
          'Removed from Vegapull data'
        ]);

        await CardModel.deactivate(card.id);
      }

      console.log(`🗄️ ${removedCards.length} cartes désactivées et sauvegardées`);
    }
  }

  /**
   * Calcule le hash des données Vegapull pour détecter les changements
   */
  private async calculateVegapullDataHash(): Promise<string> {
    const hash = crypto.createHash('md5');

    // Hash du fichier packs.json
    const packsPath = path.join(this.vegapullDataPath, 'packs.json');
    if (fs.existsSync(packsPath)) {
      const packsData = fs.readFileSync(packsPath);
      hash.update(packsData);
    }

    // Hash des fichiers de packs individuels
    const packFiles = fs.readdirSync(this.vegapullDataPath)
      .filter(file => file.startsWith('pack_') && file.endsWith('.json'))
      .sort(); // Trier pour un hash cohérent

    for (const packFile of packFiles) {
      const packPath = path.join(this.vegapullDataPath, packFile);
      const packData = fs.readFileSync(packPath);
      hash.update(packData);
    }

    return hash.digest('hex');
  }

  /**
   * Enregistre la mise à jour dans la base de données
   */
  private async recordUpdate(result: UpdateResult): Promise<void> {
    const updateHash = await this.calculateVegapullDataHash();

    await Database.run(`
      INSERT INTO card_updates (
        id, update_version, update_type, cards_added, cards_updated,
        boosters_added, boosters_updated, vegapull_data_hash, applied_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      crypto.randomUUID(),
      new Date().toISOString(),
      'both',
      result.cardsAdded,
      result.cardsUpdated,
      result.boostersAdded,
      result.boostersUpdated,
      updateHash,
      'system'
    ]);
  }

  /**
   * Récupère l'historique des mises à jour
   */
  async getUpdateHistory(limit: number = 10): Promise<any[]> {
    return await Database.all(`
      SELECT *
      FROM card_updates
      ORDER BY applied_at DESC
      LIMIT ?
    `, [limit]);
  }

  /**
   * Restaure des cartes depuis le backup
   */
  async restoreRemovedCards(cardIds: string[]): Promise<number> {
    let restored = 0;

    await Database.transaction(async () => {
      for (const cardId of cardIds) {
        const backup = await Database.get(`
          SELECT card_data
          FROM missing_cards_backup
          WHERE card_id = ?
          ORDER BY removed_at DESC
          LIMIT 1
        `, [cardId]);

        if (backup) {
          const cardData = JSON.parse(backup.card_data);
          await CardModel.upsert(cardData);
          restored++;
        }
      }
    });

    console.log(`🔄 ${restored} cartes restaurées depuis le backup`);
    return restored;
  }
}