/* ==========================================
   Knowledge Repository - Main Entry Point
   Initializes all modules and sets up the application
   ========================================== */

// Import all modules
import {
    state,
    STORAGE_KEYS,
    DEFAULT_CATEGORIES,
    DEFAULT_DEPARTMENTS,
    DEFAULT_PRIORITIES,
    setArticles,
    setCategories,
    setDepartments,
    setPriorities,
    setDbCategories,
    setDbDepartments,
    setDbPriorities
} from './state.js';

import {
    saveArticles,
    saveCategories,
    saveDepartments,
    savePriorities,
    loadArticles,
    loadCategories,
    loadDepartments,
    loadPriorities
} from './storage.js';

import { debounce } from './utils.js';

import { showView } from './views.js';

import {
    renderArticles,
    filterArticles,
    handleArticleSubmit,
    getSampleArticles,
    initArticlesGlobals,
    viewArticle
} from './articles.js';

import {
    renderTagsManager,
    populateDropdowns,
    addCustomTag,
    initTagsGlobals
} from './tags.js';

import { initEditorGlobals, updatePreview } from './editor.js';

import { initFileUpload, initAttachmentsGlobals } from './attachments.js';

import { initFileImport, initImporterGlobals } from './importer.js';

import { initSearchAutocomplete, initAutocompleteGlobals } from './autocomplete.js';

import { initThemeToggle, initScrollToTop, updateConnectionStatus } from './theme.js';

import { renderProfile, initProfileGlobals } from './profile.js';

import { loadFavorites, initFavoritesGlobals } from './favorites.js';

import { initDrafts, initDraftsGlobals } from './drafts.js';

import { renderRecentlyViewed, initRecentlyViewedGlobals } from './recently-viewed.js';

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check if server API is available
    if (typeof checkServerAvailability === 'function') {
        await checkServerAvailability();
    }

    await initializeData();
    setupEventListeners();
    initializeGlobals();
    renderTagsManager();
    populateDropdowns();
    filterArticles();
    populateDropdowns();
    filterArticles();
    updateConnectionStatus();

    // Check Auth
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        const session = API.getSession();
        if (!session?.access_token) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const userData = await API.getMe();
            if (userData && userData.user) {
                state.currentUser = userData.user;
                updateUserUI(userData.user);
                // Load user favorites
                await loadFavorites();
                // Re-render articles now that we know the current user
                filterArticles();
            } else {
                API.setSession(null);
                window.location.href = 'login.html';
                return;
            }
        } catch (e) {
            console.error('Auth check failed', e);
            // Optional: redirect to login or show error
        }
    }

    initThemeToggle();
    initScrollToTop();
    initFileUpload();
    initFileImport();
    initSearchAutocomplete();
    initDrafts();

    // Check for direct article link
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    if (articleId) {
        viewArticle(articleId, false);
    }
});

/**
 * Initialize all global window functions for inline handlers
 */
function initializeGlobals() {
    // Articles
    initArticlesGlobals();

    // Tags
    initTagsGlobals();

    // Editor
    initEditorGlobals();

    // Attachments
    initAttachmentsGlobals();

    // Importer
    initImporterGlobals();

    // Autocomplete
    initAutocompleteGlobals();

    // Profile
    initProfileGlobals();

    // Favorites
    initFavoritesGlobals();

    // Drafts
    initDraftsGlobals();

    // Recently Viewed
    initRecentlyViewedGlobals();

    // Views
    window.showView = showView;

    // Auth
    window.logout = async () => {
        await API.logout();
        window.location.href = 'login.html';
    };

    // Expose initializeFromAPI for other modules
    window.initializeFromAPI = initializeFromAPI;
}

/**
 * Initialize data from API or localStorage
 */
async function initializeData() {
    // Check if we should use API
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        await initializeFromAPI();
    } else {
        initializeFromLocalStorage();
    }
}

/**
 * Initialize data from API
 */
