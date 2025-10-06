import { Card } from '../models/Card.js';
export declare class BoosterService {
    private static readonly RARITY_WEIGHTS;
    private static readonly CARDS_PER_BOOSTER;
    /**
     * Génère les cartes pour un booster spécifique
     */
    static generateBoosterCards(boosterId?: string): Promise<Card[]>;
    /**
     * Sélectionne une rareté selon les probabilités définies
     */
    private static selectRandomRarity;
    /**
     * Récupère une carte aléatoire d'une rareté donnée, optionnellement d'un booster spécifique
     */
    private static getRandomCardByRarity;
    /**
     * Obtient les statistiques de distribution des raretés
     */
    static getRarityDistribution(): Promise<Record<string, number>>;
    /**
     * Simule l'ouverture de plusieurs boosters (pour les tests)
     */
    static simulateBoosterOpenings(count: number): Promise<{
        rarity: string;
        count: number;
    }[]>;
}
