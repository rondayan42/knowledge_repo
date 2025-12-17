/* ==========================================
   Knowledge Repository - API Client
   Handles communication with the backend server
   ========================================== */

// If we are on localhost but NOT on port 3000 (e.g. Live Server), use explicit localhost:3000
// Otherwise (production OR localhost:3000), use relative path
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000'
    ? 'http://localhost:3000/api'
    : '/api';

// Check if server is available
let useAPI = false;

async function checkServerAvailability() {
    try {
        const response = await fetch(`${API_BASE}/categories`, { method: 'GET' });
        useAPI = response.ok;
        console.log(useAPI ? '[API] Connected to server API' : '[LOCAL] Using localStorage fallback');
        return useAPI;
    } catch (error) {
        useAPI = false;
        console.log('[LOCAL] Server not available, using localStorage fallback');
        return false;
    }
}

// ==========================================
// Supabase Session Management
// ==========================================

// Get current session from Supabase client (if available)
function getSupabaseSession() {
    if (window.supabaseClient) {
        return window.supabaseClient.auth.getSession();
    }
    return null;
}

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    // Get token from localStorage (set by Supabase client)
    const sessionData = localStorage.getItem('sb-session');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
        } catch (e) {
            // Ignore parse errors
        }
    }
    return headers;
}

// ==========================================
// API Functions
// ==========================================

const API = {
    // Session management
    setSession(session) {
        if (session) {
            localStorage.setItem('sb-session', JSON.stringify(session));
        } else {
            localStorage.removeItem('sb-session');
        }
    },

    getSession() {
        const sessionData = localStorage.getItem('sb-session');
        if (sessionData) {
            try {
                return JSON.parse(sessionData);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    async register(email, password) {
        if (!useAPI) return { error: 'Server not available' };
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Registration failed');
        }
        const data = await res.json();
        if (data.session) {
            this.setSession(data.session);
        }
        return data;
    },

    async login(email, password) {
        if (!useAPI) return { error: 'Server not available' };
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Login failed');
        }
        const data = await res.json();
        if (data.session) {
            this.setSession(data.session);
        }
        return data;
    },

    async logout() {
        this.setSession(null);
    },

    async getMe() {
        if (!useAPI) return null;
        const session = this.getSession();
        if (!session?.access_token) return null;

        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: getAuthHeaders()
        });
        if (res.ok) return res.json();
        return null;
    },

    // Categories
    async getCategories() {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/categories`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },

    async createCategory(name, description) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to create category');
        }
        return res.json();
    },

    async deleteCategory(id) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to delete category');
        }
        return res.json();
    },

    // Departments
    async getDepartments() {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/departments`);
        if (!res.ok) throw new Error('Failed to fetch departments');
        return res.json();
    },

    async createDepartment(name, description) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/departments`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to create department');
        }
        return res.json();
    },

    async deleteDepartment(id) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to delete department');
        }
        return res.json();
    },

    // Priorities
    async getPriorities() {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/priorities`);
        if (!res.ok) throw new Error('Failed to fetch priorities');
        return res.json();
    },

    async createPriority(name, level, color) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/priorities`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, level, color })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to create priority');
        }
        return res.json();
    },

    async deletePriority(id) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/priorities/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to delete priority');
        }
        return res.json();
    },

    // Articles
    async getArticles(filters = {}) {
        if (!useAPI) return null;
        const params = new URLSearchParams();
        if (filters.category_id) params.append('category_id', filters.category_id);
        if (filters.department_id) params.append('department_id', filters.department_id);
        if (filters.priority_id) params.append('priority_id', filters.priority_id);

        const res = await fetch(`${API_BASE}/articles?${params}`);
        if (!res.ok) throw new Error('Failed to fetch articles');
        return res.json();
    },

    async uploadAttachment(file) {
        if (!useAPI) return null;
        const form = new FormData();
        form.append('file', file);

        // Get auth token for upload
        const headers = {};
        const sessionData = localStorage.getItem('sb-session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`;
                }
            } catch (e) { /* ignore */ }
        }

        const res = await fetch(`${API_BASE}/attachments`, {
            method: 'POST',
            headers,
            body: form
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Upload failed');
        }
        return res.json();
    },

    async uploadImage(file) {
        if (!useAPI) return null;
        const form = new FormData();
        form.append('file', file);

        // Get auth token for upload
        const headers = {};
        const sessionData = localStorage.getItem('sb-session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`;
                }
            } catch (e) { /* ignore */ }
        }

        const res = await fetch(`${API_BASE}/images`, {
            method: 'POST',
            headers,
            body: form
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Image upload failed');
        }

        return res.json();
    },

    async getArticle(id) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/articles/${id}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to fetch article');
        }
        return res.json();
    },

    async createArticle(data) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/articles`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to create article');
        }
        return res.json();
    },

    async updateArticle(id, data) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/articles/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to update article');
        }
        return res.json();
    },

    async deleteArticle(id) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/articles/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to delete article');
        }
        return res.json();
    },

    async searchArticles(query) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/articles/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        return res.json();
    },

    async getStats() {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/articles/stats`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    },

    // User Management (Admin Only)
    async getUsers() {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/users`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to fetch users');
        }
        return res.json();
    },

    async updateUserRole(userId, role) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/users/${userId}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to update user role');
        }
        return res.json();
    },

    async approveUser(userId, approved) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/users/${userId}/approve`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ approved })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to update user approval status');
        }
        return res.json();
    },

    async deleteUser(userId) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to delete user');
        }
        return res.json();
    },

    // Favorites
    async getFavorites() {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/favorites`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to fetch favorites');
        }
        return res.json();
    },

    async addFavorite(articleId) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/favorites/${articleId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to add favorite');
        }
        return res.json();
    },

    async removeFavorite(articleId) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/favorites/${articleId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to remove favorite');
        }
        return res.json();
    },

    // Recently Viewed
    async getRecentlyViewed() {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/recently-viewed`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to fetch recently viewed');
        }
        return res.json();
    },

    async addRecentlyViewed(articleId) {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/recently-viewed/${articleId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to add recently viewed');
        }
        return res.json();
    },

    async clearRecentlyViewed() {
        if (!useAPI) return null;
        const res = await fetch(`${API_BASE}/recently-viewed`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to clear recently viewed');
        }
        return res.json();
    }
};

// Export for use
window.API = API;
window.checkServerAvailability = checkServerAvailability;
window.isUsingAPI = () => useAPI;
