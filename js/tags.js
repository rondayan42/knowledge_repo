/* ==========================================
   Tags Management Module
   Categories, departments, priorities CRUD
   ========================================== */

import { state, setCategories, setDepartments, setPriorities, setCurrentCustomTags } from './state.js';
import { saveCategories, saveDepartments, savePriorities } from './storage.js';
import { escapeHtml, showToast } from './utils.js';

/**
 * Render the tags manager view
 */
export function renderTagsManager() {
    // Categories
    const categoriesList = document.getElementById('categories-list');
    if (categoriesList) {
        categoriesList.innerHTML = state.categories.map(cat => `
            <li>
                <span>${escapeHtml(cat)}</span>
                <button class="btn-delete-tag" onclick="removeTag('category', '${escapeHtml(cat)}')" title="מחק"><i class="fa-solid fa-xmark"></i></button>
            </li>
        `).join('');
    }

    // Departments
    const departmentsList = document.getElementById('departments-list');
    if (departmentsList) {
        departmentsList.innerHTML = state.departments.map(dep => `
            <li>
                <span>${escapeHtml(dep)}</span>
                <button class="btn-delete-tag" onclick="removeTag('department', '${escapeHtml(dep)}')" title="מחק"><i class="fa-solid fa-xmark"></i></button>
            </li>
        `).join('');
    }

    // Priorities
    const prioritiesList = document.getElementById('priorities-list');
    if (prioritiesList) {
        prioritiesList.innerHTML = state.priorities.map(pri => {
            // Find color if available (from DB objects)
            const priObj = state.dbPriorities.find(p => p.name === pri);
            const color = priObj && priObj.color ? priObj.color : null;
            const style = color ? `style="background-color: ${color}; border-color: ${color}; color: #fff;"` : '';

            return `
            <li>
                <span ${style}>${escapeHtml(pri)}</span>
                <button class="btn-delete-tag" onclick="removeTag('priority', '${escapeHtml(pri)}')" title="מחק"><i class="fa-solid fa-xmark"></i></button>
            </li>
        `}).join('');
    }
}

/**
 * Add a new tag (category/department/priority)
 */
export async function addTag(type) {
    const input = document.getElementById(`new-${type}`);
    const value = input.value.trim();
    let color = null;
    let level = 0;

    if (type === 'priority') {
        const colorInput = document.getElementById('new-priority-color');
        if (colorInput) color = colorInput.value;

        const levelInput = document.getElementById('new-priority-level');
        if (levelInput) level = parseInt(levelInput.value, 10);
    }

    if (!value) {
        showToast('נא להזין ערך', 'error');
        return;
    }

    // Check for duplicates
    switch (type) {
        case 'category':
            if (state.categories.includes(value)) {
                showToast('קטגוריה זו כבר קיימת', 'error');
                return;
            }
            break;
        case 'department':
            if (state.departments.includes(value)) {
                showToast('מחלקה זו כבר קיימת', 'error');
                return;
            }
            break;
        case 'priority':
            if (state.priorities.includes(value)) {
                showToast('עדיפות זו כבר קיימת', 'error');
                return;
            }
            break;
    }

    // Use API if available
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        await handleAddTagAPI(type, value, input, color, level);
        return;
    }

    // Local storage mode - modify state and save
    let saveFunc;
    switch (type) {
        case 'category':
            state.categories.push(value);
            saveFunc = saveCategories;
            break;
        case 'department':
            state.departments.push(value);
            saveFunc = saveDepartments;
            break;
        case 'priority':
            state.priorities.push(value);
            saveFunc = savePriorities;
            break;
    }

    saveFunc();
    input.value = '';
    renderTagsManager();
    populateDropdowns();
    showToast('התגית נוספה בהצלחה!', 'success');
}

/**
 * Handle adding tag via API
 */
/**
 * Handle adding tag via API
 */
async function handleAddTagAPI(type, value, input, color = null, level = 0) {
    try {
        switch (type) {
            case 'category':
                await API.createCategory(value);
                break;
            case 'department':
                await API.createDepartment(value);
                break;
            case 'priority':
                await API.createPriority(value, level, color);
                break;
        }
        // Reload from API - this will be called from init module
        if (typeof window.initializeFromAPI === 'function') {
            await window.initializeFromAPI();
        }
        input.value = '';
        renderTagsManager();
        populateDropdowns();
        showToast('התגית נוספה בהצלחה!', 'success');
    } catch (error) {
        console.error('Error adding tag:', error);
        showToast('שגיאה בהוספת התגית', 'error');
    }
}

/**
 * Remove a tag
 */
