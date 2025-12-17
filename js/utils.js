/* ==========================================
   Utility Functions Module
   Common helper functions used across the app
   ========================================== */

/**
 * Generate a unique ID for articles/attachments
 */
export function generateId() {
    return 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format a date string for Hebrew locale display
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce function to limit rapid calls
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        pdf: '<i class="fa-solid fa-file-pdf"></i>',
        doc: '<i class="fa-solid fa-file-word"></i>', 
        docx: '<i class="fa-solid fa-file-word"></i>',
        xls: '<i class="fa-solid fa-file-excel"></i>', 
        xlsx: '<i class="fa-solid fa-file-excel"></i>',
        ppt: '<i class="fa-solid fa-file-powerpoint"></i>', 
        pptx: '<i class="fa-solid fa-file-powerpoint"></i>',
        txt: '<i class="fa-solid fa-file-lines"></i>',
        zip: '<i class="fa-solid fa-file-zipper"></i>', 
        rar: '<i class="fa-solid fa-file-zipper"></i>',
        png: '<i class="fa-solid fa-file-image"></i>', 
        jpg: '<i class="fa-solid fa-file-image"></i>', 
        jpeg: '<i class="fa-solid fa-file-image"></i>', 
        gif: '<i class="fa-solid fa-file-image"></i>'
    };
    return icons[ext] || '<i class="fa-solid fa-paperclip"></i>';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Highlight code blocks using Highlight.js
 */
export function highlightCodeBlocks() {
    if (typeof hljs === 'undefined') return;
    
    const codeBlocks = document.querySelectorAll('.article-detail-body pre code');
    codeBlocks.forEach(block => {
        hljs.highlightElement(block);
    });
}
/**
 * Add copy buttons to code blocks
 */
export function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('.article-detail-body pre');
    
    codeBlocks.forEach(pre => {
        // Check if button already exists
        if (pre.querySelector('.copy-btn')) return;
        
        // Ensure relative positioning for absolute button placement
        if (getComputedStyle(pre).position === 'static') {
            pre.style.position = 'relative';
        }
        
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerHTML = '<i class="fa-regular fa-copy"></i>';
        button.title = 'העתק לקליפבורד';
        
        button.addEventListener('click', () => {
            const code = pre.querySelector('code');
            const text = code ? code.innerText : pre.innerText;
            
            navigator.clipboard.writeText(text).then(() => {
                button.innerHTML = '<i class="fa-solid fa-check"></i>';
                button.classList.add('copied');
                setTimeout(() => {
                    button.innerHTML = '<i class="fa-regular fa-copy"></i>';
                    button.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                showToast('שגיאה בהעתקה', 'error');
            });
        });
        
        pre.appendChild(button);
    });
}
