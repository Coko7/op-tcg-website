import { Database } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface Island {
  id: string;
  name: string;
  order_index: number;
  description: string;
  latitude: number;
  longitude: number;
  unlock_requirement_island_id: string | null;
  final_reward_type: 'berrys' | 'crew_member' | null;
  final_reward_value: number | null;
  final_reward_crew_member_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CrewMember {
  id: string;
  name: string;
  description: string;
  image_url: string;
  unlock_island_id: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface Quest {
  id: string;
  island_id: string;
  name: string;
  description: string;
  duration_hours: number;
  reward_berrys: number;
  required_crew_count: number;
  specific_crew_member_id: string | null;
  order_index: number;
  is_repeatable: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserIsland {
  id: string;
  user_id: string;
  island_id: string;
  unlocked_at: string;
  completed_at: string | null;
  final_reward_claimed: boolean;
}

export interface UserCrewMember {
  id: string;
  user_id: string;
  crew_member_id: string;
  unlocked_at: string;
}

export interface ActiveQuest {
  id: string;
  user_id: string;
  quest_id: string;
  crew_member_ids: string;
  started_at: string;
  completes_at: string;
  completed: boolean;
  reward_claimed: boolean;
}

export interface QuestHistory {
  id: string;
  user_id: string;
  quest_id: string;
  crew_member_ids: string;
  completed_at: string;
  reward_berrys: number;
}

export class WorldMapModel {
  // ===== ISLANDS =====
  static async getAllIslands(): Promise<Island[]> {
    return await Database.all<Island>(`
      SELECT * FROM islands
      WHERE is_active = 1
      ORDER BY order_index ASC
    `);
  }

  static async getIslandById(id: string): Promise<Island | null> {
    const result = await Database.get<Island>('SELECT * FROM islands WHERE id = ? AND is_active = 1', [id]);
    return result || null;
  }

  static async createIsland(island: Omit<Island, 'id' | 'created_at'>): Promise<Island> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await Database.run(`
      INSERT INTO islands (
        id, name, order_index, description, latitude, longitude,
        unlock_requirement_island_id, final_reward_type, final_reward_value,
        final_reward_crew_member_id, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, island.name, island.order_index, island.description,
      island.latitude, island.longitude, island.unlock_requirement_island_id,
      island.final_reward_type, island.final_reward_value,
      island.final_reward_crew_member_id, island.is_active ? 1 : 0, now
    ]);

    return (await this.getIslandById(id))!;
  }

  // ===== CREW MEMBERS =====
  static async getAllCrewMembers(): Promise<CrewMember[]> {
    return await Database.all<CrewMember>(`
      SELECT * FROM crew_members
      WHERE is_active = 1
      ORDER BY order_index ASC
    `);
  }

  static async getCrewMemberById(id: string): Promise<CrewMember | null> {
    const result = await Database.get<CrewMember>('SELECT * FROM crew_members WHERE id = ? AND is_active = 1', [id]);
    return result || null;
  }

  static async createCrewMember(member: Omit<CrewMember, 'id' | 'created_at'>): Promise<CrewMember> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await Database.run(`
      INSERT INTO crew_members (
        id, name, description, image_url, unlock_island_id, order_index, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, member.name, member.description, member.image_url,
      member.unlock_island_id, member.order_index, member.is_active ? 1 : 0, now
    ]);

    return (await this.getCrewMemberById(id))!;
  }

  // ===== QUESTS =====
  static async getQuestsByIslandId(islandId: string): Promise<Quest[]> {
    return await Database.all<Quest>(`
      SELECT * FROM quests
      WHERE island_id = ? AND is_active = 1
      ORDER BY order_index ASC
    `, [islandId]);
  }

  static async getQuestById(id: string): Promise<Quest | null> {
    const result = await Database.get<Quest>('SELECT * FROM quests WHERE id = ? AND is_active = 1', [id]);
    return result || null;
  }

  static async createQuest(quest: Omit<Quest, 'id' | 'created_at'>): Promise<Quest> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await Database.run(`
      INSERT INTO quests (
        id, island_id, name, description, duration_hours, reward_berrys,
        required_crew_count, specific_crew_member_id, order_index,
        is_repeatable, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, quest.island_id, quest.name, quest.description, quest.duration_hours,
      quest.reward_berrys, quest.required_crew_count, quest.specific_crew_member_id,
      quest.order_index, quest.is_repeatable ? 1 : 0, quest.is_active ? 1 : 0, now
    ]);

    return (await this.getQuestById(id))!;
  }

  // ===== USER ISLANDS =====
  static async getUserIslands(userId: string): Promise<UserIsland[]> {
    return await Database.all<UserIsland>(`
      SELECT * FROM user_islands
      WHERE user_id = ?
      ORDER BY unlocked_at ASC
    `, [userId]);
  }

  static async unlockIsland(userId: string, islandId: string): Promise<UserIsland> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await Database.run(`
      INSERT INTO user_islands (id, user_id, island_id, unlocked_at)
      VALUES (?, ?, ?, ?)
    `, [id, userId, islandId, now]);

    return (await Database.get<UserIsland>(
      'SELECT * FROM user_islands WHERE id = ?',
      [id]
    ))!;
  }

  static async isIslandUnlocked(userId: string, islandId: string): Promise<boolean> {
    const result = await Database.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_islands WHERE user_id = ? AND island_id = ?',
      [userId, islandId]
    );
    return (result?.count ?? 0) > 0;
  }

  static async completeIsland(userId: string, islandId: string): Promise<void> {
    const now = new Date().toISOString();
    await Database.run(`
      UPDATE user_islands
      SET completed_at = ?
      WHERE user_id = ? AND island_id = ?
    `, [now, userId, islandId]);
  }

  static async claimIslandFinalReward(userId: string, islandId: string): Promise<void> {
    await Database.run(`
      UPDATE user_islands
      SET final_reward_claimed = 1
      WHERE user_id = ? AND island_id = ?
    `, [userId, islandId]);
  }

  // ===== USER CREW MEMBERS =====
  static async getUserCrewMembers(userId: string): Promise<UserCrewMember[]> {
    return await Database.all<UserCrewMember>(`
      SELECT * FROM user_crew_members
      WHERE user_id = ?
      ORDER BY unlocked_at ASC
    `, [userId]);
  }

  static async unlockCrewMember(userId: string, crewMemberId: string): Promise<UserCrewMember> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await Database.run(`
      INSERT INTO user_crew_members (id, user_id, crew_member_id, unlocked_at)
      VALUES (?, ?, ?, ?)
    `, [id, userId, crewMemberId, now]);

    return (await Database.get<UserCrewMember>(
      'SELECT * FROM user_crew_members WHERE id = ?',
      [id]
    ))!;
  }

  static async hasCrewMember(userId: string, crewMemberId: string): Promise<boolean> {
    const result = await Database.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_crew_members WHERE user_id = ? AND crew_member_id = ?',
      [userId, crewMemberId]
    );
    return (result?.count ?? 0) > 0;
  }

  // ===== ACTIVE QUESTS =====
  static async getActiveQuests(userId: string): Promise<ActiveQuest[]> {
    return await Database.all<ActiveQuest>(`
      SELECT * FROM active_quests
      WHERE user_id = ? AND completed = 0
      ORDER BY completes_at ASC
    `, [userId]);
  }

  static async startQuest(userId: string, questId: string, crewMemberIds: string[], durationHours: number): Promise<ActiveQuest> {
    const id = uuidv4();
    const now = new Date();
    const completesAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    await Database.run(`
      INSERT INTO active_quests (
        id, user_id, quest_id, crew_member_ids, started_at, completes_at, completed, reward_claimed
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)
    `, [id, userId, questId, JSON.stringify(crewMemberIds), now.toISOString(), completesAt.toISOString()]);

    return (await Database.get<ActiveQuest>(
      'SELECT * FROM active_quests WHERE id = ?',
      [id]
    ))!;
  }

  static async completeQuest(activeQuestId: string): Promise<void> {
    await Database.run(`
      UPDATE active_quests
      SET completed = 1
      WHERE id = ?
    `, [activeQuestId]);
  }

  static async claimQuestReward(activeQuestId: string): Promise<void> {
    await Database.run(`
      UPDATE active_quests
      SET reward_claimed = 1
      WHERE id = ?
    `, [activeQuestId]);
  }

  static async getActiveQuestById(id: string): Promise<ActiveQuest | null> {
    const result = await Database.get<ActiveQuest>('SELECT * FROM active_quests WHERE id = ?', [id]);
    return result || null;
  }

  // ===== QUEST HISTORY =====
  static async addQuestToHistory(
    userId: string,
    questId: string,
    crewMemberIds: string[],
    rewardBerrys: number
  ): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await Database.run(`
      INSERT INTO quest_history (id, user_id, quest_id, crew_member_ids, completed_at, reward_berrys)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, userId, questId, JSON.stringify(crewMemberIds), now, rewardBerrys]);
  }

  static async getQuestHistory(userId: string, limit: number = 50): Promise<QuestHistory[]> {
    return await Database.all<QuestHistory>(`
      SELECT * FROM quest_history
      WHERE user_id = ?
      ORDER BY completed_at DESC
      LIMIT ?
    `, [userId, limit]);
  }

  // ===== UTILITY =====
  static async isCrewMemberBusy(userId: string, crewMemberId: string): Promise<boolean> {
    const result = await Database.get<{ count: number }>(`
      SELECT COUNT(*) as count FROM active_quests
      WHERE user_id = ? AND completed = 0
      AND json_extract(crew_member_ids, '$') LIKE ?
    `, [userId, `%"${crewMemberId}"%`]);

    return (result?.count ?? 0) > 0;
  }

  static async getCompletedQuestsCountForIsland(userId: string, islandId: string): Promise<number> {
    const result = await Database.get<{ count: number }>(`
      SELECT COUNT(DISTINCT qh.quest_id) as count
      FROM quest_history qh
      JOIN quests q ON qh.quest_id = q.id
      WHERE qh.user_id = ? AND q.island_id = ?
    `, [userId, islandId]);

    return result?.count ?? 0;
  }

  static async getTotalQuestsForIsland(islandId: string): Promise<number> {
    const result = await Database.get<{ count: number }>(`
      SELECT COUNT(*) as count FROM quests
      WHERE island_id = ? AND is_active = 1
    `, [islandId]);

    return result?.count ?? 0;
  }
}
