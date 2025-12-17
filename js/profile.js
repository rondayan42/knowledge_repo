/* ==========================================
   Profile Module
   User profile page with articles management
   ========================================== */

import { state } from './state.js';
import { escapeHtml, formatDate, showToast } from './utils.js';
import { showView } from './views.js';
import { editArticle, deleteArticle } from './articles.js';

/**
 * Render the profile page
 */
export function renderProfile() {
    const user = state.currentUser;
    if (!user) return;

    // Update profile header
    document.getElementById('profile-email').textContent = user.email || 'משתמש';

    const roleText = user.role === 'admin' ? 'מנהל' : 'משתמש';
    const roleEl = document.getElementById('profile-role');
    roleEl.textContent = roleText;
    roleEl.className = 'profile-role-badge ' + (user.role === 'admin' ? 'admin' : 'user');

    // Get user's articles (or all for admin)
    const userArticles = getUserArticles();

    // Update stats
    document.getElementById('profile-article-count').textContent = userArticles.length;

    // Update title based on role
    const titleEl = document.getElementById('profile-articles-title');
    titleEl.textContent = user.role === 'admin' ? 'כל המאמרים' : 'המאמרים שלי';

    // Render articles list
    renderProfileArticles(userArticles);

    // Render user management section for admins
    if (user.role === 'admin') {
        showUserManagement();
        loadUsers();
    } else {
        hideUserManagement();
    }
}

/**
 * Show user management section
 */
function showUserManagement() {
    const section = document.getElementById('user-management-section');
    if (section) {
        section.style.display = 'block';
    }
}

/**
 * Hide user management section
 */
function hideUserManagement() {
    const section = document.getElementById('user-management-section');
    if (section) {
        section.style.display = 'none';
    }
}

/**
 * Load all users for admin management
 */
