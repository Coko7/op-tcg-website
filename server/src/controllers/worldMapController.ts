import { Request, Response } from 'express';
import { WorldMapModel } from '../models/WorldMap.js';
import { UserModel } from '../models/User.js';
import { Database } from '../utils/database.js';
import { AuditLogger } from '../utils/auditLogger.js';

export class WorldMapController {
  // ===== GET MAP DATA =====
  static async getMapData(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Non autorisé' });
        return;
      }

      // Récupérer toutes les données
      const [islands, crewMembers, userIslands, userCrewMembers, activeQuests] = await Promise.all([
        WorldMapModel.getAllIslands(),
        WorldMapModel.getAllCrewMembers(),
        WorldMapModel.getUserIslands(userId),
        WorldMapModel.getUserCrewMembers(userId),
        WorldMapModel.getActiveQuests(userId)
      ]);

      // Construire les données de la carte avec détails
      const mapData = await Promise.all(islands.map(async (island) => {
        const userIsland = userIslands.find(ui => ui.island_id === island.id);
        const quests = await WorldMapModel.getQuestsByIslandId(island.id);
        const completedCount = await WorldMapModel.getCompletedQuestsCountForIsland(userId, island.id);
        const totalQuests = quests.length;

        return {
          ...island,
          unlocked: !!userIsland,
          completed: !!userIsland?.completed_at,
          final_reward_claimed: userIsland?.final_reward_claimed ?? false,
          quests: quests,
          progress: {
            completed: completedCount,
            total: totalQuests
          }
        };
      }));

      // Enrichir les membres d'équipage avec info unlock
      const enrichedCrewMembers = crewMembers.map(member => ({
        ...member,
        unlocked: userCrewMembers.some(ucm => ucm.crew_member_id === member.id)
      }));

