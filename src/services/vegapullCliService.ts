// Service pour utiliser les données Vegapull téléchargées
import { Card, Rarity } from '../types';

// Types pour les données retournées par Vegapull
interface VegapullPackInfo {
  id: string;
  raw_title: string;
  title_parts: {
    prefix: string | null;
    title: string;
    label: string | null;
  };
}

interface VegapullCardData {
  id: string;
  pack_id: string;
  name: string;
  rarity: string;
  category: string;
  img_url: string;
  img_full_url: string;
  colors: string[];
  cost: number | null;
  attributes: string[];
  power: number | null;
  counter: number | null;
  types: string[];
  effect: string;
  trigger: string | null;
}

// Mapping des raretés Vegapull vers notre système
const RARITY_MAPPING: Record<string, Rarity> = {
  'Common': 'common',
  'Uncommon': 'uncommon',
  'Rare': 'rare',
  'SuperRare': 'super_rare',
  'SecretRare': 'secret_rare',
  'Leader': 'super_rare' // Leaders comme super rare
};

export class VegapullCliService {
  private static packsCache: VegapullPackInfo[] | null = null;
  private static cardsCache: Map<string, Card[]> = new Map();

  // Vérifier si Vegapull est disponible (vérifie si les données téléchargées existent)
  static async isVegapullAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/data/vegapull/packs.json');
      return response.ok;
    } catch {
      return false;
    }
  }

  // Récupérer la liste des packs depuis les données téléchargées
  static async getAvailablePacks(): Promise<VegapullPackInfo[]> {
    if (this.packsCache) {
      return this.packsCache;
    }

    try {
      console.log('Loading packs from downloaded Vegapull data...');

      // Essayer de charger depuis les données téléchargées
      const response = await fetch('/data/vegapull/packs.json');
      if (response.ok) {
        const packs = await response.json() as VegapullPackInfo[];
        this.packsCache = packs;
        console.log(`Loaded ${packs.length} packs from downloaded Vegapull data`);
        return packs;
      } else {
        console.warn('Downloaded Vegapull data not found');
        return [];
      }
    } catch (error) {
      console.warn('Error loading downloaded Vegapull data:', error);
      return [];
    }
  }

  // Récupérer les cartes d'un pack depuis les données téléchargées
  static async getPackCards(packId: string): Promise<Card[]> {
    if (this.cardsCache.has(packId)) {
      return this.cardsCache.get(packId)!;
    }

    try {
      console.log(`Loading cards for pack ${packId} from downloaded Vegapull data...`);

      // Essayer de charger depuis les données téléchargées
      const response = await fetch(`/data/vegapull/cards_${packId}.json`);
      if (response.ok) {
        const vegapullCards = await response.json() as VegapullCardData[];
        const cards = vegapullCards.map(vc => this.convertVegapullCard(vc, packId));

        this.cardsCache.set(packId, cards);
        console.log(`Loaded ${cards.length} cards for pack ${packId} from downloaded Vegapull data`);
        return cards;
      } else {
        console.warn(`Downloaded cards not found for ${packId}`);
        return [];
      }
    } catch (error) {
      console.warn(`Error loading downloaded cards for pack ${packId}:`, error);
      return [];
    }
  }

  // Convertir une carte Vegapull vers notre format
  private static convertVegapullCard(vc: VegapullCardData, packId: string): Card {
    const rarity = RARITY_MAPPING[vc.rarity] || 'common';

    return {
      id: vc.id,
      name: vc.name,
      character: this.extractCharacterName(vc.name),
      rarity,
      attack: vc.power || 0,
      defense: vc.counter || 0,
      description: vc.effect || '',
      image_url: vc.img_full_url, // URL officielle depuis Vegapull
      fallback_image_url: undefined,
      special_ability: vc.trigger || undefined,
      // Propriétés One Piece TCG
      cost: vc.cost || undefined,
      power: vc.power || undefined,
      counter: vc.counter || undefined,
      color: vc.colors,
      type: vc.category,
      booster_id: packId
    };
  }

  // Extraire le nom du personnage depuis le nom de la carte
  private static extractCharacterName(cardName: string): string {
    const name = cardName
      .replace(/\s*\(.*?\)/g, '') // Enlever les parenthèses
      .replace(/\s*(Gear\s*\d+|Leader|Character)$/i, '') // Enlever Gear X, Leader, Character
      .trim();

    return name || cardName;
  }

  // Récupérer toutes les cartes de tous les packs
  static async getAllCards(): Promise<Card[]> {
    const packs = await this.getAvailablePacks();
    const allCards: Card[] = [];

    // Charger les cartes pour chaque pack en parallèle
    const cardPromises = packs.map(pack => this.getPackCards(pack.id));
    const cardArrays = await Promise.all(cardPromises);

    // Combiner toutes les cartes
    cardArrays.forEach(cards => {
      allCards.push(...cards);
    });

    console.log(`Total cards loaded: ${allCards.length} from ${packs.length} packs`);
    return allCards;
  }

  // Vider les caches
  static clearCache(): void {
    this.packsCache = null;
    this.cardsCache.clear();
  }

  // Obtenir les statistiques du service
  static getStats(): { packsLoaded: number; cardCacheSize: number; isVegapullReady: boolean } {
    return {
      packsLoaded: this.packsCache?.length || 0,
      cardCacheSize: this.cardsCache.size,
      isVegapullReady: true // Always true since we use downloaded data
    };
  }
}