async function initializeFromAPI() {
    try {
        // Load from API
        const [apiCategories, apiDepartments, apiPriorities, apiArticles] = await Promise.all([
            API.getCategories(),
            API.getDepartments(),
            API.getPriorities(),
            API.getArticles()
        ]);

        setDbCategories(apiCategories || []);
        setDbDepartments(apiDepartments || []);
        setDbPriorities(apiPriorities || []);

        // Map to string arrays for UI compatibility
        setCategories(state.dbCategories.map(c => c.name));
        setDepartments(state.dbDepartments.map(d => d.name));
        setPriorities(state.dbPriorities.map(p => p.name));

        // Map articles to UI format
        const mappedArticles = (apiArticles || []).map(a => ({
            id: String(a.id),
            title: a.title,
            summary: a.summary,
            content: a.content,
            category: a.category_name,
            department: a.department_name,
            priority: a.priority_name,
            priorityLevel: a.priority_level,
            customTags: a.tags ? a.tags.map(t => t.name) : [],
            attachments: a.attachments ? a.attachments.map(att => ({
                id: String(att.id),
                name: att.file_name,
                size: att.size,
                url: att.url,
                mime_type: att.mime_type
            })) : [],
            createdAt: a.created_at,
            updatedAt: a.updated_at,
            views: a.views,
            author: a.author,
            author_id: a.author_id,
            // Keep DB IDs for updates
            _category_id: a.category_id,
            _department_id: a.department_id,
            _priority_id: a.priority_id
        }));

        setArticles(mappedArticles);

        console.log('Data loaded from API');
    } catch (error) {
        console.error('Error loading from API:', error);
        initializeFromLocalStorage();
    }
}

/**
 * Initialize data from localStorage
 */
function initializeFromLocalStorage() {
    // Load or initialize articles
    const storedArticles = loadArticles();
    setArticles(storedArticles || getSampleArticles());

    // Load or initialize categories
    const storedCategories = loadCategories();
    setCategories(storedCategories || [...DEFAULT_CATEGORIES]);

    // Load or initialize departments
    const storedDepartments = loadDepartments();
    setDepartments(storedDepartments || [...DEFAULT_DEPARTMENTS]);

    // Load or initialize priorities
    const storedPriorities = loadPriorities();
    setPriorities(storedPriorities || [...DEFAULT_PRIORITIES]);

    // Save if using defaults
    if (!storedArticles) saveArticles();
    if (!storedCategories) saveCategories();
    if (!storedDepartments) saveDepartments();
    if (!storedPriorities) savePriorities();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;

            // Clear article param when using main navigation
            const url = new URL(window.location);
            if (url.searchParams.has('article')) {
                url.searchParams.delete('article');
                window.history.pushState({}, '', url);
            }

            showView(view);

            // Update active state
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('article');

        if (articleId) {
            viewArticle(articleId, false);
        } else {
            showView('articles');
        }
    });

    // Logo click handling - Security fix
    const logoSection = document.querySelector('.logo-section');
    if (logoSection) {
        logoSection.style.cursor = 'pointer';
        logoSection.addEventListener('click', (e) => {
            // Check authentication
            if (!state.currentUser) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'login.html';
                return;
            }
            // If logged in, go to home/articles view
            showView('articles');
        });
    }

    // Article form
    const articleForm = document.getElementById('article-form');
    if (articleForm) {
        articleForm.addEventListener('submit', handleArticleSubmit);
    }

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterArticles, 300));
    }

    // Filter dropdowns
    const filterCategory = document.getElementById('filter-category');
    const filterDepartment = document.getElementById('filter-department');
    const filterPriority = document.getElementById('filter-priority');
    const sortArticles = document.getElementById('sort-articles');

    if (filterCategory) filterCategory.addEventListener('change', filterArticles);
    if (filterDepartment) filterDepartment.addEventListener('change', filterArticles);
    if (filterPriority) filterPriority.addEventListener('change', filterArticles);
    if (sortArticles) sortArticles.addEventListener('change', filterArticles);

    // Custom tag input - Enter key
    const customTagInput = document.getElementById('custom-tag-input');
    if (customTagInput) {
        customTagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomTag();
            }
        });
    }

    // Real-time preview update
    const articleContent = document.getElementById('article-content');
    const previewPanel = document.getElementById('preview-panel');
    if (articleContent && previewPanel) {
        articleContent.addEventListener('input', debounce(() => {
            // Only update if preview is visible
            if (previewPanel.style.display !== 'none' && typeof updatePreview === 'function') {
                updatePreview();
            }
        }, 300));
    }
}

function updateUserUI(user) {
    const userSection = document.getElementById('user-section');
    const userName = document.getElementById('user-name');
    if (userSection && userName) {
        userSection.classList.add('visible');
        // Use email for Supabase auth (fallback to username for compatibility)
        userName.textContent = `שלום, ${user.email || user.username}`;
    }
}
