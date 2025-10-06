export declare class AchievementService {
    static updateAfterBoosterOpen(userId: string, boosterId: string, cardIds: string[]): Promise<void>;
    static initializeDefaultAchievements(): Promise<void>;
    static createBoosterAchievements(boosterId: string, boosterName: string): Promise<void>;
}
