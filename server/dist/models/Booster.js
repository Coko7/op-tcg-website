import { Database } from '../utils/database.js';
export class BoosterModel {
    static async create(boosterData) {
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
    static async findById(id) {
        return await Database.get('SELECT * FROM boosters WHERE id = ?', [id]);
    }
    static async findAll(limit = 1000, offset = 0) {
        return await Database.all('SELECT * FROM boosters WHERE is_active = 1 ORDER BY release_date DESC, name LIMIT ? OFFSET ?', [limit, offset]);
    }
    static async findByCode(code) {
        return await Database.get('SELECT * FROM boosters WHERE code = ? AND is_active = 1', [code]);
    }
    static async findBySeries(series) {
        return await Database.all('SELECT * FROM boosters WHERE series = ? AND is_active = 1 ORDER BY release_date DESC', [series]);
    }
    static async update(id, updates) {
        const fields = [];
        const values = [];
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
        await Database.run(`UPDATE boosters SET ${fields.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async upsert(boosterData) {
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
        }
        else {
            const created = await this.create(boosterData);
            return {
                booster: created,
                wasCreated: true,
                wasUpdated: false
            };
        }
    }
    static async batchUpsert(boostersData) {
        let created = 0;
        let updated = 0;
        await Database.transaction(async () => {
            for (const boosterData of boostersData) {
                const result = await this.upsert(boosterData);
                if (result.wasCreated) {
                    created++;
                }
                else if (result.wasUpdated) {
                    updated++;
                }
            }
        });
        return { created, updated };
    }
    static async deactivate(id) {
        await Database.run('UPDATE boosters SET is_active = 0, updated_at = datetime("now") WHERE id = ?', [id]);
    }
    static async count() {
        const result = await Database.get('SELECT COUNT(*) as count FROM boosters WHERE is_active = 1');
        return result?.count || 0;
    }
    static async searchBoosters(query, limit = 20) {
        const searchTerm = `%${query.toLowerCase()}%`;
        return await Database.all(`
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
    static hasChanges(existing, newData) {
        const fieldsToCompare = [
            'name', 'code', 'series', 'description',
            'release_date', 'card_count', 'image_url'
        ];
        for (const field of fieldsToCompare) {
            const existingValue = existing[field];
            const newValue = newData[field];
            if (existingValue !== newValue) {
                return true;
            }
        }
        return false;
    }
}
//# sourceMappingURL=Booster.js.map