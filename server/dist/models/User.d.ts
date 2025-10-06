export interface User {
    id: string;
    username: string;
    password_hash: string;
    created_at: string;
    updated_at: string;
    last_login?: string;
    is_admin: boolean;
    is_active: boolean;
    available_boosters?: number;
    next_booster_time?: Date | null;
    boosters_opened_today?: number;
    last_booster_opened?: Date | null;
}
export interface UserCreate {
    username: string;
    password: string;
}
export interface UserUpdate {
    username?: string;
    password?: string;
    is_admin?: boolean;
    is_active?: boolean;
}
export declare class UserModel {
    static create(userData: UserCreate): Promise<User>;
    static findById(id: string): Promise<User | undefined>;
    static findByUsername(username: string): Promise<User | undefined>;
    static verifyPassword(user: User, password: string): Promise<boolean>;
    static updateLastLogin(id: string): Promise<void>;
    static update(id: string, updates: UserUpdate): Promise<User | undefined>;
    static delete(id: string): Promise<void>;
    static list(limit?: number, offset?: number): Promise<User[]>;
    static count(): Promise<number>;
    static getUserStats(userId: string): Promise<{
        unique_cards: any;
        total_cards: any;
        total_openings: any;
        today_openings: any;
    }>;
}
