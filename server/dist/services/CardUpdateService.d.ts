interface UpdateResult {
    success: boolean;
    cardsAdded: number;
    cardsUpdated: number;
    boostersAdded: number;
    boostersUpdated: number;
    errors: string[];
}
export declare class CardUpdateService {
    private vegapullDataPath;
    private vegapullImagesPath;
    constructor();
    /**
     * Met à jour toutes les cartes et boosters depuis les données Vegapull
     */
    updateFromVegapull(forceUpdate?: boolean): Promise<UpdateResult>;
    /**
     * Vérifie si une mise à jour est nécessaire en comparant les hash
     */
    private checkIfUpdateNeeded;
    /**
     * Met à jour les boosters depuis les données Vegapull
     */
    private updateBoosters;
    /**
     * Met à jour les cartes depuis les données Vegapull
     */
    private updateCards;
    /**
     * Convertit une carte Vegapull vers notre format
     */
    private convertVegapullCard;
    /**
     * Génère une URL d'image pour une carte
     */
    private generateImageUrl;
    /**
     * Gère les cartes supprimées (plus présentes dans Vegapull)
     */
    private handleRemovedCards;
    /**
     * Calcule le hash des données Vegapull pour détecter les changements
     */
    private calculateVegapullDataHash;
    /**
     * Enregistre la mise à jour dans la base de données
     */
    private recordUpdate;
    /**
     * Récupère l'historique des mises à jour
     */
    getUpdateHistory(limit?: number): Promise<any[]>;
    /**
     * Restaure des cartes depuis le backup
     */
    restoreRemovedCards(cardIds: string[]): Promise<number>;
}
export {};
