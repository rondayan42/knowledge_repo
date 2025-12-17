/* ==========================================
   Storage Module
   LocalStorage persistence functions
   ========================================== */

import { STORAGE_KEYS, state } from './state.js';

/**
 * Save articles to localStorage
 */
export function saveArticles() {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(state.articles));
}

/**
 * Save categories to localStorage
 */
export function saveCategories() {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
}

/**
 * Save departments to localStorage
 */
export function saveDepartments() {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(state.departments));
}

/**
 * Save priorities to localStorage
 */
export function savePriorities() {
    localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(state.priorities));
}

/**
 * Load articles from localStorage
 */
export function loadArticles() {
    const stored = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    return stored ? JSON.parse(stored) : null;
}

/**
 * Load categories from localStorage
 */
export function loadCategories() {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return stored ? JSON.parse(stored) : null;
}

/**
 * Load departments from localStorage
 */
export function loadDepartments() {
    const stored = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    return stored ? JSON.parse(stored) : null;
}

/**
 * Load priorities from localStorage
 */
export function loadPriorities() {
    const stored = localStorage.getItem(STORAGE_KEYS.PRIORITIES);
    return stored ? JSON.parse(stored) : null;
}
