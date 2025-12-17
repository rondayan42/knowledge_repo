/* ==========================================
   Favorites Module
   Handle favoriting/unfavoriting articles
   ========================================== */

import { state, setUserFavorites } from './state.js';
import { showToast, escapeHtml, formatDate } from './utils.js';
import { renderArticles } from './articles.js';

/**
 * Load user favorites from API
 */
export async function loadFavorites() {
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        try {
            const favorites = await API.getFavorites();
            // Ensure IDs are strings to match state
            const stringFavorites = (favorites || []).map(id => String(id));
            setUserFavorites(stringFavorites);
        } catch (error) {
            console.error('Error loading favorites:', error);
            setUserFavorites([]);
        }
    } else {
        // localStorage fallback
        const storedFavorites = localStorage.getItem('kb_favorites');
        if (storedFavorites) {
            try {
                const parsed = JSON.parse(storedFavorites);
                setUserFavorites(parsed.map(id => String(id)));
            } catch (e) {
                setUserFavorites([]);
            }
        } else {
            setUserFavorites([]);
        }
    }
}

/**
 * Toggle favorite status for an article
 */
export async function toggleFavorite(articleId, event) {
    if (event) {
        event.stopPropagation(); // Prevent card click
    }

    // Ensure ID is string
    const id = String(articleId);
    const currentlyFavorited = state.userFavorites.includes(id);

    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        try {
            if (currentlyFavorited) {
                await API.removeFavorite(id);
                setUserFavorites(state.userFavorites.filter(favId => favId !== id));
                showToast('הוסר מהמועדפים', 'success');
            } else {
                await API.addFavorite(id);
                setUserFavorites([...state.userFavorites, id]);
                showToast('נוסף למועדפים', 'success');
            }

            // Update the heart icon without re-rendering entire list
            updateHeartIcon(id, !currentlyFavorited);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast('שגיאה בעדכון מועדפים', 'error');
        }
    } else {
        // localStorage fallback
        if (currentlyFavorited) {
            setUserFavorites(state.userFavorites.filter(favId => favId !== id));
            showToast('הוסר מהמועדפים', 'success');
        } else {
            setUserFavorites([...state.userFavorites, id]);
            showToast('נוסף למועדפים', 'success');
        }
        localStorage.setItem('kb_favorites', JSON.stringify(state.userFavorites));
        updateHeartIcon(id, !currentlyFavorited);
    }
}

/**
 * Update heart icon visual state
 */
function updateHeartIcon(articleId, isFavorited) {
    const id = String(articleId);
    // Select heart icons in article cards and in article detail view
    const heartIcons = document.querySelectorAll(`[data-article-id="${id}"] .favorite-heart`);
    heartIcons.forEach(icon => {
        if (isFavorited) {
            icon.classList.add('favorited');
            icon.innerHTML = '<i class="fa-solid fa-heart"></i>';
            icon.title = 'הסר ממועדפים';
        } else {
            icon.classList.remove('favorited');
            icon.innerHTML = '<i class="fa-regular fa-heart"></i>';
            icon.title = 'הוסף למועדפים';
        }
    });
}

/**
 * Show favorites view
 */
export function showFavoritesView() {
    const favoritedArticles = state.articles.filter(article =>
        state.userFavorites.includes(article.id)
    );

    const container = document.getElementById('favorites-list');
    if (!container) return;

    if (favoritedArticles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-heart-crack"></i></div>
                <h3>אין מאמרים מועדפים</h3>
                <p>לחץ על סמל הלב במאמר כדי להוסיף אותו למועדפים</p>
            </div>
        `;
        return;
    }

    // Render the favorited articles using the same article rendering function
    container.innerHTML = favoritedArticles.map(article => {
        const favorited = isFavorited(article.id);
        const heartIconClass = favorited ? 'fa-solid' : 'fa-regular';
        const favoritedClass = favorited ? 'favorited' : '';

        return `
        <div class="article-card" data-article-id="${article.id}" onclick="viewArticle('${article.id}')">
            <button class="favorite-heart ${favoritedClass}" onclick="toggleFavorite('${article.id}', event)" title="${favorited ? 'הסר ממועדפים' : 'הוסף למועדפים'}">
                <i class="${heartIconClass} fa-heart"></i>
            </button>
            <div class="article-card-header">
                <h3>${escapeHtml(article.title)}</h3>
                <div class="article-meta">
                    <span><i class="fa-solid fa-folder"></i> ${escapeHtml(article.category)}</span>
                    <span><i class="fa-solid fa-building"></i> ${escapeHtml(article.department)}</span>
                    ${article.attachments && article.attachments.length > 0 ? `<span><i class="fa-solid fa-paperclip"></i> ${article.attachments.length} קבצים</span>` : ''}
                </div>
            </div>
            <div class="article-card-body">
                <p class="article-summary">${escapeHtml(article.summary || 'אין תקציר')}</p>
                <div class="article-tags">
                    <span class="tag category">${escapeHtml(article.category)}</span>
                    <span class="tag department">${escapeHtml(article.department)}</span>
                    ${(() => {
                const priObj = state.dbPriorities.find(p => p.name === article.priority);
                const color = priObj && priObj.color ? priObj.color : null;
                const style = color ? `style="background-color: ${color}; border-color: ${color}; color: #fff;"` : '';
                return `<span class="tag priority" ${style}>${escapeHtml(article.priority)}</span>`;
            })()}
                    ${article.customTags ? article.customTags.map(tag =>
                `<span class="tag">${escapeHtml(tag)}</span>`
            ).join('') : ''}
                </div>
            </div>
            <div class="article-card-footer">
                <span class="article-date">עודכן: ${formatDate(article.updatedAt)}</span>
                <div class="article-actions">
                    ${(state.currentUser && (state.currentUser.role === 'admin' || article.author_id === state.currentUser.id)) ?
                `<button class="btn-edit" onclick="event.stopPropagation(); editArticle('${article.id}')">עריכה</button>` : ''}
                    <button class="btn-view" onclick="event.stopPropagation(); viewArticle('${article.id}')">צפייה</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

/**
 * Check if article is favorited
 */
export function isFavorited(articleId) {
    return state.userFavorites.includes(articleId);
}

// Export to window for inline handlers
export function initFavoritesGlobals() {
    window.toggleFavorite = toggleFavorite;
    window.showFavoritesView = showFavoritesView;
}
