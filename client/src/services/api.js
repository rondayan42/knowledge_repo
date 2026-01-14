/* ==========================================
   Knowledge Repository - API Client (React)
   Handles communication with the Flask backend
   ========================================== */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Create axios instance with defaults
const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Session management
const SESSION_KEY = 'sb-session';

export const getSession = () => {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch {
        return null;
    }
};

export const setSession = (session) => {
    if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
};

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const storedData = getSession();
        // The session is stored as { user, session: { access_token } }
        const token = storedData?.session?.access_token || storedData?.access_token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
// NOTE: We do NOT redirect on 401 here - let components handle auth errors
// This prevents unnecessary redirects when the user is still logged in but
// a specific endpoint fails
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Only clear session on 401, but don't redirect - let ProtectedRoute handle that
        if (error.response?.status === 401) {
            // Don't clear session or redirect - let the AuthContext check handle this
            console.warn('API returned 401 for:', error.config?.url);
        }
        return Promise.reject(error.response?.data || error);
    }
);

// ==========================================
// Auth API
// ==========================================

export const authAPI = {
    register: (email, password) =>
        api.post('/auth/register', { email, password }),

    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    logout: () => {
        setSession(null);
        return Promise.resolve();
    },

    getMe: () => api.get('/auth/me'),
};

// ==========================================
// Categories API
// ==========================================

export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    create: (name, description) =>
        api.post('/categories', { name, description }),
    delete: (id) => api.delete(`/categories/${id}`),
};

// ==========================================
// Departments API
// ==========================================

export const departmentsAPI = {
    getAll: () => api.get('/departments'),
    create: (name, description) =>
        api.post('/departments', { name, description }),
    delete: (id) => api.delete(`/departments/${id}`),
};

// ==========================================
// Priorities API
// ==========================================

export const prioritiesAPI = {
    getAll: () => api.get('/priorities'),
    create: (name, level, color) =>
        api.post('/priorities', { name, level, color }),
    delete: (id) => api.delete(`/priorities/${id}`),
};

// ==========================================
// Articles API
// ==========================================

export const articlesAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return api.get(`/articles?${params.toString()}`);
    },

    getOne: (id) => api.get(`/articles/${id}`),

    create: (data) => api.post('/articles', data),

    update: (id, data) => api.put(`/articles/${id}`, data),

    delete: (id) => api.delete(`/articles/${id}`),

    search: (query) => api.get(`/articles/search?q=${encodeURIComponent(query)}`),
};

// ==========================================
// Upload API
// ==========================================

export const uploadAPI = {
    uploadAttachment: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const session = getSession();
        const response = await axios.post(`${API_BASE}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
            },
        });
        return response.data;
    },

    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const session = getSession();
        const response = await axios.post(`${API_BASE}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
            },
        });
        return response.data;
    },
};

// ==========================================
// User Management API (Admin Only)
// ==========================================

export const usersAPI = {
    getAll: () => api.get('/users'),
    updateRole: (userId, role) =>
        api.put(`/users/${userId}/role`, { role }),
    approve: (userId, approved) =>
        api.put(`/users/${userId}/approve`, { approved }),
    delete: (userId) => api.delete(`/users/${userId}`),
};

// ==========================================
// Favorites API
// ==========================================

export const favoritesAPI = {
    getAll: () => api.get('/favorites'),
    add: (articleId) => api.post(`/favorites/${articleId}`),
    remove: (articleId) => api.delete(`/favorites/${articleId}`),
};

// ==========================================
// Recently Viewed API
// ==========================================

export const recentlyViewedAPI = {
    getAll: () => api.get('/recently-viewed'),
    add: (articleId) => api.post(`/recently-viewed/${articleId}`),
    clear: () => api.delete('/recently-viewed'),
};

// ==========================================
// Stats API
// ==========================================

export const statsAPI = {
    getStats: () => api.get('/stats'),
};

// Default export with all APIs
export default {
    auth: authAPI,
    categories: categoriesAPI,
    departments: departmentsAPI,
    priorities: prioritiesAPI,
    articles: articlesAPI,
    upload: uploadAPI,
    users: usersAPI,
    favorites: favoritesAPI,
    recentlyViewed: recentlyViewedAPI,
    stats: statsAPI,
    getSession,
    setSession,
};
