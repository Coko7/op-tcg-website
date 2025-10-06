import { Card, Rarity } from '../types';
import { ImageService } from './imageService';

// Structure des données Vegapull
interface VegapullCard {
  id: string;
  name: string;
  rarity: string;
  category: string;
  img_url: string;
  colors: string[];
  cost?: number;
  attributes?: string[];
  power?: number;
  counter?: number;
  types: string[];
  effect: string;
  trigger?: string;
}

interface VegapullPack {
  id: string;
  name: string;
  prefix: string;
  category: string;
}

// URLs de base pour les données GitHub
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Coko7/vegapull-records/main/data/english';
// Essayons d'abord le repository lui-même pour les images
const GITHUB_IMAGES_BASE = 'https://raw.githubusercontent.com/Coko7/vegapull-records/main/images';
// Fallback vers le site officiel si le repository n'a pas d'images
const OFFICIAL_IMAGES_BASE = 'https://images.onepiece-cardgame.com/images/cardlist/card';

// Mapping des raretés Vegapull vers notre système
const RARITY_MAPPING: Record<string, Rarity> = {
  'C': 'common',
  'UC': 'uncommon',
  'R': 'rare',
  'SR': 'super_rare',
  'SEC': 'secret_rare',
  'L': 'super_rare', // Leaders comme super rare
  'SP': 'secret_rare', // Spéciales comme secret rare
  'P': 'rare' // Promo comme rare
};

export class VegapullService {
  private static packsCache: VegapullPack[] | null = null;
  private static cardsCache: Map<string, Card[]> = new Map();
  private static allCardsCache: Card[] | null = null;

  // Charger la liste des packs
  static async loadPacks(): Promise<VegapullPack[]> {
    if (this.packsCache) return this.packsCache;

    try {
      const response = await fetch(`${GITHUB_BASE_URL}/packs.json`);
      if (!response.ok) throw new Error('Failed to load packs');

      const packs = await response.json() as VegapullPack[];
      this.packsCache = packs;
      return packs;
    } catch (error) {
      console.error('Error loading packs:', error);
      return [];
    }
  }

