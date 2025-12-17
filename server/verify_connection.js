require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const LOG_FILE = 'verification_log.txt';
function log(msg) { fs.appendFileSync(LOG_FILE, msg + '\n'); console.log(msg); }

async function testConnection() {
    try {
        fs.writeFileSync(LOG_FILE, '--- Table Verification Start ---\n');

        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000,
        });

        const client = await pool.connect();
        log('Pool Connected');

        // Check if categories table exists
        try {
            const res = await client.query('SELECT count(*) FROM categories');
            log('Categories table exists. Count: ' + res.rows[0].count);
        } catch (err) {
            log('Querying categories FAILED: ' + err.message);
            if (err.code === '42P01') {
                log('CRITICAL: Table "categories" does not exist! Initialization likely failed.');
            }
        }

        client.release();
        await pool.end();
        log('Pool Closed');

    } catch (criticalErr) {
        log('Script Error: ' + criticalErr.message);
    }
}

testConnection();
