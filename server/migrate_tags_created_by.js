
const { pool } = require('./database');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Add created_by to tags table...');
        await client.query('BEGIN');

        await client.query(`
            ALTER TABLE tags 
            ADD COLUMN IF NOT EXISTS created_by TEXT;
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        // Close pool to allow script to exit
        await pool.end();
    }
}

migrate();
