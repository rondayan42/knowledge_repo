
const { pool } = require('./database');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Add created_by to metadata tables...');
        await client.query('BEGIN');

        await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_by TEXT;`);
        await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_by TEXT;`);
        await client.query(`ALTER TABLE priorities ADD COLUMN IF NOT EXISTS created_by TEXT;`);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
