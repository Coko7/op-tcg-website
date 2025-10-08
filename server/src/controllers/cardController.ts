import { Request, Response } from 'express';
import { CardModel } from '../models/Card.js';
import { BoosterModel } from '../models/Booster.js';
import { Database } from '../utils/database.js';

// Fonction pour transformer les données en camelCase
function transformBoosterToCamelCase(booster: any) {
  return {
    id: booster.id,
    name: booster.name,
    code: booster.code,
    series: booster.series,
    description: booster.description,
    releaseDate: booster.release_date,
    cardCount: booster.card_count,
    imageUrl: booster.image_url,
    isActive: booster.is_active,
    createdAt: booster.created_at,
    updatedAt: booster.updated_at
  };
}

function transformCardToCamelCase(card: any) {
  return {
    id: card.id,
    name: card.name,
    character: card.character,
    rarity: card.rarity,
    type: card.type,
    color: card.color ? (typeof card.color === 'string' ? JSON.parse(card.color) : card.color) : undefined,
    cost: card.cost,
    power: card.power,
    counter: card.counter,
    attack: card.attack,
    defense: card.defense,
    description: card.description,
    special_ability: card.special_ability,
    image_url: card.image_url,
    fallback_image_url: card.fallback_image_url,
    booster_id: card.booster_id,
    vegapull_id: card.vegapull_id,
    is_active: card.is_active === 1
  };
}

export class CardController {
  static async getCards(req: Request, res: Response): Promise<void> {
    try {
      // Validation stricte des inputs
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = parseInt(req.query.limit as string) || 10000; // Par défaut, toutes les cartes
      const offset = (page - 1) * limit;

      const boosterId = req.query.booster_id as string;
      const rarity = req.query.rarity as string;
      const search = req.query.search as string;

      // Validation de la rareté
      const validRarities = ['common', 'uncommon', 'rare', 'super_rare', 'secret_rare'];
      if (rarity && !validRarities.includes(rarity)) {
        res.status(400).json({
          error: 'Rareté invalide',
          validRarities
        });
        return;
      }

      // Validation de la recherche (longueur et caractères)
      if (search && (search.length < 1 || search.length > 100)) {
        res.status(400).json({
          error: 'Recherche invalide: longueur entre 1 et 100 caractères'
        });
        return;
      }

      let cards;

      if (search) {
        cards = await CardModel.searchCards(search, limit);
      } else if (boosterId && rarity) {
        cards = await CardModel.findByRarity(rarity, boosterId);
      } else if (boosterId) {
        cards = await CardModel.findByBooster(boosterId);
      } else if (rarity) {
        cards = await CardModel.findByRarity(rarity);
      } else {
        cards = await CardModel.findAll(limit, offset);
      }

      const total = await CardModel.count();

      res.json({
        success: true,
        data: cards.map(transformCardToCamelCase),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des cartes:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  static async getCard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const card = await CardModel.findById(id);
      if (!card) {
        res.status(404).json({
          success: false,
          error: 'Carte non trouvée'
        });
        return;
      }

      res.json({
        success: true,
        data: transformCardToCamelCase(card)
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de la carte:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  static async getBoosters(req: Request, res: Response): Promise<void> {
    try {
      // Validation stricte des inputs
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 20, 50));
      const offset = (page - 1) * limit;

      const series = req.query.series as string;
      const search = req.query.search as string;

      // Validation de la recherche
      if (search && (search.length < 1 || search.length > 100)) {
        res.status(400).json({
          error: 'Recherche invalide: longueur entre 1 et 100 caractères'
        });
        return;
      }

      let boosters;

      if (search) {
        boosters = await BoosterModel.searchBoosters(search, limit);
      } else if (series) {
        boosters = await BoosterModel.findBySeries(series);
      } else {
        boosters = await BoosterModel.findAll(limit, offset);
      }

      const total = await BoosterModel.count();

      res.json({
        success: true,
        data: boosters.map(transformBoosterToCamelCase),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des boosters:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  static async getBooster(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const booster = await BoosterModel.findById(id);
      if (!booster) {
        res.status(404).json({
          success: false,
          error: 'Booster non trouvé'
        });
        return;
      }

      const cards = await CardModel.findByBooster(id);

      res.json({
        success: true,
        data: {
          ...transformBoosterToCamelCase(booster),
          cards: cards.map(transformCardToCamelCase)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du booster:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  static async getCardsByRarity(req: Request, res: Response): Promise<void> {
    try {
      const { boosterId, rarity } = req.params;

      // Validation de la rareté
      const validRarities = ['common', 'uncommon', 'rare', 'super_rare', 'secret_rare'];
      if (!validRarities.includes(rarity)) {
        res.status(400).json({
          error: 'Rareté invalide',
          validRarities
        });
        return;
      }

      const booster = await BoosterModel.findById(boosterId);
      if (!booster) {
        res.status(404).json({
          success: false,
          error: 'Booster non trouvé'
        });
        return;
      }

      const cards = await CardModel.findByRarity(rarity, boosterId);

      res.json({
        success: true,
        data: {
          booster: transformBoosterToCamelCase(booster),
          rarity,
          cards: cards.map(transformCardToCamelCase)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des cartes par rareté:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }

  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const totalCards = await CardModel.count();
      const totalBoosters = await BoosterModel.count();

      const rarityStats = await Database.all(`
        SELECT
          rarity,
          COUNT(*) as count
        FROM cards
        WHERE is_active = 1
        GROUP BY rarity
        ORDER BY
          CASE rarity
            WHEN 'common' THEN 1
            WHEN 'uncommon' THEN 2
            WHEN 'rare' THEN 3
            WHEN 'super_rare' THEN 4
            WHEN 'secret_rare' THEN 5
            ELSE 6
          END
      `);

      const seriesStats = await Database.all(`
        SELECT
          series,
          COUNT(*) as count,
          SUM(card_count) as total_cards
        FROM boosters
        WHERE is_active = 1
        GROUP BY series
        ORDER BY series
      `);

      res.json({
        success: true,
        data: {
          totalCards,
          totalBoosters,
          rarityDistribution: rarityStats,
          seriesDistribution: seriesStats
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }
}
