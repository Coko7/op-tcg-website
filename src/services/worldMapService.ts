import { apiService } from './api';

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
  unlocked: boolean;
  completed: boolean;
  final_reward_claimed: boolean;
  quests: Quest[];
  progress: {
    completed: number;
    total: number;
  };
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
}

export interface CrewMember {
  id: string;
  name: string;
  description: string;
  image_url: string;
  unlock_island_id: string | null;
  order_index: number;
  unlocked: boolean;
  available?: boolean;
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

export interface QuestHistoryEntry {
  id: string;
  user_id: string;
  quest_id: string;
  crew_member_ids: string;
  completed_at: string;
  reward_berrys: number;
  quest: Quest;
}

export interface MapData {
  islands: Island[];
  crewMembers: CrewMember[];
  activeQuests: ActiveQuest[];
}

class WorldMapService {
  async getMapData(): Promise<MapData> {
    const response = await apiService.get<MapData>('/world/map');
    return response;
  }

  async getUserCrew(): Promise<{ crew: CrewMember[] }> {
    const response = await apiService.get<{ crew: CrewMember[] }>('/world/crew');
    return response;
  }

  async startQuest(questId: string, crewMemberIds: string[]): Promise<{
    success: boolean;
    activeQuest: ActiveQuest;
    message: string;
  }> {
    const response = await apiService.post<{
      success: boolean;
      activeQuest: ActiveQuest;
      message: string;
    }>('/world/quests/start', {
      questId,
      crewMemberIds
    });
    return response;
  }

  async completeQuest(activeQuestId: string): Promise<{
    success: boolean;
    reward: { berrys: number };
    message: string;
  }> {
    const response = await apiService.post<{
      success: boolean;
      reward: { berrys: number };
      message: string;
    }>(`/world/quests/${activeQuestId}/complete`, {});
    return response;
  }

  async claimIslandReward(islandId: string): Promise<{
    success: boolean;
    reward: {
      type: string | null;
      value: number | null;
      crewMemberId: string | null;
    };
    message: string;
  }> {
    const response = await apiService.post<{
      success: boolean;
      reward: {
        type: string | null;
        value: number | null;
        crewMemberId: string | null;
      };
      message: string;
    }>(`/world/islands/${islandId}/claim`, {});
    return response;
  }

  async getQuestHistory(limit: number = 50): Promise<{ history: QuestHistoryEntry[] }> {
    const response = await apiService.get<{ history: QuestHistoryEntry[] }>(
      `/world/quests/history?limit=${limit}`
    );
    return response;
  }
}

const worldMapService = new WorldMapService();
export default worldMapService;
