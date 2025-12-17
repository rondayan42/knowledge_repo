/* ==========================================
   Search Autocomplete Module
   Suggest articles as user types in search
   ========================================== */

import { state } from './state.js';
import { escapeHtml } from './utils.js';

/**
 * Initialize search autocomplete
 */
export function initSearchAutocomplete() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('blur', () => {
        setTimeout(() => hideAutocomplete(), 200);
    });
}

/**
 * Handle search input and show suggestions
 */
function handleSearchInput(e) {
    const query = e.target.value.toLowerCase().trim();
    const dropdown = document.getElementById('search-autocomplete');

    if (!query || query.length < 2) {
        dropdown.innerHTML = '';
        return;
    }

    const matches = state.articles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
    ).slice(0, 8);  // Limit to 8 results

    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-item no-results">אין תוצאות</div>';
        return;
    }

    dropdown.innerHTML = matches.map(article => {
        const snippet = getSnippet(article, query);
        const highlighted = highlightMatch(snippet, query);

        return `
        <div class="autocomplete-item" onclick="viewArticle('${article.id}'); document.getElementById('search-input').value = ''; document.getElementById('search-autocomplete').innerHTML = '';">
            <div class="autocomplete-title">${highlightMatch(escapeHtml(article.title), query)}</div>
            <div class="autocomplete-snippet">${highlighted}</div>
            <div class="autocomplete-meta">${escapeHtml(article.category)} • ${escapeHtml(article.department)}</div>
        </div>
    `}).join('');
}

/**
 * Get snippet from article
 */
function getSnippet(article, query) {
    const snippetLength = 80;

    // If query in summary, use that
    if (article.summary && article.summary.toLowerCase().includes(query)) {
        return article.summary.substring(0, snippetLength) + (article.summary.length > snippetLength ? '...' : '');
    }

    // Otherwise, extract from content
    const textContent = article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const index = textContent.toLowerCase().indexOf(query);

    if (index !== -1) {
        const start = Math.max(0, index - 40);
        const end = Math.min(textContent.length, index + query.length + 40);
        let snippet = textContent.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < textContent.length) snippet = snippet + '...';
        return snippet;
    }

    return article.summary || '';
}

/**
 * Highlight query matches in text
 */
function highlightMatch(text, query) {
    if (!text || !query) return escapeHtml(text || '');

    const escapedText = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapedText.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape regex special characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Hide autocomplete dropdown
 */
function hideAutocomplete() {
    const dropdown = document.getElementById('search-autocomplete');
    if (dropdown) dropdown.innerHTML = '';
}

/**
 * Export functions to window for inline handlers
 */
export function initAutocompleteGlobals() {
    window.handleSearchInput = handleSearchInput;
    window.hideAutocomplete = hideAutocomplete;
}
