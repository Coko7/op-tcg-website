// Service pour gérer les images des cartes One Piece depuis Vegapull
export class ImageService {
  private static readonly LOCAL_IMAGES_PATH = '/images/cards';
  private static readonly IMAGES_INDEX_URL = '/images/cards/index.json';
  private static readonly CACHE_KEY = 'op_booster_images_cache';

  private static imageCache: Map<string, string> = new Map();
  private static imageIndex: any[] = [];
  private static isLoaded = false;

  // Charger l'index des images depuis le serveur local
  static async loadImageIndex(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const response = await fetch(this.IMAGES_INDEX_URL);
      if (response.ok) {
        this.imageIndex = await response.json();

        // Construire le cache depuis l'index
        this.imageIndex.forEach(item => {
          this.imageCache.set(item.id, this.LOCAL_IMAGES_PATH + '/' + item.filename);
        });

        console.log(`Loaded ${this.imageIndex.length} images from Vegapull`);
        this.isLoaded = true;
      } else {
        console.warn('Image index not found. Images may not have been downloaded yet.');
      }
    } catch (error) {
      console.warn('Failed to load image index:', error);
    }
  }

  // Initialiser le service
  static async init(): Promise<void> {
    await this.loadImageIndex();
  }

  // Obtenir l'URL d'une image de carte
  static getCardImageUrl(cardId: string): string {
    // Initialiser le service si pas encore fait
    if (!this.isLoaded) {
      this.init().catch(console.warn);
    }

    // Vérifier si l'image existe localement
    if (this.imageCache.has(cardId)) {
      return this.imageCache.get(cardId)!;
    }

    // Retourner un placeholder en attendant
    return this.generatePlaceholderUrl(cardId);
  }

  // Générer une URL de placeholder pour une carte
  private static generatePlaceholderUrl(cardId: string): string {
    const hash = this.hashCode(cardId);

    // Différentes couleurs selon le préfixe de la carte
    const prefix = cardId.substring(0, 2).toLowerCase();
    const colorMap: Record<string, string> = {
      'op': '3b82f6', // bleu pour OP
      'st': 'ef4444', // rouge pour ST
      'eb': '10b981', // vert pour EB
      'pr': '8b5cf6', // violet pour PR
    };

    const bgColor = colorMap[prefix] || '6b7280';

    // Créer un placeholder plus joli avec le nom de la carte
    return `https://via.placeholder.com/200x280/${bgColor}/ffffff?text=${encodeURIComponent(cardId)}`;
  }

  // Fonction hash pour la consistance
  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  // Vérifier si les images Vegapull sont disponibles
  static async checkImagesAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.IMAGES_INDEX_URL);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Vérifier si une image est disponible
  static hasImage(cardId: string): boolean {
    return this.imageCache.has(cardId);
  }

  // Forcer le rechargement des images
  static async refreshImages(): Promise<void> {
    this.imageCache.clear();
    this.isLoaded = false;
    await this.loadImageIndex();
  }

  // Obtenir les statistiques du cache
  static getCacheStats(): { size: number; totalImages: number; isLoaded: boolean } {
    return {
      size: this.imageCache.size,
      totalImages: this.imageIndex.length,
      isLoaded: this.isLoaded
    };
  }

  // Obtenir la liste des cartes avec images disponibles
  static getAvailableImages(): string[] {
    return Array.from(this.imageCache.keys());
  }
}