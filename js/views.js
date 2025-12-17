/* ==========================================
   Views Module
   View switching and navigation
   ========================================== */

import { renderArticles, filterArticles } from './articles.js';
import { renderTagsManager, populateDropdowns } from './tags.js';
import { renderProfile } from './profile.js';
import { initEditorKeyboardShortcuts } from './editor.js';
import { showFavoritesView } from './favorites.js';
import { renderRecentlyViewed } from './recently-viewed.js';

/**
 * Show a specific view and hide others
 */
export function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

    // Show requested view
    const view = document.getElementById(`${viewName}-view`);
    if (view) {
        view.classList.add('active');
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Refresh content if needed
    if (viewName === 'articles') {
        filterArticles();
    } else if (viewName === 'favorites') {
        showFavoritesView();
    } else if (viewName === 'recently-viewed') {
        renderRecentlyViewed();
    } else if (viewName === 'manage-tags') {
        renderTagsManager();
    } else if (viewName === 'editor') {
        populateDropdowns();
        // Initialize keyboard shortcuts when editor is shown
        initEditorKeyboardShortcuts();
    } else if (viewName === 'profile') {
        renderProfile();
    }
}
