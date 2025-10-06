import { Database } from '../utils/database.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
export class UserModel {
    static async create(userData) {
        const id = uuidv4();
        const password_hash = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
        await Database.run(`INSERT INTO users (id, username, password_hash)
       VALUES (?, ?, ?)`, [id, userData.username, password_hash]);
        const user = await this.findById(id);
        if (!user) {
            throw new Error('Erreur lors de la création de l\'utilisateur');
        }
        return user;
    }
    static async findById(id) {
        const user = await Database.get('SELECT * FROM users WHERE id = ? AND is_active = 1', [id]);
        if (!user)
            return undefined;
        // Convertir les dates
        return {
            ...user,
            next_booster_time: user.next_booster_time ? new Date(user.next_booster_time) : null,
            last_booster_opened: user.last_booster_opened ? new Date(user.last_booster_opened) : null
        };
    }
    static async findByUsername(username) {
        return await Database.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);
    }
    static async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password_hash);
    }
    static async updateLastLogin(id) {
        await Database.run('UPDATE users SET last_login = datetime("now") WHERE id = ?', [id]);
    }
    static async update(id, updates) {
        const fields = [];
        const values = [];
        if (updates.username !== undefined) {
            fields.push('username = ?');
            values.push(updates.username);
        }
        if (updates.password !== undefined) {
            const password_hash = await bcrypt.hash(updates.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
            fields.push('password_hash = ?');
            values.push(password_hash);
        }
        if (updates.is_admin !== undefined) {
            fields.push('is_admin = ?');
            values.push(updates.is_admin);
        }
        if (updates.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(updates.is_active);
        }
        if (fields.length === 0) {
            return await this.findById(id);
        }
        fields.push('updated_at = datetime("now")');
        values.push(id);
        await Database.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        // Soft delete
        await Database.run('UPDATE users SET is_active = 0, updated_at = datetime("now") WHERE id = ?', [id]);
    }
    static async list(limit = 50, offset = 0) {
        return await Database.all('SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    }
    static async count() {
        const result = await Database.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
        return result?.count || 0;
    }
    static async getUserStats(userId) {
        const [collectionStats, openingsStats] = await Promise.all([
            Database.get(`
        SELECT
          COUNT(DISTINCT card_id) as unique_cards,
          SUM(quantity) as total_cards
        FROM user_collections
        WHERE user_id = ?
      `, [userId]),
            Database.get(`
        SELECT
          COUNT(*) as total_openings,
          COUNT(CASE WHEN DATE(opened_at) = DATE('now') THEN 1 END) as today_openings
        FROM booster_openings
        WHERE user_id = ?
      `, [userId])
        ]);
        return {
            unique_cards: collectionStats?.unique_cards || 0,
            total_cards: collectionStats?.total_cards || 0,
            total_openings: openingsStats?.total_openings || 0,
            today_openings: openingsStats?.today_openings || 0
        };
    }
}
//# sourceMappingURL=User.js.map