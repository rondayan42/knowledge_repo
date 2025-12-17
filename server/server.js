/* ==========================================
   Knowledge Repository - Express Server
   PostgreSQL Async Version
   ========================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

require('dotenv').config();

const { initializeDatabase, seedDefaultData } = require('./database');
const { Categories, Departments, Priorities, Tags, Articles, Attachments, Favorites, RecentlyViewed } = require('./models');
const supabase = require('./supabase');

// ==========================================
// Supabase Auth Middleware
// ==========================================

// Middleware: Authenticate User via Supabase JWT
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        // Verify the JWT with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'user'
        };
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token verification failed' });
    }
}

// Middleware: Admin Only
function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
// Serve uploaded files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
(async () => {
    try {
        await initializeDatabase();
        await seedDefaultData();
    } catch (e) {
        console.error('Failed to initialize database:', e);
    }
})();

// ==========================================
// S3 Client & Multer Setup
// ==========================================

const S3_BUCKET = process.env.S3_BUCKET;
let s3;
let upload = multer({ dest: 'uploads/' }); // Fallback local storage

if (S3_BUCKET) {
    s3 = new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: !!process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
        }
    });

    upload = multer({
        storage: multerS3({
            s3,
            bucket: S3_BUCKET,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: (req, file, cb) => {
                const ext = path.extname(file.originalname);
                const key = `attachments/${Date.now()}-${crypto.randomUUID()}${ext}`;
                cb(null, key);
            }
        }),
        limits: { fileSize: 20 * 1024 * 1024 } // 20MB
    });
    console.log('📂 Storage Mode: S3 (Cloud Storage)');
} else {
    console.log('📂 Storage Mode: LOCAL (Fallback to server disk)');
}

// ==========================================
// API Routes - Authentication
// ==========================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, captchaToken } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Create user with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                captchaToken, // Pass hCaptcha token
                data: {
                    role: 'user',
                    approved: false, // Default to not approved
                    approval_status: 'pending'
                }
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            user: {
                id: data.user?.id,
                email: data.user?.email,
                role: 'user',
                approved: false
            },
            session: null // Do not return session, require approval
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, captchaToken } = req.body;

        // Sign in with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: { captchaToken } // Pass hCaptcha token
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        // Check approval status
        // Backward compatibility: If approved is undefined, assume true (for legacy users)
        const isApproved = data.user?.user_metadata?.approved !== false;

        if (!isApproved) {
            // Sign out immediately if not approved
            await supabase.auth.signOut();
            return res.status(403).json({
                error: 'Account is pending admin approval'
            });
        }

        res.json({
            user: {
                id: data.user?.id,
                email: data.user?.email,
                role: data.user?.user_metadata?.role || 'user',
                approved: true
            },
            session: data.session
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

app.get('/api/auth/config', (req, res) => {
    res.json({
        hCaptchaSiteKey: process.env.HCAPTCHA_SITE_KEY
    });
});

// ==========================================
// API Routes - Categories
// ==========================================

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Categories.getAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const category = await Categories.create(name, description, req.user?.id);
        res.status(201).json(category);
    } catch (error) {
        if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
            res.status(400).json({ error: 'Category already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await Categories.update(req.params.id, name, description);
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        if (await Categories.isInUse(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete category in use' });
        }
        const category = await Categories.getById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        const isAdmin = req.user && req.user.role === 'admin';
        const isCreator = req.user && category.created_by && req.user.id === category.created_by;

        if (!isAdmin && !isCreator) {
            return res.status(403).json({ error: 'You do not have permission to delete this category' });
        }

        await Categories.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - Departments
// ==========================================

app.get('/api/departments', async (req, res) => {
    try {
        const departments = await Departments.getAll();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/departments', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const department = await Departments.create(name, description, req.user?.id);
        res.status(201).json(department);
    } catch (error) {
        if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
            res.status(400).json({ error: 'Department already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.put('/api/departments/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const department = await Departments.update(req.params.id, name, description);
        res.json(department);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/departments/:id', authenticateToken, async (req, res) => {
    try {
        if (await Departments.isInUse(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete department in use' });
        }
        const department = await Departments.getById(req.params.id);
        if (!department) return res.status(404).json({ error: 'Department not found' });

        const isAdmin = req.user && req.user.role === 'admin';
        const isCreator = req.user && department.created_by && req.user.id === department.created_by;

        if (!isAdmin && !isCreator) {
            return res.status(403).json({ error: 'You do not have permission to delete this department' });
        }

        await Departments.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - Priorities
// ==========================================

app.get('/api/priorities', async (req, res) => {
    try {
        const priorities = await Priorities.getAll();
        res.json(priorities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/priorities', authenticateToken, async (req, res) => {
    try {
        const { name, level, color } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const priority = await Priorities.create(name, level, color, req.user?.id);
        res.status(201).json(priority);
    } catch (error) {
        if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
            res.status(400).json({ error: 'Priority already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.put('/api/priorities/:id', async (req, res) => {
    try {
        const { name, level, color } = req.body;
        const priority = await Priorities.update(req.params.id, name, level, color);
        res.json(priority);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/priorities/:id', authenticateToken, async (req, res) => {
    try {
        if (await Priorities.isInUse(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete priority in use' });
        }
        const priority = await Priorities.getById(req.params.id);
        if (!priority) return res.status(404).json({ error: 'Priority not found' });

        const isAdmin = req.user && req.user.role === 'admin';
        const isCreator = req.user && priority.created_by && req.user.id === priority.created_by;

        if (!isAdmin && !isCreator) {
            return res.status(403).json({ error: 'You do not have permission to delete this priority' });
        }

        await Priorities.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - Tags
// ==========================================

app.get('/api/tags', async (req, res) => {
    try {
        const tags = await Tags.getAll();
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tags', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const tag = await Tags.create(name, req.user?.id);
        res.status(201).json(tag);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tags/:id', authenticateToken, async (req, res) => {
    try {
        const tag = await Tags.getById(req.params.id);
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        const isAdmin = req.user && req.user.role === 'admin';
        const isCreator = req.user && tag.created_by && req.user.id === tag.created_by;

        if (!isAdmin && !isCreator) {
            return res.status(403).json({ error: 'You do not have permission to delete this tag' });
        }

        await Tags.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - Articles
// ==========================================

app.get('/api/articles', async (req, res) => {
    try {
        const filters = {
            category_id: req.query.category_id,
            department_id: req.query.department_id,
            priority_id: req.query.priority_id
        };
        const articles = await Articles.getAll(filters);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/articles/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json([]);
        }
        const articles = await Articles.search(q);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/articles/stats', async (req, res) => {
    try {
        const stats = await Articles.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/articles/:id', async (req, res) => {
    try {
        const article = await Articles.getById(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        // Increment view count
        await Articles.incrementViews(req.params.id);
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Auth required for creating articles
app.post('/api/articles', authenticateToken, async (req, res) => {
    try {
        const { title, summary, content, category_id, department_id, priority_id, author, tags, attachmentIds } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Add author info from token
        const article = await Articles.create({
            title,
            summary,
            content,
            category_id,
            department_id,
            priority_id,
            author: req.user.email, // Use email for Supabase Auth
            author_id: req.user.id,    // Supabase UUID
            tags,
            attachmentIds
        });
        res.status(201).json(article);
    } catch (error) {
        console.error('Error creating article:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/articles/:id', authenticateToken, async (req, res) => {
    try {
        const { title, summary, content, category_id, department_id, priority_id, author, tags, attachmentIds } = req.body;

        // Permission Check: Admin or Author
        const existingArticle = await Articles.getById(req.params.id);
        if (!existingArticle) return res.status(404).json({ error: 'Article not found' });

        const isAuthor = existingArticle.author_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to edit this article' });
        }

        const article = await Articles.update(req.params.id, {
            title,
            summary,
            content,
            category_id,
            department_id,
            priority_id,
            author: author || existingArticle.author,
            author_id: existingArticle.author_id,
            tags,
            attachmentIds
        });
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/articles/:id', authenticateToken, async (req, res) => {
    try {
        const existingArticle = await Articles.getById(req.params.id);
        if (!existingArticle) return res.status(404).json({ error: 'Article not found' });

        const isAuthor = existingArticle.author_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to delete this article' });
        }

        await Articles.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - Attachments (Supabase Storage)
// ==========================================

// Use memory storage for multer, then upload to Supabase
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

app.post('/api/attachments', authenticateToken, memoryUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        // Generate unique filename
        const ext = path.extname(req.file.originalname);
        const fileName = `attachments/${Date.now()}-${crypto.randomUUID()}${ext}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ error: 'Failed to upload file: ' + error.message });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(fileName);

        const fileUrl = urlData.publicUrl;

        const attachment = await Attachments.create({
            article_id: req.body.articleId || null,
            file_name: req.file.originalname,
            mime_type: req.file.mimetype,
            size: req.file.size,
            url: fileUrl
        });

        res.status(201).json(attachment);
    } catch (error) {
        console.error('Attachment upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - Images (Supabase Storage for inline images)
// ==========================================

const imageMemoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for images
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

app.post('/api/images', authenticateToken, imageMemoryUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        // Generate unique filename
        const ext = path.extname(req.file.originalname);
        const fileName = `images/${Date.now()}-${crypto.randomUUID()}${ext}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase image upload error:', error);
            return res.status(500).json({ error: 'Failed to upload image: ' + error.message });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(fileName);

        res.status(201).json({
            url: urlData.publicUrl,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - User Management (Admin Only)
// ==========================================

// List all users (admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get all users from Supabase Auth
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error('Error listing users:', error);
            return res.status(500).json({ error: 'Failed to list users' });
        }

        // Map users to safe format (don't expose sensitive data)
        const safeUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            email: u.email,
            role: u.user_metadata?.role || 'user',
            // Default legacy users to approved
            approved: u.user_metadata?.approved !== false,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at
        }));

        res.json(safeUsers);
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user role (admin only)
app.put('/api/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
        }

        // Prevent admin from demoting themselves
        if (userId === req.user.id && role !== 'admin') {
            return res.status(400).json({ error: 'You cannot remove your own admin privileges' });
        }

        // Check if target is root user
        const { data: { user: targetUser }, error: fetchError } = await supabase.auth.admin.getUserById(userId);
        if (fetchError) {
            throw fetchError;
        }

        if (targetUser.user_metadata?.is_root) {
            return res.status(403).json({ error: 'Cannot modify the root user role' });
        }

        // Update user metadata in Supabase Auth
        const { data, error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { role }
        });

        if (error) {
            console.error('Error updating user role:', error);
            return res.status(500).json({ error: 'Failed to update user role' });
        }

        res.json({
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role || 'user'
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve user (admin only)
app.put('/api/users/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { approved } = req.body; // Expect boolean

        if (typeof approved !== 'boolean') {
            return res.status(400).json({ error: 'Approved status must be a boolean' });
        }

        // Update user metadata in Supabase Auth
        const { data, error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
                approved: approved,
                approval_status: approved ? 'approved' : 'pending'
            }
        });

        if (error) {
            console.error('Error updating user approval:', error);
            return res.status(500).json({ error: 'Failed to update user approval' });
        }

        res.json({
            id: data.user.id,
            email: data.user.email,
            approved: data.user.user_metadata?.approved,
            role: data.user.user_metadata?.role || 'user'
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete yourself' });
        }

        // Check if target is root user
        const { data: { user: targetUser }, error: fetchError } = await supabase.auth.admin.getUserById(userId);
        if (fetchError) {
            // If user not found in supabase, maybe already deleted or invalid ID
            if (fetchError.message.includes('User not found')) {
                return res.status(404).json({ error: 'User not found' });
            }
            throw fetchError;
        }

        if (targetUser.user_metadata?.is_root) {
            return res.status(403).json({ error: 'Cannot delete the root user' });
        }

        // Delete user via Supabase Auth
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ error: 'Failed to delete user' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - Favorites
// ==========================================

// Get user's favorite article IDs
app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const favoriteIds = await Favorites.getUserFavorites(req.user.id);
        res.json(favoriteIds);
    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add article to favorites
app.post('/api/favorites/:articleId', authenticateToken, async (req, res) => {
    try {
        const articleId = parseInt(req.params.articleId, 10);

        // Check if article exists
        const article = await Articles.getById(articleId);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        await Favorites.addFavorite(req.user.id, articleId);
        res.json({ success: true, articleId });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove article from favorites
app.delete('/api/favorites/:articleId', authenticateToken, async (req, res) => {
    try {
        const articleId = parseInt(req.params.articleId, 10);
        await Favorites.removeFavorite(req.user.id, articleId);
        res.json({ success: true, articleId });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API Routes - Recently Viewed
// ==========================================

// Get user's recently viewed articles
app.get('/api/recently-viewed', authenticateToken, async (req, res) => {
    try {
        const recentlyViewed = await RecentlyViewed.getUserRecentlyViewed(req.user.id);
        res.json(recentlyViewed);
    } catch (error) {
        console.error('Error getting recently viewed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add article to recently viewed
app.post('/api/recently-viewed/:articleId', authenticateToken, async (req, res) => {
    try {
        const articleId = parseInt(req.params.articleId, 10);

        // Check if article exists
        const article = await Articles.getById(articleId);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        await RecentlyViewed.addView(req.user.id, articleId);
        res.json({ success: true, articleId });
    } catch (error) {
        console.error('Error adding recently viewed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear user's recently viewed history
app.delete('/api/recently-viewed', authenticateToken, async (req, res) => {
    try {
        await RecentlyViewed.clearUserHistory(req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing recently viewed:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// System Routes (Maintenance)
// ==========================================

app.get('/api/admin/run-migration', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('Running migration from web trigger...');
        const { pool } = require('./database');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`ALTER TABLE tags ADD COLUMN IF NOT EXISTS created_by TEXT;`);
            await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_by TEXT;`);
            await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_by TEXT;`);
            await client.query(`ALTER TABLE priorities ADD COLUMN IF NOT EXISTS created_by TEXT;`);
            await client.query('COMMIT');
            res.json({ success: true, message: 'Migration executed successfully' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// Start Server
// ==========================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   Knowledge Repository Server (Postgres)               ║
║                                                        ║
║   Server running at: http://localhost:${PORT}          ║
║   API available at:  http://localhost:${PORT}/api      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
});