      res.json({
        islands: mapData,
        crewMembers: enrichedCrewMembers,
        activeQuests: activeQuests
      });

    } catch (error) {
      console.error('Error fetching map data:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ===== START QUEST =====
  static async startQuest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { questId, crewMemberIds } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Non autorisé' });
        return;
      }

      if (!questId || !Array.isArray(crewMemberIds) || crewMemberIds.length === 0) {
        res.status(400).json({ error: 'Données invalides' });
        return;
      }

      // Récupérer la quête
      const quest = await WorldMapModel.getQuestById(questId);
      if (!quest) {
        res.status(404).json({ error: 'Quête introuvable' });
        return;
      }

      // Vérifier l'île débloquée
      const islandUnlocked = await WorldMapModel.isIslandUnlocked(userId, quest.island_id);
      if (!islandUnlocked) {
        res.status(403).json({ error: 'Île non débloquée' });
        return;
      }

      // Vérifier le nombre de membres requis
      if (crewMemberIds.length !== quest.required_crew_count) {
        res.status(400).json({
          error: `Cette quête nécessite ${quest.required_crew_count} membre(s) d'équipage`
        });
        return;
      }

      // Vérifier la possession et disponibilité des membres
      for (const memberId of crewMemberIds) {
        const hasMember = await WorldMapModel.hasCrewMember(userId, memberId);
        if (!hasMember) {
          res.status(403).json({ error: 'Membre d\'équipage non débloqué' });
          return;
        }

        const isBusy = await WorldMapModel.isCrewMemberBusy(userId, memberId);
        if (isBusy) {
          res.status(400).json({ error: 'Un ou plusieurs membres sont déjà en mission' });
          return;
        }
      }

      // Si spécifique à un membre, vérifier
      if (quest.specific_crew_member_id) {
        if (!crewMemberIds.includes(quest.specific_crew_member_id)) {
          res.status(400).json({ error: 'Cette quête nécessite un membre d\'équipage spécifique' });
          return;
        }
      }

      // Démarrer la quête
      const activeQuest = await WorldMapModel.startQuest(
        userId,
        questId,
        crewMemberIds,
        quest.duration_hours
      );

      await AuditLogger.log({
        type: 'quest_started',
        quest_id: questId,
        quest_name: quest.name,
        crew_member_ids: JSON.stringify(crewMemberIds),
        duration_hours: quest.duration_hours
      }, req, userId);

      res.json({
        success: true,
        activeQuest,
        message: 'Quête démarrée avec succès'
      });

    } catch (error) {
      console.error('Error starting quest:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ===== COMPLETE AND CLAIM QUEST =====
  static async completeQuest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { activeQuestId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Non autorisé' });
        return;
      }

      const activeQuest = await WorldMapModel.getActiveQuestById(activeQuestId);
      if (!activeQuest) {
        res.status(404).json({ error: 'Quête active introuvable' });
        return;
      }

      if (activeQuest.user_id !== userId) {
        res.status(403).json({ error: 'Non autorisé' });
        return;
      }

      if (activeQuest.completed) {
        res.status(400).json({ error: 'Quête déjà terminée' });
        return;
      }

      // Vérifier que la quête est terminée (temps écoulé)
      const now = new Date();
      const completesAt = new Date(activeQuest.completes_at);

      if (now < completesAt) {
        res.status(400).json({
          error: 'La quête n\'est pas encore terminée',
          completesAt: activeQuest.completes_at
        });
        return;
      }

      // Récupérer la quête pour les récompenses
      const quest = await WorldMapModel.getQuestById(activeQuest.quest_id);
      if (!quest) {
        res.status(404).json({ error: 'Quête introuvable' });
        return;
      }

      // Transaction pour claim les récompenses
      await Database.transaction(async () => {
        // Marquer comme complétée
        await WorldMapModel.completeQuest(activeQuestId);
        await WorldMapModel.claimQuestReward(activeQuestId);

        // Ajouter les Berrys
        if (quest.reward_berrys > 0) {
          await UserModel.addBerrys(userId, quest.reward_berrys);
        }

        // Ajouter à l'historique
        const crewMemberIds = JSON.parse(activeQuest.crew_member_ids);
        await WorldMapModel.addQuestToHistory(
          userId,
          quest.id,
          crewMemberIds,
          quest.reward_berrys
        );

        // Vérifier si toutes les quêtes de l'île sont complétées
        const completedCount = await WorldMapModel.getCompletedQuestsCountForIsland(userId, quest.island_id);
        const totalQuests = await WorldMapModel.getTotalQuestsForIsland(quest.island_id);

        if (completedCount >= totalQuests) {
          await WorldMapModel.completeIsland(userId, quest.island_id);
        }
      });

      await AuditLogger.log({
        type: 'quest_completed',
        quest_id: quest.id,
        quest_name: quest.name,
        reward_berrys: quest.reward_berrys
      }, req, userId);

      res.json({
        success: true,
        reward: {
          berrys: quest.reward_berrys
        },
        message: 'Quête terminée avec succès'
      });

    } catch (error) {
      console.error('Error completing quest:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ===== CLAIM ISLAND FINAL REWARD =====
  static async claimIslandReward(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { islandId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Non autorisé' });
        return;
      }

      // Récupérer l'île
      const island = await WorldMapModel.getIslandById(islandId);
      if (!island) {
        res.status(404).json({ error: 'Île introuvable' });
        return;
      }

      // Vérifier que l'île est complétée
      const userIslands = await WorldMapModel.getUserIslands(userId);
      const userIsland = userIslands.find(ui => ui.island_id === islandId);

      if (!userIsland) {
        res.status(403).json({ error: 'Île non débloquée' });
        return;
      }

      if (!userIsland.completed_at) {
        res.status(400).json({ error: 'Île non complétée' });
        return;
      }

      if (userIsland.final_reward_claimed) {
        res.status(400).json({ error: 'Récompense déjà réclamée' });
        return;
      }

      // Transaction pour claim la récompense finale
      await Database.transaction(async () => {
        // Marquer comme réclamée
        await WorldMapModel.claimIslandFinalReward(userId, islandId);

        // Donner la récompense
        if (island.final_reward_type === 'berrys' && island.final_reward_value) {
          await UserModel.addBerrys(userId, island.final_reward_value);
        } else if (island.final_reward_type === 'crew_member' && island.final_reward_crew_member_id) {
          // Débloquer le membre d'équipage
          const hasAlready = await WorldMapModel.hasCrewMember(userId, island.final_reward_crew_member_id);
          if (!hasAlready) {
            await WorldMapModel.unlockCrewMember(userId, island.final_reward_crew_member_id);
          }
        }

        // Débloquer l'île suivante si elle existe
        const nextIsland = await Database.get<{ id: string }>(
          'SELECT id FROM islands WHERE unlock_requirement_island_id = ? AND is_active = 1',
          [islandId]
        );

        if (nextIsland) {
          const alreadyUnlocked = await WorldMapModel.isIslandUnlocked(userId, nextIsland.id);
          if (!alreadyUnlocked) {
            await WorldMapModel.unlockIsland(userId, nextIsland.id);
          }
        }
      });

      await AuditLogger.log({
        type: 'island_reward_claimed',
        island_id: islandId,
        island_name: island.name,
        reward_type: island.final_reward_type,
        reward_value: island.final_reward_value || island.final_reward_crew_member_id
      }, req, userId);

      res.json({
        success: true,
        reward: {
          type: island.final_reward_type,
          value: island.final_reward_value,
          crewMemberId: island.final_reward_crew_member_id
        },
        message: 'Récompense d\'île réclamée avec succès'
      });

    } catch (error) {
      console.error('Error claiming island reward:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ===== GET USER CREW =====
  static async getUserCrew(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Non autorisé' });
        return;
      }

      const userCrewMembers = await WorldMapModel.getUserCrewMembers(userId);
      const crewMemberIds = userCrewMembers.map(ucm => ucm.crew_member_id);

      const crewMembers = await Promise.all(
        crewMemberIds.map(id => WorldMapModel.getCrewMemberById(id))
      );

      // Filter out nulls and check availability
      const enrichedCrew = await Promise.all(
        crewMembers.filter(Boolean).map(async (member) => {
          const isBusy = await WorldMapModel.isCrewMemberBusy(userId, member!.id);
          return {
            ...member,
            available: !isBusy
          };
        })
      );

      res.json({ crew: enrichedCrew });

    } catch (error) {
      console.error('Error fetching user crew:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ===== GET QUEST HISTORY =====
  static async getQuestHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({ error: 'Non autorisé' });
        return;
      }

      const history = await WorldMapModel.getQuestHistory(userId, limit);

      // Enrichir avec les infos de quête
      const enrichedHistory = await Promise.all(
        history.map(async (h) => {
          const quest = await WorldMapModel.getQuestById(h.quest_id);
          return {
            ...h,
            quest: quest
          };
        })
      );

      res.json({ history: enrichedHistory });

    } catch (error) {
      console.error('Error fetching quest history:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}
