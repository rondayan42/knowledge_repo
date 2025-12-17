/* ==========================================
   Unseed Articles Script
   Removes seeded articles created by seed-articles.js
   ========================================== */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function unseedArticles() {
    const client = await pool.connect();

    try {
        console.log('\n🧹 Starting to remove seeded articles...\n');

        // Get count before deletion
        const beforeCount = await client.query(
            "SELECT COUNT(*) as count FROM articles WHERE author_id = 'seed-script-user'"
        );
        const countToDelete = parseInt(beforeCount.rows[0].count);

        if (countToDelete === 0) {
            console.log('ℹ️  No seeded articles found to remove.');
            return;
        }

        console.log(`   Found ${countToDelete} seeded articles to remove...`);

        await client.query('BEGIN');

        // Delete article_tags for seeded articles
        await client.query(`
            DELETE FROM article_tags 
            WHERE article_id IN (
                SELECT id FROM articles WHERE author_id = 'seed-script-user'
            )
        `);

        // Delete the seeded articles
        const result = await client.query(
            "DELETE FROM articles WHERE author_id = 'seed-script-user'"
        );

        // Clean up orphaned tags (tags with no articles)
        await client.query(`
            DELETE FROM tags 
            WHERE id NOT IN (
                SELECT DISTINCT tag_id FROM article_tags
            )
        `);

        await client.query('COMMIT');

        console.log(`\n🎉 Successfully removed ${countToDelete} seeded articles!`);
        console.log('   Orphaned tags have also been cleaned up.\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error removing seeded articles:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

unseedArticles();
