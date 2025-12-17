/* ==========================================
   Knowledge Repository - Database Setup
   PostgreSQL Database with pg
   ========================================== */

require('dotenv').config();
const { Pool } = require('pg');

// Log connection attempt (masking password)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
    console.log('Attempting database connection to:', dbUrl.replace(/:[^:@]*@/, ':****@'));
} else {
    console.error('DATABASE_URL environment variable is MISSING');
}

// Create connection pool
const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl && dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000 // 10 second timeout
});

// Unexpected error handling (prevents crash)
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

// Explicitly test connection on startup
async function testConnection() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT 1');
        console.log('✅ Database connection successful! (Test Query Result:', res.rows[0], ')');
        client.release();
    } catch (err) {
        console.error('❌ FATAL: Database connection failed:', err.message);
        console.error('Error Stack:', err.stack);
    }
}
testConnection();

// Helper for running queries
const query = (text, params) => pool.query(text, params);

// ==========================================
// Create Tables
// ==========================================

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        console.log('Initializing database...');

        await client.query('BEGIN');

        // Categories table
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Departments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Priorities table
        await client.query(`
            CREATE TABLE IF NOT EXISTS priorities (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                level INTEGER DEFAULT 0,
                color TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tags table
        await client.query(`
            CREATE TABLE IF NOT EXISTS tags (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Articles table
        await client.query(`
            CREATE TABLE IF NOT EXISTS articles (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                summary TEXT,
                content TEXT,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
                priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
                author TEXT,
                author_id TEXT,
                views INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Article-Tags junction table
        await client.query(`
            CREATE TABLE IF NOT EXISTS article_tags (
                article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
                tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                PRIMARY KEY (article_id, tag_id)
            )
        `);

        // Attachments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS attachments (
                id SERIAL PRIMARY KEY,
                article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
                file_name TEXT NOT NULL,
                mime_type TEXT,
                size INTEGER,
                url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User Favorites table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_favorites (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, article_id)
            )
        `);

        // Recently Viewed table
        await client.query(`
            CREATE TABLE IF NOT EXISTS recently_viewed (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, article_id)
            )
        `);

        // Create indexes
        await client.query(`CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_articles_department ON articles(department_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_articles_priority ON articles(priority_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_attachments_article ON attachments(article_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_user_favorites_article ON user_favorites(article_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed(viewed_at)`);

        await client.query('COMMIT');
        console.log('Database initialized successfully');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error initializing database:', e);
    } finally {
        client.release();
    }
}

// ==========================================
// Seed Default Data
// ==========================================

async function seedDefaultData() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Default categories
        const categories = [
            ['הדרכה', 'מאמרי הדרכה והכשרה'],
            ['נהלים', 'נהלי עבודה ותקנון'],
            ['טכני', 'מידע טכני ותמיכה'],
            ['שירות לקוחות', 'מידע לנציגי שירות'],
            ['מכירות', 'חומרי מכירות ומידע מסחרי'],
            ['כללי', 'מידע כללי']
        ];

        for (const cat of categories) {
            await client.query('INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', cat);
        }

        // Default departments
        const departments = [
            ['תפעול', 'מחלקת תפעול'],
            ['פיתוח', 'מחלקת פיתוח תוכנה'],
            ['שיווק', 'מחלקת שיווק ופרסום'],
            ['משאבי אנוש', 'מחלקת משאבי אנוש'],
            ['הנהלה', 'הנהלת החברה'],
            ['תמיכה טכנית', 'מחלקת תמיכה טכנית']
        ];

        for (const dep of departments) {
            await client.query('INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', dep);
        }

        // Default priorities
        const priorities = [
            ['דחוף', 4, '#DC3545'],
            ['גבוהה', 3, '#E74C5C'],
            ['בינונית', 2, '#FFC107'],
            ['נמוכה', 1, '#28A745']
        ];

        for (const pri of priorities) {
            await client.query('INSERT INTO priorities (name, level, color) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING', pri);
        }

        await client.query('COMMIT');
        console.log('Default data seeded successfully');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error seeding data:', e);
    } finally {
        client.release();
    }
}

module.exports = {
    query,
    initializeDatabase,
    seedDefaultData,
    pool
};
