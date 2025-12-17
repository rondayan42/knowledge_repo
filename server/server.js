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
const { Categories, Departments, Priorities, Tags, Articles, Attachments, Favorites, RecentlyViewed, Users } = require('./models');

// ==========================================
// JWT Secret (use env variable or generate)
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Simple JWT implementation (no external library needed)
function createToken(payload, expiresInHours = 24) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Date.now() + (expiresInHours * 60 * 60 * 1000);
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
    try {
        const [header, body, signature] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
        if (signature !== expectedSig) return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (payload.exp && Date.now() > payload.exp) return null;
        return payload;
    } catch {
        return null;
    }
}

// Simple password hashing with crypto (no bcrypt dependency needed)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const verify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verify;
}

// ==========================================
// Auth Middleware
// ==========================================

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role || 'user'
    };
    next();
}

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
let upload = multer({ dest: 'uploads/' });

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
        limits: { fileSize: 20 * 1024 * 1024 }
    });
    console.log('📂 Storage Mode: S3 (Cloud Storage)');
} else {
    console.log('📂 Storage Mode: LOCAL (Fallback to server disk)');
}

// ==========================================
// API Routes - Authentication (Local)
// ==========================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Check if user exists
        const existing = await Users.getByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password and create user
        const passwordHash = hashPassword(password);
        const user = await Users.create(email, passwordHash, 'user', false);

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                approved: user.approved
            },
            session: null // Require approval before login
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Users.getByEmail(email);
        if (!user || !verifyPassword(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check approval status
        if (!user.approved && !user.is_root) {
            return res.status(403).json({ error: 'Account is pending admin approval' });
        }

        // Update last login
        await Users.updateLastLogin(user.id);

        // Create JWT token
        const token = createToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                approved: user.approved
            },
            session: {
                access_token: token,
                token_type: 'bearer'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    const user = await Users.getById(req.user.id);
    res.json({ user });
});

app.get('/api/auth/config', (req, res) => {
    res.json({ hCaptchaSiteKey: null }); // No captcha for local auth
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
            author: req.user.email,
            author_id: req.user.id,
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
// API Routes - Attachments (Local Storage)
// ==========================================

const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

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
        const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        // Write file to local storage
        fs.writeFileSync(filePath, req.file.buffer);

        // Generate URL
        const fileUrl = `/uploads/${fileName}`;

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
// API Routes - Images (Local Storage for inline images)
// ==========================================

const imageMemoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
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
        const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        // Write file to local storage
        fs.writeFileSync(filePath, req.file.buffer);

        // Generate URL
        const fileUrl = `/uploads/${fileName}`;

        res.status(201).json({
            url: fileUrl,
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
        const users = await Users.getAll();
        res.json(users);
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user role (admin only)
app.put('/api/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = parseInt(req.params.id, 10);

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
        }

        // Prevent admin from demoting themselves
        if (userId === req.user.id && role !== 'admin') {
            return res.status(400).json({ error: 'You cannot remove your own admin privileges' });
        }

        // Check if target is root user
        const targetUser = await Users.getById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (targetUser.is_root) {
            return res.status(403).json({ error: 'Cannot modify the root user role' });
        }

        const updated = await Users.updateRole(userId, role);
        res.json(updated);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve user (admin only)
app.put('/api/users/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { approved } = req.body;

        if (typeof approved !== 'boolean') {
            return res.status(400).json({ error: 'Approved status must be a boolean' });
        }

        const updated = await Users.updateApproved(userId, approved);
        if (!updated) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updated);
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete yourself' });
        }

        await Users.delete(userId);
        res.json({ success: true });
    } catch (error) {
        if (error.message === 'Cannot delete root user') {
            return res.status(403).json({ error: error.message });
        }
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
