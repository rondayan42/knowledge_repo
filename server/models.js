/* ==========================================
   Knowledge Repository - Database Models
   PostgreSQL Version
   ========================================== */

const { query } = require('./database');
const crypto = require('crypto');

// ==========================================
// Categories Model
// ==========================================

const Categories = {
    async getAll() {
        const result = await query('SELECT * FROM categories ORDER BY name');
        return result.rows;
    },

    async getById(id) {
        const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
        return result.rows[0];
    },

    async create(name, description = null, creatorId = null) {
        const result = await query(
            'INSERT INTO categories (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
            [name, description, creatorId]
        );
        return { id: result.rows[0].id, name, description, created_by: creatorId };
    },

    async update(id, name, description = null) {
        await query(
            'UPDATE categories SET name = $1, description = $2 WHERE id = $3',
            [name, description, id]
        );
        return this.getById(id);
    },

    async delete(id) {
        return query('DELETE FROM categories WHERE id = $1', [id]);
    },

    async isInUse(id) {
        const result = await query('SELECT COUNT(*) as count FROM articles WHERE category_id = $1', [id]);
        return parseInt(result.rows[0].count) > 0;
    }
};



// ==========================================
// Departments Model
// ==========================================

const Departments = {
    async getAll() {
        const result = await query('SELECT * FROM departments ORDER BY name');
        return result.rows;
    },

    async getById(id) {
        const result = await query('SELECT * FROM departments WHERE id = $1', [id]);
        return result.rows[0];
    },

    async create(name, description = null, creatorId = null) {
        const result = await query(
            'INSERT INTO departments (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
            [name, description, creatorId]
        );
        return { id: result.rows[0].id, name, description, created_by: creatorId };
    },

    async update(id, name, description = null) {
        await query(
            'UPDATE departments SET name = $1, description = $2 WHERE id = $3',
            [name, description, id]
        );
        return this.getById(id);
    },

    async delete(id) {
        return query('DELETE FROM departments WHERE id = $1', [id]);
    },

    async isInUse(id) {
        const result = await query('SELECT COUNT(*) as count FROM articles WHERE department_id = $1', [id]);
        return parseInt(result.rows[0].count) > 0;
    }
};

// ==========================================
// Priorities Model
// ==========================================

const Priorities = {
    async getAll() {
        const result = await query('SELECT * FROM priorities ORDER BY level DESC');
        return result.rows;
    },

    async getById(id) {
        const result = await query('SELECT * FROM priorities WHERE id = $1', [id]);
        return result.rows[0];
    },

    async create(name, level = 0, color = null, creatorId = null) {
        const result = await query(
            'INSERT INTO priorities (name, level, color, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, level, color, creatorId]
        );
        return { id: result.rows[0].id, name, level, color, created_by: creatorId };
    },

    async update(id, name, level = 0, color = null) {
        await query(
            'UPDATE priorities SET name = $1, level = $2, color = $3 WHERE id = $4',
            [name, level, color, id]
        );
        return this.getById(id);
    },

    async delete(id) {
        return query('DELETE FROM priorities WHERE id = $1', [id]);
    },

    async isInUse(id) {
        const result = await query('SELECT COUNT(*) as count FROM articles WHERE priority_id = $1', [id]);
        return parseInt(result.rows[0].count) > 0;
    }
};

// ==========================================
// Tags Model
// ==========================================

const Tags = {
    async getAll() {
        const result = await query('SELECT * FROM tags ORDER BY name');
        return result.rows;
    },

    async getById(id) {
        const result = await query('SELECT * FROM tags WHERE id = $1', [id]);
        return result.rows[0];
    },

    async getByName(name) {
        const result = await query('SELECT * FROM tags WHERE name = $1', [name]);
        return result.rows[0];
    },

    async create(name, creatorId = null) {
        const existing = await this.getByName(name);
        if (existing) return existing;

        const result = await query(
            'INSERT INTO tags (name, created_by) VALUES ($1, $2) RETURNING id',
            [name, creatorId]
        );
        return { id: result.rows[0].id, name, created_by: creatorId };
    },

    async delete(id) {
        return query('DELETE FROM tags WHERE id = $1', [id]);
    },

    async getByArticleId(articleId) {
        const result = await query(`
            SELECT t.* FROM tags t
            JOIN article_tags at ON t.id = at.tag_id
            WHERE at.article_id = $1
            ORDER BY t.name
        `, [articleId]);
        return result.rows;
    }
};

