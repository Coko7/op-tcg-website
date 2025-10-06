import { Database } from '../utils/database.js';
export class CardModel {
    static async create(cardData) {
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
    static async findById(id) {
        const card = await Database.get('SELECT * FROM cards WHERE id = ?', [id]);
        return this.transformCard(card);
    }
    static async findAll(limit = 1000, offset = 0) {
        const cards = await Database.all('SELECT * FROM cards WHERE is_active = 1 ORDER BY name LIMIT ? OFFSET ?', [limit, offset]);
        return cards.map(card => this.transformCard(card)).filter(Boolean);
    }
    static async findByBooster(boosterId) {
        const cards = await Database.all('SELECT * FROM cards WHERE booster_id = ? AND is_active = 1 ORDER BY rarity, name', [boosterId]);
        return cards.map(card => this.transformCard(card)).filter(Boolean);
    }
    static async findByRarity(rarity, boosterId) {
        let query = 'SELECT * FROM cards WHERE rarity = ? AND is_active = 1';
        const params = [rarity];
        if (boosterId) {
            query += ' AND booster_id = ?';
            params.push(boosterId);
        }
        query += ' ORDER BY name';
        const cards = await Database.all(query, params);
        return cards.map(card => this.transformCard(card)).filter(Boolean);
    }
    static async update(id, updates) {
        const fields = [];
        const values = [];
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
        await Database.run(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async upsert(cardData) {
        const existing = await this.findById(cardData.id);
        if (existing) {
            // Mettre à jour si différent
            const needsUpdate = this.hasChanges(existing, cardData);
            if (needsUpdate) {
                return await this.update(cardData.id, cardData) || existing;
            }
            return existing;
        }
        else {
            // Créer nouvelle carte
            return await this.create(cardData);
        }
    }
    static async batchUpsert(cardsData) {
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
                }
                else {
                    await this.create(cardData);
                    created++;
                }
            }
        });
        return { created, updated };
    }
    static async deactivate(id) {
        await Database.run('UPDATE cards SET is_active = FALSE, updated_at = datetime("now") WHERE id = ?', [id]);
    }
    static async count() {
        const result = await Database.get('SELECT COUNT(*) as count FROM cards WHERE is_active = 1');
        return result?.count || 0;
    }
    static async searchCards(query, limit = 50) {
        const searchTerm = `%${query.toLowerCase()}%`;
        const cards = await Database.all(`
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
        return cards.map(card => this.transformCard(card)).filter(Boolean);
    }
    static transformCard(card) {
        if (!card)
            return undefined;
        // Parser le JSON des couleurs
        const colors = card.color
            ? (typeof card.color === 'string' ? JSON.parse(card.color) : card.color)
            : [];
        return {
            ...card,
            color: Array.isArray(colors) ? colors : []
        };
    }
    static hasChanges(existing, newData) {
        // Comparer les champs principaux pour détecter les changements
        const fieldsToCompare = [
            'name', 'character_name', 'rarity', 'attack', 'defense',
            'cost', 'power', 'counter', 'type', 'description',
            'special_ability', 'image_url', 'booster_id'
        ];
        for (const field of fieldsToCompare) {
            const existingValue = existing[field];
            const newValue = newData[field];
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
//# sourceMappingURL=Card.js.map