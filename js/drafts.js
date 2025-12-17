/* ==========================================
   Draft Auto-Save Module
   Automatically saves editor drafts to localStorage
   ========================================== */

import { showToast } from './utils.js';

const DRAFT_KEY = 'kb_article_draft';
const DRAFT_TIMESTAMP_KEY = 'kb_draft_timestamp';
const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

let autoSaveTimer = null;
let lastSaveTime = null;

/**
 * Save current editor state as draft
 */
export function saveDraft() {
    try {
        const title = document.getElementById('article-title')?.value || '';
        const summary = document.getElementById('article-summary')?.value || '';
        const content = document.getElementById('article-content')?.innerHTML || '';
        const category = document.getElementById('article-category')?.value || '';
        const department = document.getElementById('article-department')?.value || '';
        const priority = document.getElementById('article-priority')?.value || '';

        // Don't save if all fields are empty
        if (!title && !summary && !content) {
            return;
        }

        const draft = {
            title,
            summary,
            content,
            category,
            department,
            priority,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        localStorage.setItem(DRAFT_TIMESTAMP_KEY, draft.timestamp);

        lastSaveTime = new Date();
        updateDraftIndicator();

        console.log('Draft auto-saved');
    } catch (error) {
        console.error('Error saving draft:', error);
    }
}

/**
 * Load draft from localStorage
 */
export function loadDraft() {
    try {
        const draftJson = localStorage.getItem(DRAFT_KEY);
        if (!draftJson) return null;

        return JSON.parse(draftJson);
    } catch (error) {
        console.error('Error loading draft:', error);
        return null;
    }
}

/**
 * Check if a draft exists
 */
export function hasDraft() {
    const draft = loadDraft();
    return draft !== null && (draft.title || draft.summary || draft.content);
}

/**
 * Clear saved draft
 */
export function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
    lastSaveTime = null;
    updateDraftIndicator();
    console.log('Draft cleared');
}

/**
 * Restore draft to editor
 */
export function restoreDraft() {
    const draft = loadDraft();
    if (!draft) {
        showToast('No draft to restore', 'info');
        return false;
    }

    try {
        const titleInput = document.getElementById('article-title');
        const summaryInput = document.getElementById('article-summary');
        const contentInput = document.getElementById('article-content');
        const categorySelect = document.getElementById('article-category');
        const departmentSelect = document.getElementById('article-department');
        const prioritySelect = document.getElementById('article-priority');

        if (titleInput) titleInput.value = draft.title || '';
        if (summaryInput) summaryInput.value = draft.summary || '';
        if (contentInput) contentInput.innerHTML = draft.content || '';
        if (categorySelect) categorySelect.value = draft.category || '';
        if (departmentSelect) departmentSelect.value = draft.department || '';
        if (prioritySelect) prioritySelect.value = draft.priority || '';

        showToast('Draft restored', 'success');
        updateDraftIndicator();
        return true;
    } catch (error) {
        console.error('Error restoring draft:', error);
        showToast('Error restoring draft', 'error');
        return false;
    }
}

/**
 * Start auto-saving
 */
export function startAutoSave() {
    // Clear any existing timer
    stopAutoSave();

    // Set up debounced auto-save on content changes
    const fields = [
        'article-title',
        'article-summary',
        'article-content',
        'article-category',
        'article-department',
        'article-priority'
    ];

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', () => {
                // Clear existing timer
                if (autoSaveTimer) {
                    clearTimeout(autoSaveTimer);
                }
                // Set new timer
                autoSaveTimer = setTimeout(() => {
                    saveDraft();
                }, AUTO_SAVE_INTERVAL);
            });
        }
    });

    console.log('Auto-save started');
}

/**
 * Stop auto-saving
 */
export function stopAutoSave() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
}

/**
 * Update draft indicator UI
 */
function updateDraftIndicator() {
    const indicator = document.getElementById('draft-indicator');
    if (!indicator) return;

    if (lastSaveTime) {
        const timeStr = lastSaveTime.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        indicator.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> טיוטה נשמרה ב-${timeStr}`;
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

/**
 * Show draft recovery modal
 */
export function showDraftRecoveryModal() {
    if (!hasDraft()) return;

    // Prevent duplicate modals
    const existingModal = document.querySelector('.draft-recovery-modal');
    if (existingModal) {
        return; // Modal already exists
    }

    const draft = loadDraft();
    const draftTime = new Date(draft.timestamp);
    const timeStr = draftTime.toLocaleString('he-IL');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay draft-recovery-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-file-circle-question"></i> טיוטה זמינה לשחזור</h3>
            </div>
            <div class="modal-body">
                <p>נמצאה טיוטה שנשמרה ב-${timeStr}</p>
                <p><strong>כותרת:</strong> ${draft.title || '(ללא כותרת)'}</p>
                <p>האם לשחזר את הטיוטה?</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" id="discard-draft-btn">מחק טיוטה</button>
                <button type="button" class="btn-primary" id="restore-draft-btn">שחזר טיוטה</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle restore - query from modal element
    const restoreBtn = modal.querySelector('#restore-draft-btn');
    const discardBtn = modal.querySelector('#discard-draft-btn');

    if (restoreBtn) {
        restoreBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            restoreDraft();
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, { once: true });
    }

    if (discardBtn) {
        discardBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            clearDraft();
            showToast('הטיוטה נמחקה', 'info');
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, { once: true });
    }

    // Close modal if clicking on overlay (not the content)
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }
    });
}

/**
 * Initialize draft system
 */
export function initDrafts() {
    // Check for existing draft when editor view is shown
    const editorView = document.getElementById('editor-view');
    if (editorView) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (editorView.classList.contains('active')) {
                        // Check if we're creating a new article (not editing)
                        const articleId = document.getElementById('article-id')?.value;
                        if (!articleId && hasDraft()) {
                            showDraftRecoveryModal();
                        }
                        startAutoSave();
                    }
                }
            });
        });

        observer.observe(editorView, { attributes: true });
    }

    // Start auto-save if editor is already active
    if (editorView?.classList.contains('active')) {
        startAutoSave();
    }
}

/**
 * Initialize globals for inline handlers
 */
export function initDraftsGlobals() {
    window.restoreDraft = restoreDraft;
    window.clearDraft = clearDraft;
    window.saveDraft = saveDraft;
}
