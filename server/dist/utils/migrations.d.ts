export interface Migration {
    version: number;
    name: string;
    up: () => Promise<void>;
    down?: () => Promise<void>;
}
export declare class MigrationManager {
    private migrations;
    constructor();
    private loadMigrations;
    getCurrentVersion(): Promise<number>;
    getLatestVersion(): Promise<number>;
    migrate(targetVersion?: number): Promise<void>;
    rollback(targetVersion: number): Promise<void>;
    listMigrations(): void;
    getStatus(): Promise<void>;
}
