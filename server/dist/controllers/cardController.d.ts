import { Request, Response } from 'express';
export declare class CardController {
    static getCards(req: Request, res: Response): Promise<void>;
    static getCard(req: Request, res: Response): Promise<void>;
    static getBoosters(req: Request, res: Response): Promise<void>;
    static getBooster(req: Request, res: Response): Promise<void>;
    static getCardsByRarity(req: Request, res: Response): Promise<void>;
    static getStats(req: Request, res: Response): Promise<void>;
}
