import { Database } from '../utils/database.js';

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

export class BoosterModel {
  static async create(boosterData: BoosterCreate): Promise<Booster> {
    await Database.run(`
      INSERT INTO boosters (
        id, name, code, series, description, release_date, card_count, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      boosterData.id,
      boosterData.name,
      boosterData.code,
      boosterData.series,
      boosterData.description,
      boosterData.release_date,
      boosterData.card_count,
      boosterData.image_url
    ]);

    const booster = await this.findById(boosterData.id);
    if (!booster) {
      throw new Error('Erreur lors de la création du booster');
    }

    return booster;
  }

  static async findById(id: string): Promise<Booster | undefined> {
    return await Database.get<Booster>(
      'SELECT * FROM boosters WHERE id = ?',
      [id]
    );
  }

  static async findAll(limit: number = 1000, offset: number = 0): Promise<Booster[]> {
    return await Database.all<Booster>(
      'SELECT * FROM boosters WHERE is_active = 1 ORDER BY release_date DESC, name LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  static async findByCode(code: string): Promise<Booster | undefined> {
    return await Database.get<Booster>(
      'SELECT * FROM boosters WHERE code = ? AND is_active = 1',
      [code]
    );
  }

  static async findBySeries(series: string): Promise<Booster[]> {
    return await Database.all<Booster>(
      'SELECT * FROM boosters WHERE series = ? AND is_active = 1 ORDER BY release_date DESC',
      [series]
    );
  }

  static async update(id: string, updates: BoosterUpdate): Promise<Booster | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push('updated_at = datetime("now")');
    values.push(id);

    await Database.run(
      `UPDATE boosters SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  static async upsert(boosterData: BoosterCreate): Promise<UpsertResult> {
    const existing = await this.findById(boosterData.id);

    if (existing) {
      const needsUpdate = this.hasChanges(existing, boosterData);
      if (needsUpdate) {
        const updated = await this.update(boosterData.id, boosterData);
        return {
          booster: updated || existing,
          wasCreated: false,
          wasUpdated: true
        };
      }
      return {
        booster: existing,
        wasCreated: false,
        wasUpdated: false
      };
    } else {
      const created = await this.create(boosterData);
      return {
        booster: created,
        wasCreated: true,
        wasUpdated: false
      };
    }
  }

  static async batchUpsert(boostersData: BoosterCreate[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    await Database.transaction(async () => {
      for (const boosterData of boostersData) {
        const result = await this.upsert(boosterData);
        if (result.wasCreated) {
          created++;
        } else if (result.wasUpdated) {
          updated++;
        }
      }
    });

    return { created, updated };
  }

  static async deactivate(id: string): Promise<void> {
    await Database.run(
      'UPDATE boosters SET is_active = 0, updated_at = datetime("now") WHERE id = ?',
      [id]
    );
  }

  static async count(): Promise<number> {
    const result = await Database.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM boosters WHERE is_active = 1'
    );
    return result?.count || 0;
  }

  static async searchBoosters(query: string, limit: number = 20): Promise<Booster[]> {
    const searchTerm = `%${query.toLowerCase()}%`;

    return await Database.all<Booster>(`
      SELECT * FROM boosters
      WHERE is_active = 1
        AND (
          LOWER(name) LIKE ? OR
          LOWER(code) LIKE ? OR
          LOWER(series) LIKE ? OR
          LOWER(description) LIKE ?
        )
      ORDER BY
        CASE
          WHEN LOWER(name) LIKE ? THEN 1
          WHEN LOWER(code) LIKE ? THEN 2
          ELSE 3
        END,
        release_date DESC,
        name
      LIMIT ?
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit]);
  }

  private static hasChanges(existing: Booster, newData: BoosterCreate): boolean {
    const fieldsToCompare = [
      'name', 'code', 'series', 'description',
      'release_date', 'card_count', 'image_url'
    ];

    for (const field of fieldsToCompare) {
      const existingValue = (existing as any)[field];
      const newValue = (newData as any)[field];

      if (existingValue !== newValue) {
        return true;
      }
    }

    return false;
  }
}