// ==========================================
// Attachments Model
// ==========================================

const Attachments = {
    async create({ article_id = null, file_name, mime_type = null, size = null, url }) {
        const result = await query(`
            INSERT INTO attachments (article_id, file_name, mime_type, size, url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [article_id, file_name, mime_type, size, url]);
        return this.getById(result.rows[0].id);
    },

    async getById(id) {
        const result = await query('SELECT * FROM attachments WHERE id = $1', [id]);
        return result.rows[0];
    },

    async getByArticleId(articleId) {
        const result = await query('SELECT * FROM attachments WHERE article_id = $1 ORDER BY created_at DESC', [articleId]);
        return result.rows;
    },

    async detachFromArticle(articleId) {
        await query('UPDATE attachments SET article_id = NULL WHERE article_id = $1', [articleId]);
    },

    async assignToArticle(articleId, attachmentIds = []) {
        if (!Array.isArray(attachmentIds)) return;
        // Clear current links
        await this.detachFromArticle(articleId);

        // This loop is sequential for simplicity, could be batched
        for (const id of attachmentIds) {
            await query('UPDATE attachments SET article_id = $1 WHERE id = $2', [articleId, id]);
        }
    }
};

// ==========================================
// Favorites Model
// ==========================================

const Favorites = {
    async getUserFavorites(userId) {
        const result = await query(
            'SELECT article_id FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows.map(row => row.article_id);
    },

    async addFavorite(userId, articleId) {
        try {
            await query(
                'INSERT INTO user_favorites (user_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, articleId]
            );
            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    async removeFavorite(userId, articleId) {
        await query(
            'DELETE FROM user_favorites WHERE user_id = $1 AND article_id = $2',
            [userId, articleId]
        );
        return { success: true };
    },

    async isFavorited(userId, articleId) {
        const result = await query(
            'SELECT 1 FROM user_favorites WHERE user_id = $1 AND article_id = $2',
            [userId, articleId]
        );
        return result.rows.length > 0;
    }
};

// ==========================================
// Articles Model
// ==========================================

const Articles = {
    async getAll(filters = {}) {
        let sql = `
            SELECT 
                a.*,
                c.name as category_name,
                d.name as department_name,
                p.name as priority_name,
                p.color as priority_color,
                p.level as priority_level
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN departments d ON a.department_id = d.id
            LEFT JOIN priorities p ON a.priority_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (filters.category_id) {
            sql += ` AND a.category_id = $${paramCount++}`;
            params.push(filters.category_id);
        }

        if (filters.department_id) {
            sql += ` AND a.department_id = $${paramCount++}`;
            params.push(filters.department_id);
        }

        if (filters.priority_id) {
            sql += ` AND a.priority_id = $${paramCount++}`;
            params.push(filters.priority_id);
        }

        sql += ' ORDER BY a.updated_at DESC';

        const result = await query(sql, params);
        const articles = result.rows;

        // Get tags and attachments for each article
        // Note: Doing this in a loop (Select N+1) is inefficient but fine for small scale.
        // For larger scale, we would JOIN or batch fetch.
        for (const article of articles) {
            article.tags = await Tags.getByArticleId(article.id);
            article.attachments = await Attachments.getByArticleId(article.id);
        }

        return articles;
    },

    async getById(id) {
        const result = await query(`
            SELECT 
                a.*,
                c.name as category_name,
                d.name as department_name,
                p.name as priority_name,
                p.color as priority_color,
                p.level as priority_level
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN departments d ON a.department_id = d.id
            LEFT JOIN priorities p ON a.priority_id = p.id
            WHERE a.id = $1
        `, [id]);

        const article = result.rows[0];

        if (article) {
            article.tags = await Tags.getByArticleId(id);
            article.attachments = await Attachments.getByArticleId(id);
        }

        return article;
    },

    async create(data) {
        const result = await query(`
            INSERT INTO articles (title, summary, content, category_id, department_id, priority_id, author, author_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [
            data.title,
            data.summary || null,
            data.content || null,
            data.category_id || null,
            data.department_id || null,
            data.priority_id || null,
            data.author || null,
            data.author_id || null
        ]);

        const articleId = result.rows[0].id;

        // Add tags
        if (data.tags && Array.isArray(data.tags)) {
            await this.setTags(articleId, data.tags, data.author_id);
        }

        // Link attachments
        if (data.attachmentIds && Array.isArray(data.attachmentIds)) {
            await Attachments.assignToArticle(articleId, data.attachmentIds);
        }

        return this.getById(articleId);
    },

    async update(id, data) {
        await query(`
            UPDATE articles SET
                title = $1,
                summary = $2,
                content = $3,
                category_id = $4,
                department_id = $5,
                priority_id = $6,
                author = $7,
                author_id = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
        `, [
            data.title,
            data.summary || null,
            data.content || null,
            data.category_id || null,
            data.department_id || null,
            data.priority_id || null,
            data.author || null,
            data.author_id || null,
            id
        ]);

        // Update tags
        if (data.tags && Array.isArray(data.tags)) {
            await this.setTags(id, data.tags, data.author_id);
        }

        // Update attachments
        if (data.attachmentIds && Array.isArray(data.attachmentIds)) {
            await Attachments.assignToArticle(id, data.attachmentIds);
        }

        return this.getById(id);
    },

    async delete(id) {
        return query('DELETE FROM articles WHERE id = $1', [id]);
    },

    async setTags(articleId, tagNames, authorId = null) {
        // Remove existing tags
        await query('DELETE FROM article_tags WHERE article_id = $1', [articleId]);

        // Add new tags
        const insertTag = 'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';

        for (const tagName of tagNames) {
            const tag = await Tags.create(tagName, authorId);
            await query(insertTag, [articleId, tag.id]);
        }
    },

    async incrementViews(id) {
        await query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);
    },

    async search(searchTerm) {
        // Using ILIKE for basic search across title/summary/content
        // This replaces the FTS5 implementation for simplicity in Postgres without extensions
        const result = await query(`
            SELECT 
                a.*,
                c.name as category_name,
                d.name as department_name,
                p.name as priority_name,
                p.color as priority_color,
                p.level as priority_level
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN departments d ON a.department_id = d.id
            LEFT JOIN priorities p ON a.priority_id = p.id
            WHERE 
                a.title ILIKE $1 OR 
                a.summary ILIKE $1 OR 
                a.content ILIKE $1
            ORDER BY a.updated_at DESC
        `, [`%${searchTerm}%`]);

        const articles = result.rows;

        // Enrich with tags and snippets
        for (const article of articles) {
            article.tags = await Tags.getByArticleId(article.id);

            // Generate snippet with context
            article.snippet = this._generateSnippet(article, searchTerm);
            article.matchField = this._getMatchField(article, searchTerm);
        }

        return articles;
    },

    /**
     * Generate a snippet showing content around the search match
     */
    _generateSnippet(article, searchTerm) {
        const snippetLength = 150; // characters before and after match
        const term = searchTerm.toLowerCase();

        // Check title first
        if (article.title && article.title.toLowerCase().includes(term)) {
            return article.title;
        }

        // Then summary
        if (article.summary && article.summary.toLowerCase().includes(term)) {
            return this._extractSnippet(article.summary, searchTerm, snippetLength);
        }

        // Finally content (strip HTML first)
        if (article.content) {
            const textContent = article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
            if (textContent.toLowerCase().includes(term)) {
                return this._extractSnippet(textContent, searchTerm, snippetLength);
            }
        }

        return article.summary || '';
    },

    /**
     * Extract a snippet around the match
     */
    _extractSnippet(text, searchTerm, length) {
        const lowerText = text.toLowerCase();
        const lowerTerm = searchTerm.toLowerCase();
        const index = lowerText.indexOf(lowerTerm);

        if (index === -1) return text.substring(0, length * 2);

        const start = Math.max(0, index - length);
        const end = Math.min(text.length, index + searchTerm.length + length);

        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        return snippet;
    },

    /**
     * Determine which field matched
     */
    _getMatchField(article, searchTerm) {
        const term = searchTerm.toLowerCase();
        if (article.title && article.title.toLowerCase().includes(term)) return 'title';
        if (article.summary && article.summary.toLowerCase().includes(term)) return 'summary';
        if (article.content && article.content.toLowerCase().includes(term)) return 'content';
        return 'unknown';
    },

    async getStats() {
        const countRes = await query('SELECT COUNT(*) as count FROM articles');
        const viewsRes = await query('SELECT SUM(views) as total FROM articles');
        const catRes = await query(`
            SELECT c.name, COUNT(a.id) as count 
            FROM categories c 
            LEFT JOIN articles a ON c.id = a.category_id 
            GROUP BY c.id
        `);
        const depRes = await query(`
            SELECT d.name, COUNT(a.id) as count 
            FROM departments d 
            LEFT JOIN articles a ON d.id = a.department_id 
            GROUP BY d.id
        `);
        const recentRes = await query(`
            SELECT id, title, updated_at 
            FROM articles 
            ORDER BY updated_at DESC 
            LIMIT 5
        `);

        return {
            totalArticles: countRes.rows[0].count,
            totalViews: viewsRes.rows[0].total || 0,
            byCategory: catRes.rows,
            byDepartment: depRes.rows,
            recentArticles: recentRes.rows
        };
    }
};

// ==========================================
// Recently Viewed Model
// ==========================================

const RecentlyViewed = {
    async getUserRecentlyViewed(userId, limit = 20) {
        const result = await query(`
            SELECT 
                rv.article_id,
                rv.viewed_at,
                a.title,
                c.name as category,
                d.name as department
            FROM recently_viewed rv
            JOIN articles a ON rv.article_id = a.id
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN departments d ON a.department_id = d.id
            WHERE rv.user_id = $1
            AND rv.viewed_at > NOW() - INTERVAL '3 days'
            ORDER BY rv.viewed_at DESC
            LIMIT $2
        `, [userId, limit]);
        return result.rows;
    },

    async addView(userId, articleId) {
        try {
            // Use ON CONFLICT to update viewed_at if already exists
            await query(`
                INSERT INTO recently_viewed (user_id, article_id, viewed_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, article_id)
                DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
            `, [userId, articleId]);

            // Keep only last 20 for this user
            await query(`
                DELETE FROM recently_viewed
                WHERE user_id = $1
                AND id NOT IN (
                    SELECT id FROM recently_viewed
                    WHERE user_id = $1
                    ORDER BY viewed_at DESC
                    LIMIT 20
                )
            `, [userId]);

            // Also delete entries older than 3 days for this user
            await query(`
                DELETE FROM recently_viewed
                WHERE user_id = $1
                AND viewed_at < NOW() - INTERVAL '3 days'
            `, [userId]);

            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    async clearUserHistory(userId) {
        await query('DELETE FROM recently_viewed WHERE user_id = $1', [userId]);
        return { success: true };
    },

    // Cleanup old entries across all users (can be called periodically)
    async cleanupOldEntries() {
        const result = await query(`
            DELETE FROM recently_viewed
            WHERE viewed_at < NOW() - INTERVAL '3 days'
        `);
        return { deleted: result.rowCount };
    }
};

module.exports = {
    Categories,
    Departments,
    Priorities,
    Tags,
    Attachments,
    Articles,
    Favorites,
    RecentlyViewed
};
