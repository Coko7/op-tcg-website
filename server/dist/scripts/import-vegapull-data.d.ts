declare class VegapullImporter {
    private dataPath;
    constructor();
    importData(): Promise<void>;
    private importBookers;
    private importCards;
    private importCard;
    cleanup(): Promise<void>;
}
export { VegapullImporter };
