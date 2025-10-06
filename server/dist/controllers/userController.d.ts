import { Request, Response } from 'express';
export declare class UserController {
    static getCollection(req: Request, res: Response): Promise<void>;
    static addCardsToCollection(req: Request, res: Response): Promise<void>;
    static toggleFavorite(req: Request, res: Response): Promise<void>;
    static getBoosterStatus(req: Request, res: Response): Promise<void>;
    static openBooster(req: Request, res: Response): Promise<void>;
    static getStats(req: Request, res: Response): Promise<void>;
}
