import { Card } from '../models/Card.js';
import { Database } from '../utils/database.js';

export class BoosterService {
  // Probabilités par rareté (en pourcentage)
  private static readonly RARITY_WEIGHTS = {
    'common': 58,
    'uncommon': 26,
    'rare': 10,
    'leader': 3,
    'super_rare': 2.5,
    'secret_rare': 0.5
  };

  private static readonly CARDS_PER_BOOSTER = 5;

  // Probabilité qu'une carte soit alternate (10% pour les raretés qui ont des alternates)
  private static readonly ALTERNATE_CHANCE = 0.10; // 10%

  /**
   * Génère les cartes pour un booster spécifique
   */
  static async generateBoosterCards(boosterId?: string): Promise<Card[]> {
    const cards: Card[] = [];

    for (let i = 0; i < this.CARDS_PER_BOOSTER; i++) {
      const rarity = this.selectRandomRarity();
      const card = await this.getRandomCardByRarity(rarity, boosterId);

      if (card) {
        cards.push(card);
      } else {
        // Si aucune carte n'est trouvée, lever une erreur explicite
        throw new Error(`Impossible de générer une carte de rareté ${rarity} pour le booster ${boosterId || 'aléatoire'}. Vérifiez que la base de données contient des cartes pour cette combinaison.`);
      }
    }

    return cards;
  }

  /**
   * Sélectionne une rareté selon les probabilités définies
   */
  private static selectRandomRarity(): keyof typeof BoosterService.RARITY_WEIGHTS {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const [rarity, weight] of Object.entries(this.RARITY_WEIGHTS)) {
      cumulative += weight;
      if (random <= cumulative) {
        return rarity as keyof typeof BoosterService.RARITY_WEIGHTS;
      }
    }

