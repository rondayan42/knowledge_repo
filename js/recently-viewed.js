/* ==========================================
   Recently Viewed Articles Module
   Track and display recently viewed articles using database
   ========================================== */

import { state } from './state.js';
import { showToast, formatDate } from './utils.js';

const MAX_RECENT_ARTICLES = 20;

/**
 * Add article to recently viewed (via API)
 */
export async function addToRecentlyViewed(articleId) {
    // Check if using API
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        try {
            await API.addRecentlyViewed(articleId);
        } catch (error) {
            console.error('Error adding to recently viewed:', error);
            // Fallback to localStorage
            addToRecentlyViewedLocal(articleId);
        }
    } else {
        // Use localStorage fallback
        addToRecentlyViewedLocal(articleId);
    }
}

/**
 * LocalStorage fallback - Add article
 */
function addToRecentlyViewedLocal(articleId) {
    try {
        const articles = state.articles || [];
        const article = articles.find(a => a.id === articleId);
        if (!article) return;

        const recent = getRecentlyViewedLocal();
        const entry = {
            id: article.id,
            title: article.title,
            category: article.category || article.category_name,
            department: article.department || article.department_name,
            viewedAt: new Date().toISOString()
        };

        // Remove if exists (to update position)
        const filtered = recent.filter(item => item.id !== articleId);

        // Add to beginning
        filtered.unshift(entry);

        // Keep only max items
        const trimmed = filtered.slice(0, MAX_RECENT_ARTICLES);

        localStorage.setItem('kb_recently_viewed', JSON.stringify(trimmed));
    } catch (error) {
        console.error('Error adding to recently viewed (local):', error);
    }
}

/**
 * Get recently viewed articles
 */
export async function getRecentlyViewed() {
    // Check if using API
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        try {
            const data = await API.getRecentlyViewed();
            return data || [];
        } catch (error) {
            console.error('Error getting recently viewed:', error);
            // Fallback to localStorage
            return getRecentlyViewedLocal();
        }
    } else {
        return getRecentlyViewedLocal();
    }
}

/**
 * LocalStorage fallback - Get articles
 */
function getRecentlyViewedLocal() {
    try {
        const stored = localStorage.getItem('kb_recently_viewed');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error getting recently viewed (local):', error);
        return [];
    }
}

/**
 * Clear recently viewed
 */
export async function clearRecentlyViewed() {
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        try {
            await API.clearRecentlyViewed();
            showToast('ההיסטוריה נמחקה', 'success');
        } catch (error) {
            console.error('Error clearing recently viewed:', error);
            showToast('שגיאה במחיקת היסטוריה', 'error');
        }
    } else {
        localStorage.removeItem('kb_recently_viewed');
        showToast('ההיסטוריה נמחקה', 'success');
    }
    // Refresh display
    renderRecentlyViewed();
}

/**
 * Render recently viewed list
 */
export async function renderRecentlyViewed() {
    const container = document.getElementById('recently-viewed-list');
    if (!container) return;

    const recentlyViewed = await getRecentlyViewed();

    if (!recentlyViewed || recentlyViewed.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <h3>אין מאמרים שנצפו לאחרונה</h3>
                <p>מאמרים שתצפה בהם יופיעו כאן</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentlyViewed.map(item => {
        const timeAgo = getTimeAgo(item.viewedAt || item.viewed_at);
        const articleId = item.id || item.article_id;

        // Find full article data from state
        const article = state.articles.find(a => String(a.id) === String(articleId)) || item;

        // Check if favorited
        const favorited = state.userFavorites && state.userFavorites.includes(String(articleId));
        const heartIconClass = favorited ? 'fa-solid' : 'fa-regular';
        const favoritedClass = favorited ? 'favorited' : '';

        return `
            <div class="article-card" data-article-id="${articleId}" onclick="viewArticle('${articleId}')">
                <button class="favorite-heart ${favoritedClass}" onclick="toggleFavorite('${articleId}', event)" title="${favorited ? 'הסר ממועדפים' : 'הוסף למועדפים'}">
                    <i class="${heartIconClass} fa-heart"></i>
                </button>
                <div class="article-card-header">
                    <h3>${escapeHtml(article.title)}</h3>
                    <div class="article-meta">
                        <span><i class="fa-solid fa-folder"></i> ${escapeHtml(article.category || article.category_name)}</span>
                        <span><i class="fa-solid fa-building"></i> ${escapeHtml(article.department || article.department_name)}</span>
                    </div>
                </div>
                <div class="article-card-body">
                    <p class="article-summary">${escapeHtml(article.summary || 'אין תקציר')}</p>
                    <div class="article-tags">
                        <span class="tag category">${escapeHtml(article.category || article.category_name)}</span>
                        <span class="tag department">${escapeHtml(article.department || article.department_name)}</span>
                        ${(() => {
                if (!article.priority) return '';
                const priObj = state.dbPriorities && state.dbPriorities.find(p => p.name === article.priority);
                const color = priObj && priObj.color ? priObj.color : null;
                const style = color ? `style="background-color: ${color}; border-color: ${color}; color: #fff;"` : '';
                return `<span class="tag priority" ${style}>${escapeHtml(article.priority)}</span>`;
            })()}
                    </div>
                </div>
                <div class="article-card-footer">
                    <div class="recently-viewed-time">
                        <i class="fa-solid fa-clock"></i>
                        <span>${timeAgo}</span>
                    </div>
                    <div class="article-actions">
                        <button class="btn-view" onclick="event.stopPropagation(); viewArticle('${articleId}')">צפייה</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Format time ago in Hebrew
 */
function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);

    if (seconds < 60) return 'עכשיו';
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        if (minutes === 1) return 'לפני דקה';
        return `לפני ${minutes} דקות`;
    }
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        if (hours === 1) return 'לפני שעה';
        if (hours === 2) return 'לפני שעתיים';
        return `לפני ${hours} שעות`;
    }
    if (seconds < 604800) {
        const days = Math.floor(seconds / 86400);
        if (days === 1) return 'לפני יום';
        if (days === 2) return 'לפני יומיים';
        return `לפני ${days} ימים`;
    }

    return formatDate(dateString);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize globals for inline handlers
 */
export function initRecentlyViewedGlobals() {
    window.clearRecentlyViewed = clearRecentlyViewed;
}
