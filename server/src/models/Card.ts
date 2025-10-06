import { Database } from '../utils/database.js';

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
  color?: string[]; // Parsed JSON array
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

export class CardModel {
  static async create(cardData: CardCreate): Promise<Card> {
    const colorJson = cardData.color ? JSON.stringify(cardData.color) : null;

    await Database.run(`
      INSERT INTO cards (
        id, name, character_name, rarity, attack, defense, cost,
        power, counter, color, type, description, special_ability,
        image_url, booster_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cardData.id,
      cardData.name,
      cardData.character_name,
      cardData.rarity,
      cardData.attack,
      cardData.defense,
      cardData.cost,
      cardData.power,
      cardData.counter,
      colorJson,
      cardData.type,
      cardData.description,
      cardData.special_ability,
      cardData.image_url,
      cardData.booster_id
    ]);

    const card = await this.findById(cardData.id);
    if (!card) {
      throw new Error('Erreur lors de la création de la carte');
    }

    return card;
  }

  static async findById(id: string): Promise<Card | undefined> {
    const card = await Database.get<Card>(
      'SELECT * FROM cards WHERE id = ?',
      [id]
    );

    return this.transformCard(card);
  }

  static async findAll(limit: number = 1000, offset: number = 0): Promise<Card[]> {
    const cards = await Database.all<Card>(
      'SELECT * FROM cards WHERE is_active = 1 ORDER BY name LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return cards.map(card => this.transformCard(card)).filter(Boolean) as Card[];
  }

  static async findByBooster(boosterId: string): Promise<Card[]> {
    const cards = await Database.all<Card>(
      'SELECT * FROM cards WHERE booster_id = ? AND is_active = 1 ORDER BY rarity, name',
      [boosterId]
    );

    return cards.map(card => this.transformCard(card)).filter(Boolean) as Card[];
  }

  static async findByRarity(rarity: string, boosterId?: string): Promise<Card[]> {
    let query = 'SELECT * FROM cards WHERE rarity = ? AND is_active = 1';
    const params: any[] = [rarity];

    if (boosterId) {
      query += ' AND booster_id = ?';
      params.push(boosterId);
    }

    query += ' ORDER BY name';

    const cards = await Database.all<Card>(query, params);
    return cards.map(card => this.transformCard(card)).filter(Boolean) as Card[];
  }

  static async update(id: string, updates: CardUpdate): Promise<Card | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'color') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color ? JSON.stringify(updates.color) : null);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push('updated_at = datetime("now")');
    values.push(id);

    await Database.run(
      `UPDATE cards SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  static async upsert(cardData: CardCreate): Promise<Card> {
    const existing = await this.findById(cardData.id);

    if (existing) {
      // Mettre à jour si différent
      const needsUpdate = this.hasChanges(existing, cardData);
      if (needsUpdate) {
        return await this.update(cardData.id, cardData) || existing;
      }
      return existing;
    } else {
      // Créer nouvelle carte
      return await this.create(cardData);
    }
  }

  static async batchUpsert(cardsData: CardCreate[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    await Database.transaction(async () => {
      for (const cardData of cardsData) {
        const existing = await this.findById(cardData.id);

        if (existing) {
          const needsUpdate = this.hasChanges(existing, cardData);
          if (needsUpdate) {
            await this.update(cardData.id, cardData);
            updated++;
          }
        } else {
          await this.create(cardData);
          created++;
        }
      }
    });

    return { created, updated };
  }

  static async deactivate(id: string): Promise<void> {
    await Database.run(
      'UPDATE cards SET is_active = FALSE, updated_at = datetime("now") WHERE id = ?',
      [id]
    );
  }

  static async count(): Promise<number> {
    const result = await Database.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM cards WHERE is_active = 1'
    );
    return result?.count || 0;
  }

  static async searchCards(query: string, limit: number = 50): Promise<Card[]> {
    const searchTerm = `%${query.toLowerCase()}%`;

    const cards = await Database.all<Card>(`
      SELECT * FROM cards
      WHERE is_active = 1
        AND (
          LOWER(name) LIKE ? OR
          LOWER(character_name) LIKE ? OR
          LOWER(description) LIKE ? OR
          LOWER(type) LIKE ?
        )
      ORDER BY
        CASE
          WHEN LOWER(name) LIKE ? THEN 1
          WHEN LOWER(character_name) LIKE ? THEN 2
          ELSE 3
        END,
        name
      LIMIT ?
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit]);

    return cards.map(card => this.transformCard(card)).filter(Boolean) as Card[];
  }

  private static transformCard(card?: Card): Card | undefined {
    if (!card) return undefined;

    // Parser le JSON des couleurs
    const colors = card.color
      ? (typeof card.color === 'string' ? JSON.parse(card.color) : card.color)
      : [];

    return {
      ...card,
      color: Array.isArray(colors) ? colors : []
    } as any;
  }

  private static hasChanges(existing: Card, newData: CardCreate): boolean {
    // Comparer les champs principaux pour détecter les changements
    const fieldsToCompare = [
      'name', 'character_name', 'rarity', 'attack', 'defense',
      'cost', 'power', 'counter', 'type', 'description',
      'special_ability', 'image_url', 'booster_id'
    ];

    for (const field of fieldsToCompare) {
      const existingValue = (existing as any)[field];
      const newValue = (newData as any)[field];

      if (existingValue !== newValue) {
        return true;
      }
    }

    // Comparer les couleurs
    const existingColors = existing.color
      ? (typeof existing.color === 'string' ? JSON.parse(existing.color) : existing.color)
      : [];
    const newColors = newData.color || [];

    if (JSON.stringify(existingColors) !== JSON.stringify(newColors)) {
      return true;
    }

    return false;
  }
}