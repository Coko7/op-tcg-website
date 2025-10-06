import { Request, Response } from 'express';
export declare class AchievementController {
    static getUserAchievements(req: Request, res: Response): Promise<void>;
    static claimAchievement(req: Request, res: Response): Promise<void>;
    static getAchievementStats(req: Request, res: Response): Promise<void>;
    static listAllAchievements(req: Request, res: Response): Promise<void>;
}