  // Charger les cartes d'un pack spécifique
  static async loadCardsForPack(packId: string): Promise<Card[]> {
    if (this.cardsCache.has(packId)) {
      return this.cardsCache.get(packId)!;
    }

    try {
      // Essayer différents formats de noms de fichiers
      const possibleUrls = [
        `${GITHUB_BASE_URL}/cards_${packId}.json`,
        `${GITHUB_BASE_URL}/cards_${packId.replace('-', '')}.json`,
        `${GITHUB_BASE_URL}/cards_${packId.toLowerCase()}.json`
      ];

      let vegapullCards: VegapullCard[] = [];

      for (const url of possibleUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            vegapullCards = await response.json();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (vegapullCards.length === 0) {
        console.warn(`No cards found for pack ${packId}`);
        return [];
      }

      const cards = vegapullCards.map(vc => this.convertVegapullCard(vc, packId));
      this.cardsCache.set(packId, cards);
      return cards;
    } catch (error) {
      console.error(`Error loading cards for pack ${packId}:`, error);
      return [];
    }
  }

  // Convertir une carte Vegapull vers notre format
  private static convertVegapullCard(vc: VegapullCard, packId: string): Card {
    const rarity = RARITY_MAPPING[vc.rarity] || 'common';

    return {
      id: vc.id,
      name: vc.name,
      character: this.extractCharacterName(vc.name),
      rarity,
      attack: vc.power || 0,
      defense: vc.counter || 0,
      description: vc.effect || '',
      image_url: this.buildImageUrl(vc.id),
      special_ability: vc.trigger || undefined,
      // Propriétés One Piece TCG
      cost: vc.cost,
      power: vc.power,
      counter: vc.counter,
      color: vc.colors,
      type: vc.category,
      booster_id: packId
    };
  }

  // Extraire le nom du personnage depuis le nom de la carte
  private static extractCharacterName(cardName: string): string {
    // Enlever les suffixes comme "Gear 4", "Leader", etc.
    const name = cardName
      .replace(/\s*\(.*?\)/g, '') // Enlever les parenthèses
      .replace(/\s*(Gear\s*\d+|Leader|Character)$/i, '') // Enlever Gear X, Leader, Character
      .trim();

    return name || cardName;
  }

  // Construire l'URL de l'image
  private static buildImageUrl(cardId: string): string {
    // Utiliser le service d'images dédié
    return ImageService.getCardImageUrl(cardId);
  }

  // Charger TOUTES les cartes disponibles
  static async loadAllCards(): Promise<Card[]> {
    if (this.allCardsCache) return this.allCardsCache;

    try {
      const packs = await this.loadPacks();
      const allCards: Card[] = [];

      // Charger les cartes pour chaque pack en parallèle
      const cardPromises = packs.map(pack => this.loadCardsForPack(pack.id));
      const cardArrays = await Promise.all(cardPromises);

      // Combiner toutes les cartes
      cardArrays.forEach(cards => {
        allCards.push(...cards);
      });

      console.log(`Loaded ${allCards.length} cards from ${packs.length} packs`);
      this.allCardsCache = allCards;
      return allCards;
    } catch (error) {
      console.error('Error loading all cards:', error);
      return [];
    }
  }

  // Obtenir les cartes par booster
  static async getCardsByBooster(boosterId: string): Promise<Card[]> {
    return await this.loadCardsForPack(boosterId);
  }

  // Obtenir toutes les cartes avec cache
  static async getAllCards(): Promise<Card[]> {
    return await this.loadAllCards();
  }

  // Obtenir les packs disponibles avec cache
  static async getAvailablePacks(): Promise<VegapullPack[]> {
    return await this.loadPacks();
  }

  // Recherche dans toutes les cartes
  static async searchCards(query: string): Promise<Card[]> {
    const allCards = await this.getAllCards();
    const lowercaseQuery = query.toLowerCase();

    return allCards.filter(card =>
      card.name.toLowerCase().includes(lowercaseQuery) ||
      card.character.toLowerCase().includes(lowercaseQuery) ||
      card.description.toLowerCase().includes(lowercaseQuery) ||
      (card.type && card.type.toLowerCase().includes(lowercaseQuery)) ||
      (card.color && card.color.some(c => c.toLowerCase().includes(lowercaseQuery))) ||
      (card.booster_id && card.booster_id.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Obtenir les stats de collection avec toutes les cartes
  static async getCollectionStats() {
    const allCards = await this.getAllCards();
    const userCards = JSON.parse(localStorage.getItem('op_booster_user_cards') || '[]');

    const ownedCardIds = new Set(userCards.map((uc: any) => uc.card_id));
    const collectionCompletion = allCards.length > 0 ? (ownedCardIds.size / allCards.length) * 100 : 0;

    const rarityStats = {
      common: 0,
      uncommon: 0,
      rare: 0,
      super_rare: 0,
      secret_rare: 0
    };

    const boosterStats: Record<string, number> = {};

    userCards.forEach((userCard: any) => {
      const card = allCards.find(c => c.id === userCard.card_id);
      if (card) {
        rarityStats[card.rarity] += userCard.quantity;

        if (card.booster_id) {
          boosterStats[card.booster_id] = (boosterStats[card.booster_id] || 0) + userCard.quantity;
        }
      }
    });

    return {
      total_cards: userCards.reduce((sum: number, uc: any) => sum + uc.quantity, 0),
      unique_cards: userCards.length,
      collection_completion: Math.round(collectionCompletion * 100) / 100,
      rarity_breakdown: rarityStats,
      booster_breakdown: boosterStats,
      missing_cards: allCards.length - ownedCardIds.size,
      total_available_cards: allCards.length
    };
  }

  // Réinitialiser les caches (utile pour le développement)
  static clearCache(): void {
    this.packsCache = null;
    this.cardsCache.clear();
    this.allCardsCache = null;
  }
}