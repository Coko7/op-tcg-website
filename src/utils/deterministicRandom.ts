// Générateur de nombres pseudo-aléatoires déterministe
// Utilise l'algorithme LCG (Linear Congruential Generator) simple mais efficace
export class DeterministicRandom {
  private seed: number;
  private originalSeed: number;

  constructor(seed?: number) {
    // Si aucun seed n'est fourni, utiliser timestamp + une constante
    this.seed = seed ?? (Date.now() + Math.floor(Math.random() * 1000000));
    this.originalSeed = this.seed;
  }

  // Générer un nombre pseudo-aléatoire entre 0 et 1
  next(): number {
    // Algorithme LCG avec des constantes bien choisies
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296; // 2^32
    return this.seed / 4294967296;
  }

  // Générer un entier entre min (inclus) et max (inclus)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Mélanger un tableau de manière déterministe (Fisher-Yates)
  shuffle<T>(array: T[]): T[] {
    const result = [...array]; // Copie pour ne pas modifier l'original

    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  // Sélectionner un élément aléatoire d'un tableau
  choice<T>(array: T[]): T {
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  // Réinitialiser le générateur avec le seed original
  reset(): void {
    this.seed = this.originalSeed;
  }

  // Obtenir le seed actuel
  getSeed(): number {
    return this.originalSeed;
  }

  // Créer un nouveau générateur avec un seed dérivé (pour sous-opérations)
  derive(offset: number = 1): DeterministicRandom {
    return new DeterministicRandom(this.originalSeed + offset);
  }

  // Générer un seed sécurisé basé sur plusieurs facteurs
  static generateSecureSeed(userId?: string, sessionId?: string): number {
    const now = Date.now();
    const userHash = userId ? this.simpleHash(userId) : 0;
    const sessionHash = sessionId ? this.simpleHash(sessionId) : 0;

    // Combiner timestamp, hash utilisateur et hash session
    return (now + userHash + sessionHash) % 4294967296;
  }

  // Hash simple pour créer un seed à partir d'une chaîne
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en entier 32-bit
    }
    return Math.abs(hash);
  }
}

// Classe pour gérer les ouvertures de boosters avec seed persisté
export class BoosterSession {
  private rng: DeterministicRandom;
  private boosterId: string;
  private sessionId: string;
  private timestamp: number;

  constructor(boosterId: string, userId?: string) {
    this.boosterId = boosterId;
    this.timestamp = Date.now();
    this.sessionId = this.generateSessionId();

    // Créer un seed unique pour cette ouverture
    const seed = DeterministicRandom.generateSecureSeed(
      userId || 'anonymous',
      `${this.sessionId}-${boosterId}-${this.timestamp}`
    );

    this.rng = new DeterministicRandom(seed);
  }

  // Générer un ID de session unique
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  // Obtenir le générateur de nombres aléatoires pour cette session
  getRNG(): DeterministicRandom {
    return this.rng;
  }

  // Obtenir les informations de session (pour logging/debug)
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      boosterId: this.boosterId,
      timestamp: this.timestamp,
      seed: this.rng.getSeed()
    };
  }

  // Sérialiser la session pour persistance
  serialize(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      boosterId: this.boosterId,
      timestamp: this.timestamp,
      seed: this.rng.getSeed()
    });
  }

  // Restaurer une session depuis sa forme sérialisée
  static deserialize(data: string): BoosterSession {
    const parsed = JSON.parse(data);
    const session = Object.create(BoosterSession.prototype);
    session.sessionId = parsed.sessionId;
    session.boosterId = parsed.boosterId;
    session.timestamp = parsed.timestamp;
    session.rng = new DeterministicRandom(parsed.seed);
    return session;
  }
}