export async function removeTag(type, value) {
    // Check if tag is in use
    const inUse = state.articles.some(article => {
        switch (type) {
            case 'category': return article.category === value;
            case 'department': return article.department === value;
            case 'priority': return article.priority === value;
        }
    });

    if (inUse) {
        showToast('לא ניתן למחוק תגית שנמצאת בשימוש במאמרים', 'error');
        return;
    }

    if (!confirm(`האם למחוק את התגית "${value}"?`)) return;

    // Use API if available
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        try {
            let id;
            switch (type) {
                case 'category':
                    id = state.dbCategories.find(c => c.name === value)?.id;
                    if (id) await API.deleteCategory(id);
                    break;
                case 'department':
                    id = state.dbDepartments.find(d => d.name === value)?.id;
                    if (id) await API.deleteDepartment(id);
                    break;
                case 'priority':
                    id = state.dbPriorities.find(p => p.name === value)?.id;
                    if (id) await API.deletePriority(id);
                    break;
            }
            if (typeof window.initializeFromAPI === 'function') {
                await window.initializeFromAPI();
            }
            renderTagsManager();
            populateDropdowns();
            showToast('התגית נמחקה בהצלחה!', 'success');
        } catch (error) {
            console.error('Error removing tag:', error);
            showToast('שגיאה במחיקת התגית', 'error');
        }
        return;
    }

    switch (type) {
        case 'category':
            setCategories(state.categories.filter(c => c !== value));
            saveCategories();
            break;
        case 'department':
            setDepartments(state.departments.filter(d => d !== value));
            saveDepartments();
            break;
        case 'priority':
            setPriorities(state.priorities.filter(p => p !== value));
            savePriorities();
            break;
    }

    renderTagsManager();
    populateDropdowns();
    showToast('התגית נמחקה בהצלחה!', 'success');
}

/**
 * Populate dropdown selects with current tags
 */
export function populateDropdowns() {
    // Filter dropdowns
    populateSelect('filter-category', state.categories, true);
    populateSelect('filter-department', state.departments, true);
    populateSelect('filter-priority', state.priorities, true);

    // Editor dropdowns
    populateSelect('article-category', state.categories, false);
    populateSelect('article-department', state.departments, false);
    populateSelect('article-priority', state.priorities, false);
}

/**
 * Populate a single select element
 */
function populateSelect(selectId, options, includeAll) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = includeAll
        ? '<option value="">הכל</option>'
        : '<option value="">בחר...</option>';

    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });

    // Restore previous value if it still exists
    if (currentValue && options.includes(currentValue)) {
        select.value = currentValue;
    }
}

// ==========================================
// Custom Tags (Article-specific)
// ==========================================

/**
 * Add a custom tag to current article
 */
export function addCustomTag() {
    const input = document.getElementById('custom-tag-input');
    const value = input.value.trim();

    if (!value) return;

    if (state.currentCustomTags.includes(value)) {
        showToast('תגית זו כבר קיימת', 'error');
        return;
    }

    state.currentCustomTags.push(value);
    input.value = '';
    renderCustomTags();
}

/**
 * Remove a custom tag from current article
 */
export function removeCustomTag(tag) {
    setCurrentCustomTags(state.currentCustomTags.filter(t => t !== tag));
    renderCustomTags();
}

/**
 * Render custom tags list in editor
 */
export function renderCustomTags() {
    const container = document.getElementById('custom-tags-list');
    if (!container) return;

    container.innerHTML = state.currentCustomTags.map(tag => `
        <span class="custom-tag">
            ${escapeHtml(tag)}
            <button class="remove-tag" onclick="removeCustomTag('${escapeHtml(tag)}')" type="button"><i class="fa-solid fa-xmark"></i></button>
        </span>
    `).join('');
}




// Export to window for inline handlers
export function initTagsGlobals() {
    window.addTag = addTag;
    window.removeTag = removeTag;
    window.addCustomTag = addCustomTag;
    window.removeCustomTag = removeCustomTag;

    // Initialize priority level buttons
    initPriorityLevelButtons();
}

/**
 * Initialize priority level button interactions
 */
function initPriorityLevelButtons() {
    const buttonsContainer = document.getElementById('priority-level-buttons');
    const hiddenInput = document.getElementById('new-priority-level');

    if (!buttonsContainer || !hiddenInput) return;

    buttonsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.level-btn');
        if (!btn) return;

        // Remove active from all buttons
        buttonsContainer.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));

        // Add active to clicked button
        btn.classList.add('active');

        // Update hidden input value
        hiddenInput.value = btn.dataset.level;
    });
}
