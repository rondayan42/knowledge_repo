/* ==========================================
   State Management Module
   Central state and configuration for the app
   ========================================== */

// Storage keys for localStorage
export const STORAGE_KEYS = {
    ARTICLES: 'bsmart_articles',
    CATEGORIES: 'bsmart_categories',
    DEPARTMENTS: 'bsmart_departments',
    PRIORITIES: 'bsmart_priorities'
};

// Default data
export const DEFAULT_CATEGORIES = ['הדרכה', 'נהלים', 'טכני', 'שירות לקוחות', 'מכירות', 'כללי'];
export const DEFAULT_DEPARTMENTS = ['תפעול', 'פיתוח', 'שיווק', 'משאבי אנוש', 'הנהלה', 'תמיכה טכנית'];
export const DEFAULT_PRIORITIES = ['גבוהה', 'בינונית', 'נמוכה', 'דחוף'];

// Application state - using a state object for better encapsulation
export const state = {
    articles: [],
    categories: [],
    departments: [],
    priorities: [],
    currentCustomTags: [],
    currentAttachments: [],
    uploadsInProgress: 0,

    // Database mode state (for API)
    dbCategories: [],
    dbDepartments: [],
    dbDepartments: [],
    dbPriorities: [],

    // Auth state
    currentUser: null,

    // Favorites
    userFavorites: []  // Array of article IDs that user has favorited
};

// State setters for controlled mutations
export function setArticles(newArticles) {
    state.articles = newArticles;
}

export function setCategories(newCategories) {
    state.categories = newCategories;
}

export function setDepartments(newDepartments) {
    state.departments = newDepartments;
}

export function setPriorities(newPriorities) {
    state.priorities = newPriorities;
}

export function setCurrentCustomTags(tags) {
    state.currentCustomTags = tags;
}

export function setCurrentAttachments(attachments) {
    state.currentAttachments = attachments;
}

export function setUploadsInProgress(count) {
    state.uploadsInProgress = count;
}

export function setDbCategories(cats) {
    state.dbCategories = cats;
}

export function setDbDepartments(deps) {
    state.dbDepartments = deps;
}

export function setDbPriorities(pris) {
    state.dbPriorities = pris;
}

export function setUserFavorites(favorites) {
    state.userFavorites = favorites;
}
