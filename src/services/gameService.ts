import { Card, UserCard, BoosterResult, BoosterStatus } from '../types';
import { BoosterPack } from '../data/onePieceCards';
import { apiService } from './api';

export class GameService {
  static async getAllCards(): Promise<Card[]> {
    try {
      // Pas de limite - récupère toutes les cartes
      const response = await apiService.getCards();
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des cartes:', error);
      return [];
    }
  }

  static async getAllBoosters(): Promise<BoosterPack[]> {
    try {
      const response = await apiService.getBoosters({ limit: 100 });
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des boosters:', error);
      return [];
    }
  }

  static async getUserCards(): Promise<UserCard[]> {
    try {
      const response = await apiService.getUserCollection();
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération de la collection:', error);
      return [];
    }
  }

  static async getBoosterStatus(): Promise<BoosterStatus> {
    try {
      const response = await apiService.getBoosterStatus();
      return response.data || {
        available_boosters: 0,
        max_daily_boosters: 3,
        next_booster_time: undefined,
        time_until_next: 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du statut des boosters:', error);
      return {
        available_boosters: 0,
        max_daily_boosters: 3,
        next_booster_time: undefined,
        time_until_next: 0
      };
    }
  }

  static async canOpenBooster(): Promise<boolean> {
    const status = await this.getBoosterStatus();
    return status.available_boosters > 0;
  }

  static async getTimeUntilNextBooster(): Promise<number> {
    const status = await this.getBoosterStatus();
    if (!status.next_booster_time) return 0;

    const now = new Date();
    const nextTime = new Date(status.next_booster_time);
    const timeDiff = nextTime.getTime() - now.getTime();
    return Math.max(0, timeDiff);
  }

  static async openBooster(boosterId?: string): Promise<BoosterResult | null> {
    try {
      const response = await apiService.openBooster(boosterId);
      if (response.success) {
        return {
          cards: response.data.cards || [],
          new_cards: response.data.new_cards || [],
          available_boosters: response.data.available_boosters,
          next_booster_time: response.data.next_booster_time,
          session_info: response.data.session_info
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du booster:', error);
      return null;
    }
  }

  static async toggleFavorite(cardId: string): Promise<void> {
    try {
      await apiService.toggleFavorite(cardId);
    } catch (error) {
      console.error('Erreur lors du basculement favori:', error);
      throw error;
    }
  }

  static async getCollectionStats(): Promise<any> {
    try {
      const response = await apiService.getStats();
      return response.data || {
        total_cards: 0,
        unique_cards: 0,
        collection_completion: 0,
        rarity_breakdown: {},
        booster_breakdown: {},
        missing_cards: 0,
        total_available_cards: 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        total_cards: 0,
        unique_cards: 0,
        collection_completion: 0,
        rarity_breakdown: {},
        booster_breakdown: {},
        missing_cards: 0,
        total_available_cards: 0
      };
    }
  }

  static async searchCards(query: string): Promise<Card[]> {
    try {
      const response = await apiService.getCards({ search: query });
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche de cartes:', error);
      return [];
    }
  }

  static async getCardsByBooster(boosterId: string): Promise<Card[]> {
    try {
      const response = await apiService.getCards({ booster_id: boosterId });
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des cartes du booster:', error);
      return [];
    }
  }

  static async getCardsByRarity(rarity: string, boosterId?: string): Promise<Card[]> {
    try {
      const params: any = { rarity };
      if (boosterId) params.booster_id = boosterId;

      const response = await apiService.getCards(params);
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des cartes par rareté:', error);
      return [];
    }
  }

  static async getCardById(id: string): Promise<Card | undefined> {
    try {
      const response = await apiService.getCard(id);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la carte:', error);
      return undefined;
    }
  }

  static async getBoosterById(id: string): Promise<BoosterPack | undefined> {
    try {
      const response = await apiService.getBooster(id);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du booster:', error);
      return undefined;
    }
  }

  static async buyBoosterWithBerrys(boosterId?: string): Promise<BoosterResult | null> {
    try {
      const response = await apiService.buyBoosterWithBerrys(boosterId);
      if (response.success) {
        return {
          cards: response.data.cards || [],
          new_cards: response.data.new_cards || [],
          available_boosters: response.data.available_boosters,
          next_booster_time: response.data.next_booster_time,
          session_info: response.data.session_info
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de l\'achat du booster avec des Berrys:', error);
      throw error;
    }
  }

  static async sellCard(cardId: string, quantity: number = 1): Promise<{ berrys_earned: number; new_balance: number }> {
    try {
      const response = await apiService.sellCard(cardId, quantity);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vente de la carte:', error);
      throw error;
    }
  }

  static async getBerrysBalance(): Promise<number> {
    try {
      const response = await apiService.getBerrysBalance();
      return response.data?.berrys || 0;
    } catch (error) {
      console.error('Erreur lors de la récupération du solde de Berrys:', error);
      return 0;
    }
  }

}