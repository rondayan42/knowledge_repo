/* ==========================================
   Articles Module
   Article CRUD, rendering, and filtering
   ========================================== */

import { state, setArticles, setCurrentCustomTags, setCurrentAttachments } from './state.js';
import { saveArticles } from './storage.js';
import { generateId, escapeHtml, formatDate, showToast, getFileIcon, formatFileSize, addCopyButtons, highlightCodeBlocks } from './utils.js';
import { showView } from './views.js';
import { populateDropdowns, renderCustomTags } from './tags.js';
import { renderAttachments } from './attachments.js';
import { isFavorited } from './favorites.js';
import { addToRecentlyViewed } from './recently-viewed.js';
import { clearDraft } from './drafts.js';

/**
 * Render articles grid
 */
export function renderArticles(filteredArticles = null) {
    const articlesToRender = filteredArticles || state.articles;
    const container = document.getElementById('articles-list');

    if (!container) return;

    if (articlesToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-file-lines"></i></div>
                <h3>אין מאמרים להצגה</h3>
                <p>צרו את המאמר הראשון שלכם באמצעות עורך המאמרים</p>
            </div>
        `;
        return;
    }

    container.innerHTML = articlesToRender.map(article => {
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
 * View a single article
 */
/**
 * View a single article
 */
export function viewArticle(id, updateUrl = true) {
    const article = state.articles.find(a => a.id === id);
    if (!article) return;

    // Generate attachments HTML
    let attachmentsHtml = '';
    if (article.attachments && article.attachments.length > 0) {
        attachmentsHtml = `
            <div class="article-attachments">
                <h3><i class="fa-solid fa-paperclip"></i> קבצים מצורפים</h3>
                <div class="download-list">
                    ${article.attachments.map(att => `
                        <a href="${att.data || att.url}" download="${escapeHtml(att.name)}" class="download-item">
                            <span class="file-icon">${getFileIcon(att.name)}</span>
                            <div class="file-info">
                                <span class="file-name">${escapeHtml(att.name)}</span>
                                <span class="file-size">${formatFileSize(att.size)}</span>
                            </div>
                            <span class="download-icon"><i class="fa-solid fa-download"></i></span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const favorited = isFavorited(article.id);
    const heartIconClass = favorited ? 'fa-solid' : 'fa-regular';
    const favoritedClass = favorited ? 'favorited' : '';

    const container = document.getElementById('article-detail-content');
    container.innerHTML = `
        <div class="article-detail-header" data-article-id="${article.id}">
            <div class="article-title-row">
                <h1>${escapeHtml(article.title)}</h1>
                <button class="favorite-heart article-detail-favorite ${favoritedClass}" onclick="toggleFavorite('${article.id}', event)" title="${favorited ? 'הסר ממועדפים' : 'הוסף למועדפים'}">
                    <i class="${heartIconClass} fa-heart"></i>
                </button>
            </div>
            <div class="article-detail-meta">
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
            ${article.summary ? `<p><strong>תקציר:</strong> ${escapeHtml(article.summary)}</p>` : ''}
        </div>
        <div class="article-detail-body">
            ${article.content}
        </div>
        ${attachmentsHtml}
        <div class="print-metadata" style="display: none;">
            <h4>מידע על המאמר</h4>
            <p><strong>תאריך הדפסה:</strong> ${formatDate(new Date().toISOString())}</p>
            <p><strong>נוצר בתאריך:</strong> ${formatDate(article.createdAt)}</p>
            <p><strong>עודכן בתאריך:</strong> ${formatDate(article.updatedAt)}</p>
            ${article.author ? `<p><strong>נכתב על ידי:</strong> ${escapeHtml(article.author)}</p>` : ''}
            <p><strong>קטגוריה:</strong> ${escapeHtml(article.category)}</p>
            <p><strong>מחלקה:</strong> ${escapeHtml(article.department)}</p>
            <p><strong>עדיפות:</strong> ${escapeHtml(article.priority)}</p>
        </div>
        <div class="article-detail-footer">
            <div>
                <p><strong>נוצר:</strong> ${formatDate(article.createdAt)}</p>
                <p><strong>עודכן:</strong> ${formatDate(article.updatedAt)}</p>
            </div>
            <div class="footer-actions">
                <button class="btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> הדפסה</button>
                ${(state.currentUser && (state.currentUser.role === 'admin' || article.author_id === state.currentUser.id)) ?
            `<button class="btn-edit" onclick="editArticle('${article.id}')">עריכת מאמר</button>` : ''}
            </div>
        </div>
    `;

    showView('article-detail');
    generateTableOfContents();
    addCopyButtons();
    highlightCodeBlocks();

    // Track this article as recently viewed
    addToRecentlyViewed(id);

    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('article', id);
        window.history.pushState({ articleId: id }, '', url);
    }
}

/**
 * Close article view and return to list
 */
export function closeArticle() {
    const url = new URL(window.location);
    url.searchParams.delete('article');
    window.history.pushState({}, '', url);
    showView('articles');
}

/**
 * Edit an existing article
 */
export function editArticle(id) {
    const article = state.articles.find(a => a.id === id);
    if (!article) return;

    // Populate form
    document.getElementById('article-id').value = article.id;
    document.getElementById('article-title').value = article.title;
    document.getElementById('article-summary').value = article.summary || '';
    document.getElementById('article-content').innerHTML = article.content;

    // Populate dropdowns and select values
    populateDropdowns();
    setTimeout(() => {
        document.getElementById('article-category').value = article.category;
        document.getElementById('article-department').value = article.department;
        document.getElementById('article-priority').value = article.priority;
    }, 50);

    // Set custom tags
    setCurrentCustomTags(article.customTags ? [...article.customTags] : []);
    renderCustomTags();

    // Set attachments
    setCurrentAttachments(article.attachments ? [...article.attachments] : []);
    renderAttachments();

    // Update UI
    document.getElementById('editor-title').textContent = 'עריכת מאמר';
    document.getElementById('delete-article-btn').style.display = 'inline-block';

    showView('editor');
}

/**
 * Handle article form submission
 */
export async function handleArticleSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('article-id').value;
    const title = document.getElementById('article-title').value.trim();
    const summary = document.getElementById('article-summary').value.trim();
    const content = document.getElementById('article-content').innerHTML;
    const category = document.getElementById('article-category').value;
    const department = document.getElementById('article-department').value;
    const priority = document.getElementById('article-priority').value;

    if (!title || !category || !department || !priority) {
        showToast('נא למלא את כל השדות הנדרשים', 'error');
        return;
    }

    const now = new Date().toISOString();

    // Check if using API
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        try {
            // Get IDs from names
            const categoryObj = state.dbCategories.find(c => c.name === category);
            const departmentObj = state.dbDepartments.find(d => d.name === department);
            const priorityObj = state.dbPriorities.find(p => p.name === priority);

            const articleData = {
                title,
                summary,
                content,
                category_id: categoryObj ? categoryObj.id : null,
                department_id: departmentObj ? departmentObj.id : null,
                priority_id: priorityObj ? priorityObj.id : null,
                tags: [...state.currentCustomTags],
                attachmentIds: state.currentAttachments
                    .map(att => att.id ? parseInt(att.id, 10) : null)
                    .filter(id => id !== null && !isNaN(id))
            };

            if (id) {
                await API.updateArticle(id, articleData);
                showToast('המאמר עודכן בהצלחה!', 'success');
            } else {
                await API.createArticle(articleData);
                showToast('המאמר נוצר בהצלחה!', 'success');
            }

            // Reload articles from API
            if (typeof window.initializeFromAPI === 'function') {
                await window.initializeFromAPI();
            }
        } catch (error) {
            console.error('Error saving article:', error);
            showToast('שגיאה בשמירת המאמר', 'error');
            return;
        }
    } else {
        // Local storage mode
        if (id) {
            // Update existing article
            const index = state.articles.findIndex(a => a.id === id);
            if (index !== -1) {
                state.articles[index] = {
                    ...state.articles[index],
                    title,
                    summary,
                    content,
                    category,
                    department,
                    priority,
                    customTags: [...state.currentCustomTags],
                    attachments: [...state.currentAttachments],
                    updatedAt: now
                };
                showToast('המאמר עודכן בהצלחה!', 'success');
            }
        } else {
            // Create new article
            const newArticle = {
                id: generateId(),
                title,
                summary,
                content,
                category,
                department,
                priority,
                customTags: [...state.currentCustomTags],
                attachments: [...state.currentAttachments],
                createdAt: now,
                updatedAt: now
            };
            state.articles.unshift(newArticle);
            showToast('המאמר נוצר בהצלחה!', 'success');
        }

        saveArticles();
    }

    // Clear draft since article was saved
    clearDraft();

    resetForm();
    filterArticles();
    showView('articles');
}

/**
 * Delete an article
 */
export async function deleteArticle() {
    const id = document.getElementById('article-id').value;
    if (!id) return;

    if (confirm('האם אתה בטוח שברצונך למחוק מאמר זה?')) {
        if (typeof isUsingAPI === 'function' && isUsingAPI()) {
            try {
                await API.deleteArticle(id);
                if (typeof window.initializeFromAPI === 'function') {
                    await window.initializeFromAPI();
                }
            } catch (error) {
                console.error('Error deleting article:', error);
                showToast('שגיאה במחיקת המאמר', 'error');
                return;
            }
        } else {
            setArticles(state.articles.filter(a => a.id !== id));
            saveArticles();
        }
        showToast('המאמר נמחק בהצלחה!', 'success');
        resetForm();
        filterArticles();
        showView('articles');
    }
}

/**
 * Reset the article form
 */
export function resetForm() {
    document.getElementById('article-form').reset();
    document.getElementById('article-id').value = '';
    document.getElementById('article-content').innerHTML = '';
    document.getElementById('editor-title').textContent = 'יצירת מאמר חדש';
    document.getElementById('delete-article-btn').style.display = 'none';
    setCurrentCustomTags([]);
    setCurrentAttachments([]);
    renderCustomTags();
    renderAttachments();
    populateDropdowns();
}

/**
 * Filter and sort articles
 */
export function filterArticles() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('filter-category');
    const departmentFilter = document.getElementById('filter-department');
    const priorityFilter = document.getElementById('filter-priority');
    const sortSelect = document.getElementById('sort-articles');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const categoryValue = categoryFilter ? categoryFilter.value : '';
    const departmentValue = departmentFilter ? departmentFilter.value : '';
    const priorityValue = priorityFilter ? priorityFilter.value : '';
    const sortValue = sortSelect ? sortSelect.value : 'date-desc';

    let filtered = state.articles.filter(article => {
        // Search filter
        const matchesSearch = !searchTerm ||
            article.title.toLowerCase().includes(searchTerm) ||
            (article.summary && article.summary.toLowerCase().includes(searchTerm)) ||
            article.content.toLowerCase().includes(searchTerm) ||
            (article.customTags && article.customTags.some(tag => tag.toLowerCase().includes(searchTerm)));

        // Category filter
        const matchesCategory = !categoryValue || article.category === categoryValue;

        // Department filter
        const matchesDepartment = !departmentValue || article.department === departmentValue;

        // Priority filter
        const matchesPriority = !priorityValue || article.priority === priorityValue;

        return matchesSearch && matchesCategory && matchesDepartment && matchesPriority;
    });

    // Sorting
    filtered.sort((a, b) => {
        switch (sortValue) {
            case 'date-asc':
                return new Date(a.updatedAt) - new Date(b.updatedAt);
            case 'date-desc':
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            case 'title-asc':
                return a.title.localeCompare(b.title, 'he');
            case 'title-desc':
                return b.title.localeCompare(a.title, 'he');
            case 'priority':
                return (b.priorityLevel || 0) - (a.priorityLevel || 0);
            default:
                return 0;
        }
    });

    renderArticles(filtered);
}

/**
 * Generate table of contents from article headings
 */
export function generateTableOfContents() {
    const articleBody = document.querySelector('.article-detail-body');
    const tocList = document.getElementById('toc-list');
    const tocContainer = document.getElementById('article-toc');

    if (!articleBody || !tocList || !tocContainer) return;

    // Clear existing TOC
    tocList.innerHTML = '';

    // Find all headings in article content
    const headings = articleBody.querySelectorAll('h1, h2, h3');

    if (headings.length === 0) {
        tocContainer.classList.add('empty');
        return;
    }

    tocContainer.classList.remove('empty');

    headings.forEach((heading, index) => {
        // Create unique ID for the heading if it doesn't have one
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }

        // Create TOC item
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;
        a.classList.add(`toc-${heading.tagName.toLowerCase()}`);

        // Smooth scroll on click
        a.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        li.appendChild(a);
        tocList.appendChild(li);
    });
}

/**
 * Get sample articles for first-time users
 */
export function getSampleArticles() {
    return [
        {
            id: generateId(),
            title: 'ברוכים הבאים למאגר הידע',
            summary: 'מאמר פתיחה עם הסבר על שימוש במאגר הידע הארגוני',
            content: '<h2>ברוכים הבאים!</h2><p>מאגר הידע הוא המקום המרכזי לכל המידע הארגוני שלנו.</p><h3>איך להשתמש במאגר?</h3><ul><li>חפשו מאמרים לפי נושא או מילות מפתח</li><li>סננו לפי קטגוריה, מחלקה או עדיפות</li><li>צרו מאמרים חדשים בעזרת העורך</li></ul><p>בהצלחה!</p>',
            category: 'כללי',
            department: 'הנהלה',
            priority: 'גבוהה',
            customTags: ['חדש', 'חשוב'],
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            title: 'נוהל עבודה עם מערכת ה-CRM',
            summary: 'הנחיות מפורטות לעבודה נכונה עם מערכת ניהול הלקוחות',
            content: '<h2>נוהל עבודה עם מערכת ה-CRM</h2><p>מסמך זה מפרט את נהלי העבודה הנכונים עם מערכת ניהול הלקוחות שלנו.</p><h3>כניסה למערכת</h3><ol><li>היכנסו לכתובת המערכת</li><li>הזינו את שם המשתמש והסיסמה</li><li>לחצו על "התחבר"</li></ol><h3>עדכון פרטי לקוח</h3><p>לעדכון פרטי לקוח, חפשו את הלקוח בשורת החיפוש ולחצו על "עריכה".</p>',
            category: 'נהלים',
            department: 'מכירות',
            priority: 'בינונית',
            customTags: ['CRM', 'לקוחות'],
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
}

// Export to window for inline handlers
export function initArticlesGlobals() {
    window.viewArticle = viewArticle;
    window.editArticle = editArticle;
    window.deleteArticle = deleteArticle;
    window.resetForm = resetForm;
    window.closeArticle = closeArticle;
}
