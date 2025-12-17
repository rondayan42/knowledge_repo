/* ==========================================
   Bsmart Knowledge Repository - Seed Root User
   Ensures rondayan42@gmail.com exists and is admin/root
   ========================================== */

require('dotenv').config();
const crypto = require('crypto');
const { query, initializeDatabase } = require('./database');

const ROOT_EMAIL = 'rondayan42@gmail.com';
const ROOT_PASSWORD = process.env.ROOT_INITIAL_PASSWORD || 'BsmartRoot2025!';

async function seedRootUser() {
    console.log(`Checking for root user: ${ROOT_EMAIL}...`);

    try {
        // Initialize database first
        await initializeDatabase();

        // Check if root user exists
        const existing = await query('SELECT * FROM users WHERE email = $1', [ROOT_EMAIL]);

        if (existing.rows.length > 0) {
            console.log('Root user already exists.');

            // Ensure they have admin privileges and are approved
            await query(
                'UPDATE users SET role = $1, approved = $2, is_root = $3 WHERE email = $4',
                ['admin', true, true, ROOT_EMAIL]
            );
            console.log('Root user privileges confirmed.');
        } else {
            console.log('Root user not found. Creating...');

            const passwordHash = hashPassword(ROOT_PASSWORD);

            await query(
                'INSERT INTO users (email, password_hash, role, approved, is_root) VALUES ($1, $2, $3, $4, $5)',
                [ROOT_EMAIL, passwordHash, 'admin', true, true]
            );

            console.log(`Root user created successfully.`);
            console.log(`Email: ${ROOT_EMAIL}`);
            console.log('IMPORTANT: Change the default password after first login.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding root user:', error.message);
        process.exit(1);
    }
}

seedRootUser();
