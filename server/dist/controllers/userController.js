import { UserModel } from '../models/User.js';
import { CardModel } from '../models/Card.js';
import { Database } from '../utils/database.js';
import { BoosterService } from '../services/BoosterService.js';
import { v4 as uuidv4 } from 'uuid';
// Fonction pour transformer les cartes en camelCase
function transformCardToCamelCase(card) {
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
function transformUserCardToCamelCase(userCard) {
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
    static async getCollection(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Utilisateur non authentifié' });
                return;
            }
            const collection = await Database.all(`
        SELECT
          uc.*,
          c.name,
          c.character,
          c.rarity,
          c.type,
          c.color,
          c.cost,
          c.power,
          c.counter,
          c.description,
          c.special_ability,
          c.image_url,
          c.fallback_image_url
        FROM user_collections uc
        JOIN cards c ON uc.card_id = c.id
        WHERE uc.user_id = ?
        ORDER BY uc.obtained_at DESC
      `, [userId]);
            const transformedCollection = collection.map(transformUserCardToCamelCase);
            res.json({ success: true, data: transformedCollection });
        }
        catch (error) {
            console.error('Erreur lors de la récupération de la collection:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
    // Ajouter des cartes à la collection
    static async addCardsToCollection(req, res) {
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
                }
                else {
                    // Ajouter nouvelle carte
                    await Database.run(`
            INSERT INTO user_collections (user_id, card_id, quantity, obtained_at, is_favorite)
            VALUES (?, ?, 1, datetime('now'), 0)
          `, [userId, cardId]);
                }
                // Récupérer les détails de la carte
                const card = await CardModel.findById(cardId);
                if (card) {
                    addedCards.push(card);
                }
            }
            res.json({ success: true, data: addedCards.map(transformCardToCamelCase) });
        }
        catch (error) {
            console.error('Erreur lors de l\'ajout à la collection:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
    // Basculer le statut favori d'une carte
    static async toggleFavorite(req, res) {
        try {
            const userId = req.user?.id;
            const { cardId } = req.params;
            if (!userId) {
                res.status(401).json({ error: 'Utilisateur non authentifié' });
                return;
            }
            await Database.run(`
        UPDATE user_collections
        SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END
        WHERE user_id = ? AND card_id = ?
      `, [userId, cardId]);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Erreur lors du basculement favori:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
    // Obtenir le statut des boosters
    static async getBoosterStatus(req, res) {
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
                    }
                    else {
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
        }
        catch (error) {
            console.error('Erreur lors de la récupération du statut booster:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
    // Ouvrir un booster
    static async openBooster(req, res) {
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
            // Vérifier si l'utilisateur peut ouvrir un booster
            const availableBoosters = user.available_boosters !== undefined && user.available_boosters !== null ? user.available_boosters : 3;
            if (availableBoosters <= 0) {
                res.status(400).json({ error: 'Aucun booster disponible' });
                return;
            }
            // Sélectionner un booster aléatoire
            const randomBooster = await Database.get(`
        SELECT id FROM boosters WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1
      `);
            const boosterId = randomBooster?.id || null;
            // Générer les cartes du booster avec filtrage
            const cards = await BoosterService.generateBoosterCards(boosterId || undefined);
            // Déterminer quelles cartes sont nouvelles (pas encore dans la collection)
            const newCards = [];
            // Ajouter les cartes à la collection
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
                }
                else {
                    // Nouvelle carte
                    newCards.push(card.id);
                    await Database.run(`
            INSERT INTO user_collections (user_id, card_id, quantity, obtained_at, is_favorite)
            VALUES (?, ?, 1, datetime('now'), 0)
          `, [userId, card.id]);
                }
            }
            // Mettre à jour le statut des boosters
            const now = new Date();
            const newAvailableBoosters = availableBoosters - 1;
            let nextBoosterTime = user.next_booster_time;
            // Démarrer le timer si ce n'est pas déjà fait
            if (!nextBoosterTime && newAvailableBoosters < 3) {
                nextBoosterTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 heures
            }
            // Mettre à jour l'utilisateur
            await Database.run(`
        UPDATE users
        SET available_boosters = ?,
            next_booster_time = ?,
            boosters_opened_today = boosters_opened_today + 1,
            last_booster_opened = datetime('now')
        WHERE id = ?
      `, [newAvailableBoosters, nextBoosterTime?.toISOString() || null, userId]);
            // Enregistrer l'ouverture de booster avec un booster aléatoire
            if (boosterId) {
                await Database.run(`
          INSERT INTO booster_openings (user_id, booster_id, session_id, seed, opened_at, cards_obtained)
          VALUES (?, ?, ?, 0, datetime('now'), ?)
        `, [userId, boosterId, uuidv4(), JSON.stringify(cards.map(c => c.id))]);
            }
            res.json({
                success: true,
                data: {
                    cards: cards.map(transformCardToCamelCase),
                    new_cards: newCards,
                    available_boosters: newAvailableBoosters,
                    next_booster_time: nextBoosterTime
                }
            });
        }
        catch (error) {
            console.error('Erreur lors de l\'ouverture du booster:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
    // Obtenir les statistiques de l'utilisateur
    static async getStats(req, res) {
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
            const rarityBreakdown = {};
            rarityStats.forEach((stat) => {
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
            const boosterBreakdown = {};
            boosterStats.forEach((stat) => {
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
        }
        catch (error) {
            console.error('Erreur lors de la récupération des stats:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}
//# sourceMappingURL=userController.js.map