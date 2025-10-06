declare class VegapullImporter {
    private dataPath;
    constructor(customPath?: string);
    importData(): Promise<void>;
    private importBookers;
    private importCards;
    private importCard;
    cleanup(): Promise<void>;
}
export { VegapullImporter };
