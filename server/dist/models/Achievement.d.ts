export type AchievementType = 'boosters_opened' | 'unique_cards' | 'booster_cards';
export interface Achievement {
    id: string;
    name: string;
    description: string;
    type: AchievementType;
    category: string;
    icon?: string;
    threshold: number;
    reward_berrys: number;
    booster_id?: string;
    is_active: boolean;
    created_at: string;
}
export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    progress: number;
    completed_at?: string;
    is_claimed: boolean;
    claimed_at?: string;
}
export interface AchievementWithProgress extends Achievement {
    progress: number;
    completed_at?: string;
    is_claimed: boolean;
    claimed_at?: string;
    completion_percentage: number;
}
export interface AchievementCreate {
    name: string;
    description: string;
    type: AchievementType;
    category: string;
    icon?: string;
    threshold: number;
    reward_berrys: number;
    booster_id?: string;
}
export declare class AchievementModel {
    static create(data: AchievementCreate): Promise<Achievement>;
    static findById(id: string): Promise<Achievement | undefined>;
    static listActive(): Promise<Achievement[]>;
    static list(): Promise<Achievement[]>;
    static getUserAchievements(userId: string): Promise<AchievementWithProgress[]>;
    static updateProgress(userId: string, achievementId: string, progress: number): Promise<void>;
    static claimAchievement(userId: string, achievementId: string): Promise<number>;
    static getUserStats(userId: string): Promise<{
        total: number;
        completed: number;
        claimed: number;
        unclaimed: number;
        total_berrys_earned: number;
        total_berrys_available: number;
    }>;
}
