import { Request, Response } from 'express';
import { UserModel } from '../models/User.js';
import { CardModel } from '../models/Card.js';
import { Database } from '../utils/database.js';
import { BoosterService } from '../services/BoosterService.js';
import { AchievementService } from '../services/AchievementService.js';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogger, AuditAction } from '../utils/auditLogger.js';

// Prix de vente des cartes en Berrys selon la rareté
const CARD_SELL_PRICES: Record<string, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  super_rare: 150,
  secret_rare: 500,
};

// Prix d'un booster en Berrys
const BOOSTER_BERRY_PRICE = 100;

// Fonction pour transformer les cartes en camelCase
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

// Fonction pour transformer les cartes utilisateur
function transformUserCardToCamelCase(userCard: any) {
  return {
    card_id: userCard.card_id,
    quantity: userCard.quantity,
    obtained_at: userCard.obtained_at,
    is_favorite: userCard.is_favorite === 1,
    ...transformCardToCamelCase(userCard)
  };
}

export class UserController {
  // Obtenir la collection de l'utilisateur
  static async getCollection(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const collection = await Database.all(`
        SELECT
          uc.user_id,
          uc.card_id,
          uc.quantity,
          uc.obtained_at,
          uc.is_favorite,
          c.id,
          c.name,
          c.character,
          c.rarity,
          c.type,
          c.color,
          c.cost,
          c.power,
          c.counter,
          c.attack,
          c.defense,
          c.description,
          c.special_ability,
          c.image_url,
          c.fallback_image_url,
          c.booster_id,
          c.vegapull_id,
          c.is_active
        FROM user_collections uc
        JOIN cards c ON uc.card_id = c.id
        WHERE uc.user_id = ?
        ORDER BY uc.obtained_at DESC
      `, [userId]);

      const transformedCollection = collection.map(transformUserCardToCamelCase);
      res.json({ success: true, data: transformedCollection });
    } catch (error) {
      console.error('Erreur lors de la récupération de la collection:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Ajouter des cartes à la collection
  static async addCardsToCollection(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { cardIds } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      if (!Array.isArray(cardIds)) {
        res.status(400).json({ error: 'cardIds doit être un tableau' });
        return;
      }

      const addedCards = [];

      for (const cardId of cardIds) {
        // Vérifier si l'utilisateur a déjà cette carte
        const existing = await Database.get(`
          SELECT * FROM user_collections
          WHERE user_id = ? AND card_id = ?
        `, [userId, cardId]);

        if (existing) {
          // Augmenter la quantité
          await Database.run(`
            UPDATE user_collections
            SET quantity = quantity + 1
            WHERE user_id = ? AND card_id = ?
          `, [userId, cardId]);
        } else {
          // Ajouter nouvelle carte
          const now = new Date().toISOString();
          await Database.run(`
            INSERT INTO user_collections (user_id, card_id, quantity, obtained_at, is_favorite)
            VALUES (?, ?, 1, ?, 0)
          `, [userId, cardId, now]);
        }

        // Récupérer les détails de la carte
        const card = await CardModel.findById(cardId);
        if (card) {
          addedCards.push(card);
        }
      }

      res.json({ success: true, data: addedCards.map(transformCardToCamelCase) });
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la collection:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Basculer le statut favori d'une carte
  static async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { cardId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      // SÉCURITÉ: Vérifier que l'utilisateur possède bien cette carte
      const userCard = await Database.get(`
        SELECT card_id FROM user_collections
        WHERE user_id = ? AND card_id = ?
      `, [userId, cardId]);

      if (!userCard) {
        res.status(404).json({ error: 'Carte non trouvée dans votre collection' });
        return;
      }

      const result = await Database.run(`
        UPDATE user_collections
        SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END
        WHERE user_id = ? AND card_id = ?
      `, [userId, cardId]);

      if (result.changes === 0) {
        res.status(404).json({ error: 'Carte non trouvée' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Erreur lors du basculement favori:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Obtenir le statut des boosters
  static async getBoosterStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      const now = new Date();
      let availableBoosters = user.available_boosters !== undefined && user.available_boosters !== null ? user.available_boosters : 3;
      let nextBoosterTime = user.next_booster_time;

      // Calculer les boosters disponibles selon le timer
      if (nextBoosterTime && availableBoosters < 3) {
        const nextTime = new Date(nextBoosterTime);

        // Vérifier si le temps actuel est après le prochain temps de booster
        if (now >= nextTime) {
          // Calculer combien de périodes de 8h se sont écoulées
          const timePassed = now.getTime() - nextTime.getTime();
          const boostersToAdd = Math.floor(timePassed / (8 * 60 * 60 * 1000)) + 1;
          const actualBoostersToAdd = Math.min(boostersToAdd, 3 - availableBoosters);
          availableBoosters = Math.min(availableBoosters + actualBoostersToAdd, 3);

          // Calculer le prochain temps de booster
          if (availableBoosters < 3) {
            // Trouver le prochain moment de régénération après maintenant
            const baseTime = nextTime.getTime();
            const intervalsNeeded = Math.ceil((now.getTime() - baseTime) / (8 * 60 * 60 * 1000));
            nextBoosterTime = new Date(baseTime + (intervalsNeeded * 8 * 60 * 60 * 1000));
          } else {
            nextBoosterTime = null;
          }

          // Mettre à jour en base
          await Database.run(`
            UPDATE users
            SET available_boosters = ?, next_booster_time = ?
            WHERE id = ?
          `, [availableBoosters, nextBoosterTime?.toISOString() || null, userId]);
        }
      }

      const timeUntilNext = nextBoosterTime
        ? Math.max(0, new Date(nextBoosterTime).getTime() - now.getTime())
        : 0;

      res.json({
        success: true,
        data: {
          available_boosters: availableBoosters,
          max_daily_boosters: 3,
          next_booster_time: nextBoosterTime,
          time_until_next: timeUntilNext
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du statut booster:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Ouvrir un booster
  static async openBooster(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      // SÉCURITÉ: Recalculer les boosters disponibles côté serveur pour éviter la triche
      const now = new Date();
      let availableBoosters = user.available_boosters !== undefined && user.available_boosters !== null ? user.available_boosters : 3;
      let nextBoosterTime = user.next_booster_time;

      // Recalculer les boosters selon le timer serveur
      if (nextBoosterTime && availableBoosters < 3) {
        const nextTime = new Date(nextBoosterTime);
        if (now >= nextTime) {
          const timePassed = now.getTime() - nextTime.getTime();
          const boostersToAdd = Math.floor(timePassed / (8 * 60 * 60 * 1000)) + 1;
          const actualBoostersToAdd = Math.min(boostersToAdd, 3 - availableBoosters);
          availableBoosters = Math.min(availableBoosters + actualBoostersToAdd, 3);

          if (availableBoosters < 3) {
            const baseTime = nextTime.getTime();
            const intervalsNeeded = Math.ceil((now.getTime() - baseTime) / (8 * 60 * 60 * 1000));
            nextBoosterTime = new Date(baseTime + (intervalsNeeded * 8 * 60 * 60 * 1000));
          } else {
            nextBoosterTime = null;
          }

          // Mettre à jour immédiatement en base
          await Database.run(`
            UPDATE users
            SET available_boosters = ?, next_booster_time = ?
            WHERE id = ?
          `, [availableBoosters, nextBoosterTime?.toISOString() || null, userId]);
        }
      }

      // SÉCURITÉ: Vérification stricte après recalcul
      if (availableBoosters <= 0) {
        res.status(403).json({
          error: 'Aucun booster disponible',
          available_boosters: 0,
          next_booster_time: nextBoosterTime
        });
        return;
      }

      // SÉCURITÉ: TRANSACTION ATOMIQUE pour empêcher duplication de boosters
      let boosterId: string | null = req.body.boosterId || null;
      let cards: any[] = [];
      const newCards: string[] = [];
      let newAvailableBoosters = 0;
      let finalNextBoosterTime: Date | null = null;

      await Database.transaction(async () => {
        // 1. Vérifier à nouveau les boosters disponibles dans la transaction
        const currentUser = await Database.get(`
          SELECT available_boosters FROM users WHERE id = ?
        `, [userId]);

        if (!currentUser || currentUser.available_boosters <= 0) {
          throw new Error('Aucun booster disponible');
        }

        // 2. Déduire le booster disponible avec vérification atomique
        const updateResult = await Database.run(`
          UPDATE users
          SET available_boosters = available_boosters - 1,
              boosters_opened_today = boosters_opened_today + 1,
              last_booster_opened = ?
          WHERE id = ? AND available_boosters > 0
        `, [new Date().toISOString(), userId]);

        if (updateResult.changes === 0) {
          throw new Error('Aucun booster disponible');
        }

        // 3. Valider/sélectionner le booster
        if (boosterId) {
          const boosterExists = await Database.get(`
            SELECT id FROM boosters WHERE id = ? AND is_active = 1
          `, [boosterId]);

          if (!boosterExists) {
            throw new Error('Booster invalide');
          }
        } else {
          const randomBooster = await Database.get(`
            SELECT id FROM boosters WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1
          `);
          boosterId = randomBooster?.id || null;

          if (!boosterId) {
            throw new Error('Aucun booster disponible dans le système');
          }
        }

        // 4. Générer les cartes
        cards = await BoosterService.generateBoosterCards(boosterId);

        // 5. Ajouter les cartes à la collection
        for (const card of cards) {
          const existing = await Database.get(`
            SELECT * FROM user_collections
            WHERE user_id = ? AND card_id = ?
          `, [userId, card.id]);

          if (existing) {
            await Database.run(`
              UPDATE user_collections
              SET quantity = quantity + 1
              WHERE user_id = ? AND card_id = ?
            `, [userId, card.id]);
          } else {
            newCards.push(card.id);
            await Database.run(`
              INSERT INTO user_collections (user_id, card_id, quantity, obtained_at, is_favorite)
              VALUES (?, ?, 1, ?, 0)
            `, [userId, card.id, new Date().toISOString()]);
          }
        }

        // 6. Calculer le nouveau statut de boosters
        const updatedUser = await Database.get(`
          SELECT available_boosters, next_booster_time FROM users WHERE id = ?
        `, [userId]);

        newAvailableBoosters = updatedUser?.available_boosters || 0;
        nextBoosterTime = updatedUser?.next_booster_time ? new Date(updatedUser.next_booster_time) : null;

        // Démarrer le timer si nécessaire
        if (!nextBoosterTime && newAvailableBoosters < 3) {
          finalNextBoosterTime = new Date(Date.now() + 8 * 60 * 60 * 1000);
          await Database.run(`
            UPDATE users SET next_booster_time = ? WHERE id = ?
          `, [finalNextBoosterTime.toISOString(), userId]);
        }

        // 7. Enregistrer l'ouverture
        await Database.run(`
          INSERT INTO booster_openings (user_id, booster_id, session_id, seed, opened_at, cards_obtained)
          VALUES (?, ?, ?, 0, ?, ?)
        `, [userId, boosterId, uuidv4(), new Date().toISOString(), JSON.stringify(cards.map(c => c.id))]);
      });

      // 8. Mettre à jour les achievements (hors transaction)
      if (boosterId) {
        try {
          await AchievementService.updateAfterBoosterOpen(userId, boosterId, cards.map(c => c.id));
        } catch (error) {
          console.error('Erreur mise à jour achievements (non bloquant):', error);
        }
      }

      // AUDIT: Log ouverture de booster
      await AuditLogger.logSuccess(AuditAction.BOOSTER_OPENED, userId, {
        boosterId,
        cardsObtained: cards.length,
        newCards: newCards.length,
        boostersRemaining: newAvailableBoosters
      }, req);

      res.json({
        success: true,
        data: {
          cards: cards.map(transformCardToCamelCase),
          new_cards: newCards,
          available_boosters: newAvailableBoosters,
          next_booster_time: finalNextBoosterTime || nextBoosterTime
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du booster:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Obtenir les statistiques de l'utilisateur
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      // Calculer les statistiques de collection
      const collectionStats = await Database.get(`
        SELECT
          SUM(quantity) as total_cards,
          COUNT(DISTINCT card_id) as unique_cards,
          COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorite_cards
        FROM user_collections
        WHERE user_id = ?
      `, [userId]);

      // Nombre total de cartes disponibles dans le jeu
      const totalAvailableCards = await Database.get(`
        SELECT COUNT(*) as count
        FROM cards
        WHERE is_active = 1
      `);

      // Statistiques par rareté (cartes possédées par l'utilisateur)
      const rarityStats = await Database.all(`
        SELECT
          c.rarity,
          COUNT(DISTINCT uc.card_id) as unique_count,
          SUM(uc.quantity) as total_count
        FROM user_collections uc
        JOIN cards c ON uc.card_id = c.id
        WHERE uc.user_id = ?
        GROUP BY c.rarity
      `, [userId]);

      // Conversion en objet pour rarity_breakdown
      const rarityBreakdown: Record<string, number> = {};
      rarityStats.forEach((stat: any) => {
        rarityBreakdown[stat.rarity] = stat.unique_count;
      });

      // Statistiques par booster (cartes possédées par l'utilisateur)
      const boosterStats = await Database.all(`
        SELECT
          c.booster_id,
          COUNT(DISTINCT uc.card_id) as unique_count
        FROM user_collections uc
        JOIN cards c ON uc.card_id = c.id
        WHERE uc.user_id = ? AND c.booster_id IS NOT NULL
        GROUP BY c.booster_id
      `, [userId]);

      // Conversion en objet pour booster_breakdown
      const boosterBreakdown: Record<string, number> = {};
      boosterStats.forEach((stat: any) => {
        boosterBreakdown[stat.booster_id] = stat.unique_count;
      });

      const uniqueCards = collectionStats.unique_cards || 0;
      const totalAvailable = totalAvailableCards.count || 0;
      const collectionCompletion = totalAvailable > 0
        ? Math.round((uniqueCards / totalAvailable) * 100)
        : 0;

      res.json({
        success: true,
        data: {
          total_cards: collectionStats.total_cards || 0,
          unique_cards: uniqueCards,
          favorite_cards: collectionStats.favorite_cards || 0,
          collection_completion: collectionCompletion,
          missing_cards: totalAvailable - uniqueCards,
          total_available_cards: totalAvailable,
          rarity_breakdown: rarityBreakdown,
          booster_breakdown: boosterBreakdown,
          user: {
            username: user.username,
            boosters_opened: user.boosters_opened_today || 0,
            created_at: user.created_at
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Vendre une carte
  static async sellCard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { cardId, quantity = 1 } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      // SÉCURITÉ: Valider les entrées
      if (!cardId || typeof cardId !== 'string') {
        res.status(400).json({ error: 'Card ID invalide' });
        return;
      }

      // SÉCURITÉ: Valider quantity (nombre entier positif, max raisonnable)
      const parsedQuantity = parseInt(quantity as any, 10);
      if (isNaN(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 1000) {
        res.status(400).json({ error: 'Quantité invalide (1-1000)' });
        return;
      }

      // SÉCURITÉ: Vérifier que l'utilisateur possède cette carte
      const userCard = await Database.get(`
        SELECT uc.*, c.rarity, c.is_active
        FROM user_collections uc
        JOIN cards c ON uc.card_id = c.id
        WHERE uc.user_id = ? AND uc.card_id = ?
      `, [userId, cardId]);

      if (!userCard) {
        res.status(404).json({ error: 'Carte non trouvée dans votre collection' });
        return;
      }

      // SÉCURITÉ: Vérifier que la carte est active
      if (!userCard.is_active) {
        res.status(400).json({ error: 'Cette carte ne peut plus être vendue' });
        return;
      }

      // SÉCURITÉ: Vérifier que l'utilisateur a assez de cartes (garder au moins 1)
      if (userCard.quantity <= parsedQuantity) {
        res.status(403).json({
          error: 'Vous devez garder au moins une carte de chaque type',
          current_quantity: userCard.quantity,
          requested_quantity: parsedQuantity
        });
        return;
      }

      // SÉCURITÉ: Calculer les Berrys gagnés côté serveur (jamais faire confiance au client)
      const sellPrice = CARD_SELL_PRICES[userCard.rarity] || 0;
      if (sellPrice === 0) {
        res.status(400).json({ error: 'Cette carte ne peut pas être vendue' });
        return;
      }

      const berrysEarned = sellPrice * parsedQuantity;

      // SÉCURITÉ: Protection contre overflow (max berrys raisonnable)
      const MAX_BERRYS = 999999999;
      const currentUser = await UserModel.findById(userId);
      const currentBerrys = currentUser?.berrys || 0;

      if (currentBerrys + berrysEarned > MAX_BERRYS) {
        res.status(400).json({
          error: 'Limite de Berrys atteinte',
          max_berrys: MAX_BERRYS
        });
        return;
      }

      // SÉCURITÉ: Transaction atomique pour éviter race conditions
      await Database.transaction(async () => {
        // Mettre à jour la quantité de cartes
        const updateCards = await Database.run(`
          UPDATE user_collections
          SET quantity = quantity - ?
          WHERE user_id = ? AND card_id = ? AND quantity > ?
        `, [parsedQuantity, userId, cardId, parsedQuantity]);

        if (updateCards.changes === 0) {
          throw new Error('Échec de la transaction: quantité insuffisante');
        }

        // Ajouter les Berrys
        await Database.run(`
          UPDATE users
          SET berrys = COALESCE(berrys, 0) + ?
          WHERE id = ?
        `, [berrysEarned, userId]);
      });

      // Récupérer le nouveau solde
      const user = await UserModel.findById(userId);
      const newBalance = user?.berrys || 0;

      // AUDIT: Log transaction vente de carte
      await AuditLogger.logSuccess(AuditAction.CARD_SOLD, userId, {
        cardId,
        quantity: parsedQuantity,
        rarity: userCard.rarity,
        berrysEarned,
        newBalance
      }, req);

      res.json({
        success: true,
        data: {
          berrys_earned: berrysEarned,
          new_balance: newBalance
        }
      });
    } catch (error) {
      console.error('Erreur lors de la vente de la carte:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Acheter un booster avec des Berrys
  static async buyBoosterWithBerrys(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { boosterId: requestedBoosterId } = req.body;

    try {
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      // SÉCURITÉ: Vérifier que l'utilisateur a assez de Berrys (relire depuis la DB)
      const currentBerrys = user.berrys || 0;
      if (currentBerrys < BOOSTER_BERRY_PRICE) {
        res.status(403).json({
          error: `Pas assez de Berrys`,
          required: BOOSTER_BERRY_PRICE,
          current: currentBerrys,
          missing: BOOSTER_BERRY_PRICE - currentBerrys
        });
        return;
      }

      // SÉCURITÉ: TRANSACTION ATOMIQUE COMPLÈTE pour éviter perte de Berrys
      let boosterId: string | null = null;
      let cards: any[] = [];
      const newCards: string[] = [];

      await Database.transaction(async () => {
        // 1. Déduire les Berrys avec vérification atomique
        const updateResult = await Database.run(`
          UPDATE users
          SET berrys = berrys - ?
          WHERE id = ? AND berrys >= ?
        `, [BOOSTER_BERRY_PRICE, userId, BOOSTER_BERRY_PRICE]);

        // Si aucune ligne affectée, rollback automatique
        if (updateResult.changes === 0) {
          throw new Error('Transaction refusée: Berrys insuffisants');
        }

        // 2. Valider/sélectionner le booster
        if (requestedBoosterId) {
          const boosterExists = await Database.get(`
            SELECT id FROM boosters WHERE id = ? AND is_active = 1
          `, [requestedBoosterId]);

          if (!boosterExists) {
            throw new Error('Booster invalide ou inactif');
          }
          boosterId = requestedBoosterId;
        } else {
          // Si aucun booster spécifié, en sélectionner un aléatoire
          const randomBooster = await Database.get(`
            SELECT id FROM boosters WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1
          `);
          boosterId = randomBooster?.id || null;
        }

        if (!boosterId) {
          throw new Error('Aucun booster disponible');
        }

        // 3. Générer les cartes du booster
        cards = await BoosterService.generateBoosterCards(boosterId);

        // 4. Ajouter les cartes à la collection
        for (const card of cards) {
          const existing = await Database.get(`
            SELECT * FROM user_collections
            WHERE user_id = ? AND card_id = ?
          `, [userId, card.id]);

          if (existing) {
            await Database.run(`
              UPDATE user_collections
              SET quantity = quantity + 1
              WHERE user_id = ? AND card_id = ?
            `, [userId, card.id]);
          } else {
            newCards.push(card.id);
            const nowCollection = new Date().toISOString();
            await Database.run(`
              INSERT INTO user_collections (user_id, card_id, quantity, obtained_at, is_favorite)
              VALUES (?, ?, 1, ?, 0)
            `, [userId, card.id, nowCollection]);
          }
        }

        // 5. Enregistrer l'ouverture
        const nowOpening = new Date().toISOString();
        await Database.run(`
          INSERT INTO booster_openings (user_id, booster_id, session_id, seed, opened_at, cards_obtained)
          VALUES (?, ?, ?, 0, ?, ?)
        `, [userId, boosterId, uuidv4(), nowOpening, JSON.stringify(cards.map(c => c.id))]);
      });

      // 6. Mettre à jour les achievements (hors transaction car non critique)
      if (boosterId) {
        try {
          await AchievementService.updateAfterBoosterOpen(userId, boosterId, cards.map(c => c.id));
        } catch (error) {
          console.error('Erreur mise à jour achievements (non bloquant):', error);
        }
      }

      // Récupérer le statut des boosters actualisé
      const updatedUser = await UserModel.findById(userId);
      const availableBoosters = updatedUser?.available_boosters || 0;
      const nextBoosterTime = updatedUser?.next_booster_time;
      const newBalance = updatedUser?.berrys || 0;

      // AUDIT: Log achat de booster
      await AuditLogger.logSuccess(AuditAction.BOOSTER_PURCHASED, userId, {
        boosterId,
        berrysSpent: BOOSTER_BERRY_PRICE,
        newBalance,
        cardsObtained: cards.length
      }, req);

      res.json({
        success: true,
        data: {
          cards: cards.map(transformCardToCamelCase),
          new_cards: newCards,
          available_boosters: availableBoosters,
          next_booster_time: nextBoosterTime,
          new_balance: newBalance
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'achat du booster:', error);

      // AUDIT: Log échec
      if (error.message?.includes('insuffisants')) {
        await AuditLogger.logFailure(AuditAction.BOOSTER_PURCHASED, {
          reason: 'insufficient_berrys',
          userId
        }, req, userId);
      }

      res.status(500).json({
        error: error.message || 'Erreur serveur'
      });
    }
  }

  // Obtenir le solde de Berrys
  static async getBerrysBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      res.json({
        success: true,
        data: {
          berrys: user.berrys || 0
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du solde de Berrys:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Réclamer la récompense quotidienne
  static async claimDailyReward(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    try {
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const DAILY_REWARD_BERRYS = 10;
      const MAX_BERRYS = 999999999;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const nowISO = now.toISOString();

      console.log(`[DAILY REWARD] User ${userId} attempting to claim - Today: ${today}`);

      let newBalance = 0;

      // Transaction atomique pour éviter double-claim
      await Database.transaction(async () => {
        // 1. Vérifier l'utilisateur et sa dernière récompense avec LOCK
        const user = await Database.get<any>(`
          SELECT id, berrys, last_daily_reward
          FROM users
          WHERE id = ?
        `, [userId]);

        if (!user) {
          throw new Error('Utilisateur non trouvé');
        }

        const lastDailyReward = user.last_daily_reward;
        const lastRewardDate = lastDailyReward ? lastDailyReward.split('T')[0] : null;

        console.log(`[DAILY REWARD] User ${userId} - Last reward: ${lastDailyReward}, Last date: ${lastRewardDate}`);

        // 2. Vérification stricte - si déjà réclamée aujourd'hui, rejeter immédiatement
        if (lastRewardDate === today) {
          console.log(`[DAILY REWARD] User ${userId} already claimed today - REJECTED`);
          throw new Error('Récompense quotidienne déjà réclamée aujourd\'hui');
        }

        // 3. Vérifier la limite de Berrys
        const currentBerrys = user.berrys || 0;
        if (currentBerrys + DAILY_REWARD_BERRYS > MAX_BERRYS) {
          throw new Error('Limite de Berrys atteinte');
        }

        // 4. Atomic update avec WHERE clause stricte pour éviter race condition
        const result = await Database.run(`
          UPDATE users
          SET berrys = COALESCE(berrys, 0) + ?,
              last_daily_reward = ?
          WHERE id = ?
            AND (last_daily_reward IS NULL OR date(last_daily_reward) < date(?))
        `, [DAILY_REWARD_BERRYS, nowISO, userId, nowISO]);

        if (result.changes === 0) {
          console.log(`[DAILY REWARD] Update failed - No changes (already claimed or race condition)`);
          throw new Error('Récompense quotidienne déjà réclamée');
        }

        console.log(`[DAILY REWARD] Update successful - Changes: ${result.changes}`);

        // 5. Récupérer le nouveau solde
        const updatedUser = await Database.get<any>(`
          SELECT berrys FROM users WHERE id = ?
        `, [userId]);

        newBalance = updatedUser?.berrys || 0;
      });

      // AUDIT: Log récompense réclamée (en dehors de la transaction)
      await AuditLogger.logSuccess(AuditAction.BERRYS_DAILY_REWARD, userId, {
        berrys_earned: DAILY_REWARD_BERRYS,
        new_balance: newBalance
      }, req);

      console.log(`[DAILY REWARD] User ${userId} successfully claimed - New balance: ${newBalance}`);

      res.json({
        success: true,
        data: {
          berrys_earned: DAILY_REWARD_BERRYS,
          new_balance: newBalance,
          next_reward_available: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
        }
      });

    } catch (error: any) {
      console.error('Erreur lors de la réclamation de la récompense quotidienne:', error);

      // AUDIT: Log échec
      if (error.message?.includes('déjà réclamée')) {
        await AuditLogger.logFailure(AuditAction.BERRYS_DAILY_REWARD, {
          reason: 'already_claimed',
          userId
        }, req, userId);

        res.status(400).json({
          error: 'Récompense quotidienne déjà réclamée aujourd\'hui',
          next_reward_available: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1).toISOString()
        });
        return;
      }

      res.status(500).json({
        error: error.message || 'Erreur serveur'
      });
    }
  }

  // Vérifier si la récompense quotidienne est disponible
  static async checkDailyReward(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Format YYYY-MM-DD

      const lastDailyReward = (user as any).last_daily_reward;
      const lastRewardDate = lastDailyReward ? lastDailyReward.split('T')[0] : null;

      const isAvailable = lastRewardDate !== today;
      const nextRewardDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      res.json({
        success: true,
        data: {
          is_available: isAvailable,
          last_claimed: lastDailyReward,
          next_reward_available: isAvailable ? now.toISOString() : nextRewardDate.toISOString(),
          reward_amount: 10
        }
      });
    } catch (error) {
      console.error('Erreur lors de la vérification de la récompense quotidienne:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupérer les informations de l'utilisateur connecté
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'Utilisateur introuvable' });
        return;
      }

      // Retourner les infos utilisateur (sans le password_hash)
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          is_admin: user.is_admin,
          berrys: user.berrys,
          available_boosters: user.available_boosters,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}