    return 'common'; // Fallback
  }

  /**
   * Détermine si on devrait obtenir une carte alternate pour une rareté donnée
   * Les Common et Uncommon n'ont pas d'alternates
   * Les autres raretés (Rare, Leader, SuperRare, SecretRare) ont 10% de chance
   */
  private static shouldGetAlternate(rarity: string): boolean {
    // Common et Uncommon n'ont pas d'alternates
    if (rarity === 'common' || rarity === 'uncommon') {
      return false;
    }

    // Pour les autres raretés, 10% de chance d'être alternate
    return Math.random() < this.ALTERNATE_CHANCE;
  }

  /**
   * Récupère une carte aléatoire d'une rareté donnée, optionnellement d'un booster spécifique
   * Gère la logique des cartes alternate (avec suffixe _p1, _p2, etc.)
   */
  private static async getRandomCardByRarity(rarity: string, boosterId?: string, forceNonAlternate: boolean = false): Promise<Card | null> {
    try {
      // Déterminer si cette carte devrait être alternate (sauf si forceNonAlternate est true)
      const shouldBeAlternate = !forceNonAlternate && this.shouldGetAlternate(rarity);

      let query = `
        SELECT * FROM cards
        WHERE rarity = ? AND is_active = 1
      `;
      const params: any[] = [rarity];

      if (boosterId) {
        query += ` AND booster_id = ?`;
        params.push(boosterId);
      }

      // Filtrer selon si on veut des alternates ou non
      // Les cartes normales n'ont pas de suffixe après le numéro (ex: OP01-016)
      // Les cartes alternates ont un suffixe _pX, _rX, etc. (ex: OP01-016_p1, OP01-041_r1)
      if (shouldBeAlternate) {
        // Chercher les cartes avec un underscore suivi de n'importe quelle lettre et chiffre
        query += ` AND vegapull_id LIKE '%\\_%'`;
      } else {
        // Chercher les cartes sans underscore dans le vegapull_id
        query += ` AND (vegapull_id NOT LIKE '%\\_%' OR vegapull_id IS NULL)`;
      }

      query += ` ORDER BY RANDOM() LIMIT 1`;

      // DEBUG: Log la requête complète
      console.log(`🔍 DEBUG - Requête SQL pour ${rarity}:`, query);
      console.log(`🔍 DEBUG - Paramètres:`, params);
      console.log(`🔍 DEBUG - shouldBeAlternate:`, shouldBeAlternate);
      console.log(`🔍 DEBUG - boosterId:`, boosterId);

      const cards = await Database.all(query, params);

      console.log(`🔍 DEBUG - Nombre de cartes trouvées:`, cards.length);

      if (cards.length === 0) {
        // Si aucune carte alternate trouvée, fallback sur une carte normale
        if (shouldBeAlternate) {
          console.warn(`Aucune carte alternate trouvée pour ${rarity}, fallback sur carte normale`);
          return this.getRandomCardByRarity(rarity, boosterId, true); // Retry avec forceNonAlternate
        }

        // Si on cherchait une carte normale mais qu'on n'en a pas trouvé,
        // vérifier si ce booster ne contient QUE des alternates pour cette rareté
        console.warn(`Aucune carte ${rarity} normale trouvée, vérification des alternates...`);

        // Compter le total de cartes de cette rareté dans ce booster
        const totalQuery = `SELECT COUNT(*) as count FROM cards WHERE rarity = ? AND is_active = 1 AND booster_id = ?`;
        const totalResult = await Database.get(totalQuery, [rarity, boosterId]);
        const totalCards = totalResult?.count || 0;

        // Compter les cartes alternates
        const alternatesQuery = `SELECT COUNT(*) as count FROM cards WHERE rarity = ? AND is_active = 1 AND booster_id = ? AND vegapull_id LIKE '%\\_%'`;
        const alternatesResult = await Database.get(alternatesQuery, [rarity, boosterId]);
        const alternateCards = alternatesResult?.count || 0;

        console.log(`🔍 Total ${rarity}: ${totalCards}, Alternates: ${alternateCards}`);

        // Si TOUTES les cartes de cette rareté sont des alternates, accepter n'importe laquelle
        if (totalCards > 0 && totalCards === alternateCards) {
          console.warn(`⚠️ Ce booster ne contient QUE des alternates pour ${rarity}, sélection d'une carte alternate`);

          const anyCardQuery = `
            SELECT * FROM cards
            WHERE rarity = ? AND is_active = 1 AND booster_id = ?
            ORDER BY RANDOM() LIMIT 1
          `;
          const anyCards = await Database.all(anyCardQuery, [rarity, boosterId]);

          if (anyCards.length > 0) {
            const cardData = anyCards[0];
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
        }

        // Diagnostic détaillé si vraiment aucune carte trouvée
        console.error(`ERREUR: Aucune carte ${rarity} trouvée dans le booster ${boosterId || 'non spécifié'}`);
        console.error(`🔍 DEBUG - Cartes ${rarity} dans booster ${boosterId} (total):`, totalCards);
        console.error(`🔍 DEBUG - Cartes ${rarity} alternates:`, alternateCards);

        // Montrer quelques exemples de vegapull_id
        const debugQuery3 = `SELECT vegapull_id FROM cards WHERE rarity = ? AND booster_id = ? LIMIT 5`;
        const debugResult3 = await Database.all(debugQuery3, [rarity, boosterId]);
        console.error(`🔍 DEBUG - Exemples de vegapull_id:`, debugResult3.map((r: any) => r.vegapull_id));

        console.error(`Ceci indique un problème de synchronisation des données. Vérifiez que:`);
        console.error(`1. Le booster ${boosterId} existe et contient des cartes ${rarity}`);
        console.error(`2. Les cartes ont is_active = 1`);
        console.error(`3. Le vegapull_id est correctement renseigné`);
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
    } catch (error) {
      console.error(`Erreur lors de la récupération d'une carte ${rarity}:`, error);
      return null;
    }
  }

  /**
   * Obtient les statistiques de distribution des raretés
   */
  static async getRarityDistribution(): Promise<Record<string, number>> {
    try {
      const distribution = await Database.all(`
        SELECT rarity, COUNT(*) as count
        FROM cards
        WHERE is_active = 1
        GROUP BY rarity
      `);

      const result: Record<string, number> = {};
      distribution.forEach(row => {
        result[row.rarity] = row.count;
      });

      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération de la distribution:', error);
      return {};
    }
  }

  /**
   * Simule l'ouverture de plusieurs boosters (pour les tests)
   */
  static async simulateBoosterOpenings(count: number): Promise<{ rarity: string; count: number }[]> {
    const rarityCount: Record<string, number> = {};

    for (let i = 0; i < count; i++) {
      const cards = await this.generateBoosterCards();
      cards.forEach(card => {
        rarityCount[card.rarity] = (rarityCount[card.rarity] || 0) + 1;
      });
    }

    return Object.entries(rarityCount).map(([rarity, count]) => ({ rarity, count }));
  }
}