import { Database } from '../utils/database.js';
export class BoosterService {
    // Probabilités par rareté (en pourcentage)
    static RARITY_WEIGHTS = {
        'common': 65,
        'uncommon': 25,
        'rare': 8,
        'super_rare': 1.8,
        'secret_rare': 0.2
    };
    static CARDS_PER_BOOSTER = 5;
    /**
     * Génère les cartes pour un booster spécifique
     */
    static async generateBoosterCards(boosterId) {
        const cards = [];
        for (let i = 0; i < this.CARDS_PER_BOOSTER; i++) {
            const rarity = this.selectRandomRarity();
            const card = await this.getRandomCardByRarity(rarity, boosterId);
            if (card) {
                cards.push(card);
            }
        }
        // S'assurer qu'on a bien le bon nombre de cartes
        while (cards.length < this.CARDS_PER_BOOSTER) {
            const fallbackCard = await this.getRandomCardByRarity('common', boosterId);
            if (fallbackCard) {
                cards.push(fallbackCard);
            }
        }
        return cards;
    }
    /**
     * Sélectionne une rareté selon les probabilités définies
     */
    static selectRandomRarity() {
        const random = Math.random() * 100;
        let cumulative = 0;
        for (const [rarity, weight] of Object.entries(this.RARITY_WEIGHTS)) {
            cumulative += weight;
            if (random <= cumulative) {
                return rarity;
            }
        }
        return 'common'; // Fallback
    }
    /**
     * Récupère une carte aléatoire d'une rareté donnée, optionnellement d'un booster spécifique
     */
    static async getRandomCardByRarity(rarity, boosterId) {
        try {
            let query = `
        SELECT * FROM cards
        WHERE rarity = ? AND is_active = 1
      `;
            const params = [rarity];
            if (boosterId) {
                query += ` AND booster_id = ?`;
                params.push(boosterId);
            }
            query += ` ORDER BY RANDOM() LIMIT 1`;
            const cards = await Database.all(query, params);
            if (cards.length === 0) {
                console.warn(`Aucune carte trouvée pour la rareté: ${rarity}${boosterId ? ` dans le booster ${boosterId}` : ''}`);
                return null;
            }
            const cardData = cards[0];
            // Convertir les données en format Card
            return {
                id: cardData.id,
                name: cardData.name,
                character: cardData.character,
                rarity: cardData.rarity,
                type: cardData.type || undefined,
                color: cardData.color ? JSON.parse(cardData.color) : undefined,
                cost: cardData.cost || undefined,
                power: cardData.power || undefined,
                counter: cardData.counter || undefined,
                attack: cardData.attack || undefined,
                defense: cardData.defense || undefined,
                description: cardData.description || undefined,
                special_ability: cardData.special_ability || undefined,
                image_url: cardData.image_url || undefined,
                fallback_image_url: cardData.fallback_image_url || undefined,
                vegapull_id: cardData.vegapull_id || undefined,
                is_active: cardData.is_active === 1
            };
        }
        catch (error) {
            console.error(`Erreur lors de la récupération d'une carte ${rarity}:`, error);
            return null;
        }
    }
    /**
     * Obtient les statistiques de distribution des raretés
     */
    static async getRarityDistribution() {
        try {
            const distribution = await Database.all(`
        SELECT rarity, COUNT(*) as count
        FROM cards
        WHERE is_active = 1
        GROUP BY rarity
      `);
            const result = {};
            distribution.forEach(row => {
                result[row.rarity] = row.count;
            });
            return result;
        }
        catch (error) {
            console.error('Erreur lors de la récupération de la distribution:', error);
            return {};
        }
    }
    /**
     * Simule l'ouverture de plusieurs boosters (pour les tests)
     */
    static async simulateBoosterOpenings(count) {
        const rarityCount = {};
        for (let i = 0; i < count; i++) {
            const cards = await this.generateBoosterCards();
            cards.forEach(card => {
                rarityCount[card.rarity] = (rarityCount[card.rarity] || 0) + 1;
            });
        }
        return Object.entries(rarityCount).map(([rarity, count]) => ({ rarity, count }));
    }
}
//# sourceMappingURL=BoosterService.js.map