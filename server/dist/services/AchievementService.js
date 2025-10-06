import { AchievementModel } from '../models/Achievement.js';
import { Database } from '../utils/database.js';
export class AchievementService {
    // Mettre à jour les achievements après l'ouverture d'un booster
    static async updateAfterBoosterOpen(userId, boosterId, cardIds) {
        // 1. Mettre à jour le nombre de boosters ouverts
        const boostersOpenedCount = await Database.get(`
      SELECT COUNT(*) as count
      FROM booster_openings
      WHERE user_id = ?
    `, [userId]);
        const totalBoostersOpened = boostersOpenedCount?.count || 0;
        // Mettre à jour tous les achievements de type "boosters_opened"
        const boosterAchievements = await Database.all(`
      SELECT id FROM achievements
      WHERE type = 'boosters_opened' AND is_active = 1
    `);
        for (const achievement of boosterAchievements) {
            await AchievementModel.updateProgress(userId, achievement.id, totalBoostersOpened);
        }
        // 2. Mettre à jour le nombre de cartes uniques possédées
        const uniqueCardsCount = await Database.get(`
      SELECT COUNT(DISTINCT card_id) as count
      FROM user_collections
      WHERE user_id = ?
    `, [userId]);
        const totalUniqueCards = uniqueCardsCount?.count || 0;
        // Mettre à jour tous les achievements de type "unique_cards"
        const uniqueCardsAchievements = await Database.all(`
      SELECT id FROM achievements
      WHERE type = 'unique_cards' AND is_active = 1
    `);
        for (const achievement of uniqueCardsAchievements) {
            await AchievementModel.updateProgress(userId, achievement.id, totalUniqueCards);
        }
        // 3. Mettre à jour le nombre de cartes différentes obtenues d'un booster spécifique
        const boosterCardsCount = await Database.get(`
      SELECT COUNT(DISTINCT uc.card_id) as count
      FROM user_collections uc
      JOIN cards c ON uc.card_id = c.id
      WHERE uc.user_id = ? AND c.booster_id = ?
    `, [userId, boosterId]);
        const totalBoosterCards = boosterCardsCount?.count || 0;
        // Mettre à jour les achievements de type "booster_cards" pour ce booster spécifique
        const boosterSpecificAchievements = await Database.all(`
      SELECT id FROM achievements
      WHERE type = 'booster_cards' AND booster_id = ? AND is_active = 1
    `, [boosterId]);
        for (const achievement of boosterSpecificAchievements) {
            await AchievementModel.updateProgress(userId, achievement.id, totalBoosterCards);
        }
    }
    // Initialiser les achievements de base
    static async initializeDefaultAchievements() {
        console.log('🏆 Initialisation des achievements par défaut...');
        const defaultAchievements = [
            // Achievements pour les boosters ouverts
            {
                name: 'Premier Booster',
                description: 'Ouvrez votre premier booster',
                type: 'boosters_opened',
                category: 'Ouverture de Boosters',
                icon: '🎁',
                threshold: 1,
                reward_berrys: 50
            },
            {
                name: 'Collectionneur Débutant',
                description: 'Ouvrez 10 boosters',
                type: 'boosters_opened',
                category: 'Ouverture de Boosters',
                icon: '📦',
                threshold: 10,
                reward_berrys: 100
            },
            {
                name: 'Collectionneur Assidu',
                description: 'Ouvrez 50 boosters',
                type: 'boosters_opened',
                category: 'Ouverture de Boosters',
                icon: '🎊',
                threshold: 50,
                reward_berrys: 250
            },
            {
                name: 'Maître Collectionneur',
                description: 'Ouvrez 100 boosters',
                type: 'boosters_opened',
                category: 'Ouverture de Boosters',
                icon: '🏆',
                threshold: 100,
                reward_berrys: 500
            },
            {
                name: 'Légende des Boosters',
                description: 'Ouvrez 250 boosters',
                type: 'boosters_opened',
                category: 'Ouverture de Boosters',
                icon: '👑',
                threshold: 250,
                reward_berrys: 1000
            },
            // Achievements pour les cartes uniques
            {
                name: 'Première Collection',
                description: 'Obtenez 10 cartes différentes',
                type: 'unique_cards',
                category: 'Collection',
                icon: '🃏',
                threshold: 10,
                reward_berrys: 50
            },
            {
                name: 'Collection Grandissante',
                description: 'Obtenez 50 cartes différentes',
                type: 'unique_cards',
                category: 'Collection',
                icon: '🗂️',
                threshold: 50,
                reward_berrys: 150
            },
            {
                name: 'Bibliothèque Impressionnante',
                description: 'Obtenez 100 cartes différentes',
                type: 'unique_cards',
                category: 'Collection',
                icon: '📚',
                threshold: 100,
                reward_berrys: 300
            },
            {
                name: 'Collection Épique',
                description: 'Obtenez 200 cartes différentes',
                type: 'unique_cards',
                category: 'Collection',
                icon: '💎',
                threshold: 200,
                reward_berrys: 600
            },
            {
                name: 'Collectionneur Ultime',
                description: 'Obtenez 500 cartes différentes',
                type: 'unique_cards',
                category: 'Collection',
                icon: '⭐',
                threshold: 500,
                reward_berrys: 1500
            }
        ];
        for (const achData of defaultAchievements) {
            // Vérifier si l'achievement existe déjà (par nom)
            const existing = await Database.get(`
        SELECT id FROM achievements WHERE name = ?
      `, [achData.name]);
            if (!existing) {
                await AchievementModel.create(achData);
                console.log(`  ✅ Achievement créé: ${achData.name}`);
            }
        }
        console.log('🏆 Achievements par défaut initialisés');
    }
    // Créer des achievements spécifiques à un booster
    static async createBoosterAchievements(boosterId, boosterName) {
        const boosterAchievements = [
            {
                name: `${boosterName} - Explorateur`,
                description: `Obtenez 10 cartes différentes du booster ${boosterName}`,
                type: 'booster_cards',
                category: 'Boosters Spécifiques',
                icon: '🔍',
                threshold: 10,
                reward_berrys: 100,
                booster_id: boosterId
            },
            {
                name: `${boosterName} - Collectionneur`,
                description: `Obtenez 25 cartes différentes du booster ${boosterName}`,
                type: 'booster_cards',
                category: 'Boosters Spécifiques',
                icon: '🎯',
                threshold: 25,
                reward_berrys: 250,
                booster_id: boosterId
            },
            {
                name: `${boosterName} - Maître`,
                description: `Obtenez 50 cartes différentes du booster ${boosterName}`,
                type: 'booster_cards',
                category: 'Boosters Spécifiques',
                icon: '🌟',
                threshold: 50,
                reward_berrys: 500,
                booster_id: boosterId
            }
        ];
        for (const achData of boosterAchievements) {
            const existing = await Database.get(`
        SELECT id FROM achievements WHERE name = ?
      `, [achData.name]);
            if (!existing) {
                await AchievementModel.create(achData);
            }
        }
    }
}
//# sourceMappingURL=AchievementService.js.map