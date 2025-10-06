export interface Booster {
    id: string;
    name: string;
    code: string;
    series: string;
    description?: string;
    release_date?: string;
    card_count?: number;
    image_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface BoosterCreate {
    id: string;
    name: string;
    code: string;
    series: string;
    description?: string;
    release_date?: string;
    card_count?: number;
    image_url?: string;
}
export interface BoosterUpdate {
    name?: string;
    code?: string;
    series?: string;
    description?: string;
    release_date?: string;
    card_count?: number;
    image_url?: string;
    is_active?: boolean;
}
interface UpsertResult {
    booster: Booster;
    wasCreated: boolean;
    wasUpdated: boolean;
}
export declare class BoosterModel {
    static create(boosterData: BoosterCreate): Promise<Booster>;
    static findById(id: string): Promise<Booster | undefined>;
    static findAll(limit?: number, offset?: number): Promise<Booster[]>;
    static findByCode(code: string): Promise<Booster | undefined>;
    static findBySeries(series: string): Promise<Booster[]>;
    static update(id: string, updates: BoosterUpdate): Promise<Booster | undefined>;
    static upsert(boosterData: BoosterCreate): Promise<UpsertResult>;
    static batchUpsert(boostersData: BoosterCreate[]): Promise<{
        created: number;
        updated: number;
    }>;
    static deactivate(id: string): Promise<void>;
    static count(): Promise<number>;
    static searchBoosters(query: string, limit?: number): Promise<Booster[]>;
    private static hasChanges;
}
export {};
