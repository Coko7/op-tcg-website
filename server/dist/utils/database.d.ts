import Database_BetterSqlite3 from 'better-sqlite3';
export declare class Database {
    private static instance;
    private static dbPath;
    static initialize(dbPath?: string): Promise<Database_BetterSqlite3.Database>;
    static getInstance(): Database_BetterSqlite3.Database;
    static run(sql: string, params?: any[]): Promise<Database_BetterSqlite3.RunResult>;
    static get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
    static all<T = any>(sql: string, params?: any[]): Promise<T[]>;
    static transaction<T>(callback: () => Promise<T>): Promise<T>;
    static close(): Promise<void>;
    static getSchemaVersion(): Promise<number>;
    static updateSchemaVersion(version: number): Promise<void>;
    static backup(backupPath?: string): Promise<string>;
}
