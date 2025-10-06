export interface Card {
    id: string;
    name: string;
    character: string;
    rarity: string;
    attack?: number;
    defense?: number;
    cost?: number;
    power?: number;
    counter?: number;
    color?: string[];
    type?: string;
    description?: string;
    special_ability?: string;
    image_url?: string;
    fallback_image_url?: string;
    booster_id?: string;
    vegapull_id?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}
export interface CardCreate {
    id: string;
    name: string;
    character_name: string;
    rarity: string;
    attack?: number;
    defense?: number;
    cost?: number;
    power?: number;
    counter?: number;
    color?: string[];
    type?: string;
    description?: string;
    special_ability?: string;
    image_url?: string;
    booster_id?: string;
}
export interface CardUpdate {
    name?: string;
    character_name?: string;
    rarity?: string;
    attack?: number;
    defense?: number;
    cost?: number;
    power?: number;
    counter?: number;
    color?: string[];
    type?: string;
    description?: string;
    special_ability?: string;
    image_url?: string;
    booster_id?: string;
    is_active?: boolean;
}
export declare class CardModel {
    static create(cardData: CardCreate): Promise<Card>;
    static findById(id: string): Promise<Card | undefined>;
    static findAll(limit?: number, offset?: number): Promise<Card[]>;
    static findByBooster(boosterId: string): Promise<Card[]>;
    static findByRarity(rarity: string, boosterId?: string): Promise<Card[]>;
    static update(id: string, updates: CardUpdate): Promise<Card | undefined>;
    static upsert(cardData: CardCreate): Promise<Card>;
    static batchUpsert(cardsData: CardCreate[]): Promise<{
        created: number;
        updated: number;
    }>;
    static deactivate(id: string): Promise<void>;
    static count(): Promise<number>;
    static searchCards(query: string, limit?: number): Promise<Card[]>;
    private static transformCard;
    private static hasChanges;
}
