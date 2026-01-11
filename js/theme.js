/* ==========================================
   Theme & UI Controls Module
   Dark mode toggle and scroll-to-top button
   ========================================== */

/**
 * Initialize dark mode toggle
 */
export function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');

    if (!toggleBtn) return;

    const updateIcon = (isDark) => {
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    };

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateIcon(true);
    }

    // Toggle theme on click
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        updateIcon(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

/**
 * Initialize scroll-to-top button
 */
export function initScrollToTop() {
    const scrollBtn = document.getElementById('scroll-to-top');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Update connection status indicator
 */
export function updateConnectionStatus() {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;

    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        statusEl.classList.add('connected');
        statusEl.classList.remove('local');
        statusEl.querySelector('.status-text').textContent = 'מחובר לשרת';
    } else {
        statusEl.classList.add('local');
        statusEl.classList.remove('connected');
        statusEl.querySelector('.status-text').textContent = 'אחסון מקומי';
    }
}
