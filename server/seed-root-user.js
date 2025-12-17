/* ==========================================
   Knowledge Repository - Seed Root User
   Ensures rondayan42@gmail.com exists and is admin/root
   ========================================== */

require('dotenv').config();
const supabase = require('./supabase');

const ROOT_EMAIL = 'rondayan42@gmail.com';
const ROOT_PASSWORD = process.env.ROOT_INITIAL_PASSWORD || 'AdminRoot2025!';

async function seedRootUser() {
    console.log(`Checking for root user: ${ROOT_EMAIL}...`);

    try {
        // 1. Check if user exists (by listing users, limited to 1 filtered by email if possible, 
        // but admin.listUsers doesn't filter by email directly in all versions, 
        // so we'll try to find them manually or use create and catch error)

        let userId = null;
        let userExists = false;

        // Note: listUsers is paginated, but for a specific email search we might need a different approach or 
        // just try to create and handle conflict. However, let's try to find them first to avoid password reset if present.

        // Better approach: Try to get user by email directly if the SDK supports it, or iterate.
        // The standard admin SDK usually allows listUsers.
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        const existingUser = users.find(u => u.email === ROOT_EMAIL);

        if (existingUser) {
            console.log('Root user found.');
            userId = existingUser.id;
            userExists = true;
        }

        if (!userExists) {
            console.log('Root user not found. Creating...');
            const { data, error: createError } = await supabase.auth.admin.createUser({
                email: ROOT_EMAIL,
                password: ROOT_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    role: 'admin',
                    is_root: true
                }
            });

            if (createError) throw createError;
            console.log(`Root user created successfully. ID: ${data.user.id}`);
            console.log('IMPORTANT: Verify the initial password is changed upon first login.');
        } else {
            console.log('Updating root user metadata to ensure admin privileges...');
            const { data, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
                user_metadata: {
                    role: 'admin',
                    is_root: true
                }
            });

            if (updateError) throw updateError;
            console.log('Root user privileges confirmed.');
        }

    } catch (error) {
        console.error('Error seeding root user:', error.message);
        process.exit(1);
    }
}

seedRootUser();
