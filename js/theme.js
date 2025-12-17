/* ==========================================
   Theme & UI Controls Module
   Dark mode toggle and scroll-to-top button
   ========================================== */

/**
 * Initialize dark mode toggle
 */
export function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = toggleBtn?.querySelector('.theme-icon');
    
    if (!toggleBtn || !themeIcon) return;
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    
    // Toggle theme on click
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeIcon.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
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