async function loadUsers() {
    const container = document.getElementById('users-list');
    if (!container) return;

    container.innerHTML = '<div class="loading-users"><i class="fa-solid fa-spinner fa-spin"></i> טוען משתמשים...</div>';

    try {
        if (typeof isUsingAPI === 'function' && isUsingAPI()) {
            const users = await API.getUsers();
            renderUsersList(users);
        } else {
            container.innerHTML = '<p class="no-users">ניהול משתמשים זמין רק במצב שרת</p>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = '<p class="error-users">שגיאה בטעינת משתמשים</p>';
    }
}

/**
 * Render the users list for admin management
 */
function renderUsersList(users) {
    const container = document.getElementById('users-list');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = '<p class="no-users">לא נמצאו משתמשים</p>';
        return;
    }

    const currentUserId = state.currentUser?.id;
    // Sort: Pending first, then by date desc
    const sortedUsers = [...users].sort((a, b) => {
        if (!a.approved && b.approved) return -1;
        if (a.approved && !b.approved) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    container.innerHTML = sortedUsers.map(user => {
        const isCurrentUser = user.id === currentUserId;
        const isAdmin = user.role === 'admin';
        const isApproved = user.approved !== false; // Default to true if undefined

        return `
            <div class="user-card ${isCurrentUser ? 'current-user' : ''} ${!isApproved ? 'pending-user' : ''}">
                <div class="user-info">
                    <div class="user-email">
                        <i class="fa-solid fa-user"></i>
                        ${escapeHtml(user.email)}
                        ${isCurrentUser ? '<span class="you-badge">(אני)</span>' : ''}
                        ${!isApproved ? '<span class="pending-badge">ממתין לאישור</span>' : ''}
                    </div>
                    <div class="user-meta">
                        <span class="user-role-badge ${isAdmin ? 'admin' : 'user'}">
                            ${isAdmin ? 'מנהל' : 'משתמש'}
                        </span>
                        <span class="user-date">
                            <i class="fa-solid fa-calendar"></i>
                            ${formatDate(user.created_at)}
                        </span>
                    </div>
                </div>
                <div class="user-actions">
                    ${!isApproved ? `
                        <button class="btn-approve" onclick="approveUser('${user.id}', true)" title="אשר משתמש">
                            <i class="fa-solid fa-check"></i> אשר
                        </button>
                        <button class="btn-decline" onclick="declineUser('${user.id}')" title="דחה ומחק בקשה">
                            <i class="fa-solid fa-xmark"></i> דחה
                        </button>
                    ` : ''}
                    
                    ${isApproved && !isCurrentUser ? `
                         <button class="btn-ban" onclick="approveUser('${user.id}', false)" title="חסום גישה">
                            <i class="fa-solid fa-ban"></i>
                        </button>
                    ` : ''}

                    ${isCurrentUser ?
                '<span class="cannot-change">לא ניתן לשנות</span>' :
                `<button class="btn-role-toggle ${isAdmin ? 'demote' : 'promote'}" 
                            onclick="toggleUserRole('${user.id}', '${isAdmin ? 'user' : 'admin'}')"
                            title="${isAdmin ? 'הסר הרשאות מנהל' : 'הפוך למנהל'}">
                            <i class="fa-solid ${isAdmin ? 'fa-user-minus' : 'fa-user-plus'}"></i>
                            ${isAdmin ? 'הסר מנהל' : 'הפוך למנהל'}
                        </button>`
            }
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Toggle a user's role between user and admin
 */
export async function toggleUserRole(userId, newRole) {
    const actionText = newRole === 'admin' ? 'להפוך את המשתמש למנהל' : 'להסיר את הרשאות המנהל מהמשתמש';

    if (!confirm(`האם אתה בטוח שברצונך ${actionText}?`)) {
        return;
    }

    try {
        if (typeof isUsingAPI === 'function' && isUsingAPI()) {
            await API.updateUserRole(userId, newRole);
            showToast(newRole === 'admin' ? 'המשתמש הפך למנהל!' : 'הרשאות המנהל הוסרו!', 'success');
            loadUsers(); // Refresh the list
        }
    } catch (error) {
        console.error('Error updating user role:', error);
        showToast(error.message || 'שגיאה בעדכון הרשאות', 'error');
    }
}

/**
 * Approve or block a user
 */
export async function approveUser(userId, approved) {
    const actionText = approved ? 'לאשר את המשתמש' : 'לחסום את הגישה למשתמש';

    if (!confirm(`האם אתה בטוח שברצונך ${actionText}?`)) {
        return;
    }

    try {
        if (typeof isUsingAPI === 'function' && isUsingAPI()) {
            await API.approveUser(userId, approved);
            showToast(approved ? 'המשתמש אושר בהצלחה!' : 'הגישה נחסמה!', 'success');
            loadUsers(); // Refresh the list
        }
    } catch (error) {
        console.error('Error updating user approval:', error);
        showToast(error.message || 'שגיאה בעדכון סטטוס משתמש', 'error');
    }
}

/**
 * Decline (delete) a pending user
 */
export async function declineUser(userId) {
    if (!confirm('האם אתה בטוח שברצונך לדחות ולמחוק את בקשת ההרשמה הזו?')) {
        return;
    }

    try {
        if (typeof isUsingAPI === 'function' && isUsingAPI()) {
            await API.deleteUser(userId);
            showToast('הבקשה נדחתה והמשתמש נמחק בהצלחה', 'success');
            loadUsers(); // Refresh the list
        }
    } catch (error) {
        console.error('Error declining user:', error);
        showToast(error.message || 'שגיאה בדחיית המשתמש', 'error');
    }
}

/**
 * Get articles for the current user (or all for admin)
 */
function getUserArticles() {
    const user = state.currentUser;
    if (!user) return [];

    // Admins see all articles
    if (user.role === 'admin') {
        return state.articles;
    }

    // Regular users see only their own articles
    return state.articles.filter(article => article.author_id === user.id);
}

/**
 * Render articles in the profile view
 */
function renderProfileArticles(articles) {
    const container = document.getElementById('profile-articles-list');
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-file-circle-plus"></i></div>
                <h3>אין מאמרים</h3>
                <p>לא נמצאו מאמרים. <a href="#" onclick="showView('editor'); return false;">צור מאמר חדש</a></p>
            </div>
        `;
        return;
    }

    const user = state.currentUser;

    container.innerHTML = articles.map(article => {
        const canEdit = user && (user.role === 'admin' || article.author_id === user.id);

        return `
            <div class="profile-article-card">
                <div class="profile-article-info">
                    <h4 onclick="viewArticle('${article.id}')" style="cursor: pointer;">${escapeHtml(article.title)}</h4>
                    <div class="profile-article-meta">
                        <span><i class="fa-solid fa-folder"></i> ${escapeHtml(article.category || '')}</span>
                        <span><i class="fa-solid fa-calendar"></i> ${formatDate(article.updatedAt)}</span>
                        ${article.author ? `<span><i class="fa-solid fa-user"></i> ${escapeHtml(article.author)}</span>` : ''}
                    </div>
                </div>
                ${canEdit ? `
                    <div class="profile-article-actions">
                        <button class="btn-edit-small" onclick="editArticle('${article.id}')" title="עריכה">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-delete-small" onclick="confirmDeleteArticle('${article.id}')" title="מחיקה">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Confirm and delete an article from profile
 */
export async function confirmDeleteArticle(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק מאמר זה?')) return;

    try {
        if (typeof isUsingAPI === 'function' && isUsingAPI()) {
            await API.deleteArticle(id);
            if (typeof window.initializeFromAPI === 'function') {
                await window.initializeFromAPI();
            }
        } else {
            const index = state.articles.findIndex(a => a.id === id);
            if (index !== -1) {
                state.articles.splice(index, 1);
            }
        }
        showToast('המאמר נמחק בהצלחה!', 'success');
        renderProfile();
    } catch (error) {
        console.error('Error deleting article:', error);
        showToast('שגיאה במחיקת המאמר', 'error');
    }
}

/**
 * Initialize profile globals for inline handlers
 */
export function initProfileGlobals() {
    window.renderProfile = renderProfile;
    window.confirmDeleteArticle = confirmDeleteArticle;
    window.confirmDeleteArticle = confirmDeleteArticle;
    window.confirmDeleteArticle = confirmDeleteArticle;
    window.toggleUserRole = toggleUserRole;
    window.approveUser = approveUser;
    window.declineUser = declineUser;
}

