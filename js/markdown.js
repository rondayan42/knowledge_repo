/* ==========================================
   Markdown Import Module
   Parse and import Markdown files
   ========================================== */

import { showToast } from './utils.js';

/**
 * Initialize markdown import functionality
 */
export function initMarkdownImport() {
    const mdInput = document.getElementById('markdown-input');
    const importArea = document.getElementById('markdown-import-area');
    
    if (!mdInput || !importArea) return;
    
    // File input change
    mdInput.addEventListener('change', handleMarkdownSelect);
    
    // Drag and drop
    importArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        importArea.classList.add('drag-over');
        expandImportBox();
    });
    
    importArea.addEventListener('dragleave', () => {
        importArea.classList.remove('drag-over');
    });
    
    importArea.addEventListener('drop', (e) => {
        e.preventDefault();
        importArea.classList.remove('drag-over');
        expandImportBox();
        if (e.dataTransfer.files.length > 0) {
            handleMarkdownFile(e.dataTransfer.files[0]);
        }
    });
}

/**
 * Handle markdown file selection
 */
function handleMarkdownSelect(e) {
    if (e.target.files.length > 0) {
        handleMarkdownFile(e.target.files[0]);
    }
    e.target.value = '';
}

/**
 * Process a markdown file
 */
function handleMarkdownFile(file) {
    if (!file.name.match(/\.(md|markdown|txt)$/i)) {
        showToast('נא לבחור קובץ Markdown (.md, .markdown, .txt)', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const markdown = e.target.result;
        const html = markdownToHtml(markdown);
        
        // Extract title from first heading or filename
        let title = file.name.replace(/\.(md|markdown|txt)$/i, '');
        const titleMatch = markdown.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            title = titleMatch[1].trim();
        }
        
        // Extract summary from first paragraph
        let summary = '';
        const paragraphMatch = markdown.match(/^(?!#)(.+)$/m);
        if (paragraphMatch) {
            summary = paragraphMatch[1].trim().substring(0, 200);
        }
        
        // Populate form
        document.getElementById('article-title').value = title;
        document.getElementById('article-summary').value = summary;
        document.getElementById('article-content').innerHTML = html;
        
        showToast('קובץ Markdown יובא בהצלחה!', 'success');
    };
    reader.readAsText(file);
}

/**
 * Convert markdown to HTML
 */
export function markdownToHtml(markdown) {
    let html = markdown;
    
    // Escape HTML entities first
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Headers (must be done in order from h6 to h1)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Images
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%">');
    
    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');
    
    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Unordered lists
    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // Paragraphs (lines that aren't already wrapped)
    const lines = html.split('\n');
    html = lines.map(line => {
        line = line.trim();
        if (!line) return '';
        if (line.match(/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|p)/)) return line;
        return `<p>${line}</p>`;
    }).join('\n');
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p><hr><\/p>/g, '<hr>');
    
    return html;
}

/**
 * Handle click on markdown import area
 */
export function handleMarkdownClick(e) {
    const box = document.getElementById('markdown-import-area');
    if (!box) return;
    // If collapsed, expand first instead of opening file picker
    if (box.classList.contains('collapsed')) {
        expandImportBox();
        return;
    }
    // Already expanded -> open file dialog
    const mdInput = document.getElementById('markdown-input');
    if (mdInput) {
        mdInput.click();
    }
}

/**
 * Expand the import box
 */
export function expandImportBox() {
    const box = document.getElementById('markdown-import-area');
    if (!box) return;
    box.classList.add('expanded');
    box.classList.remove('collapsed');
}

/**
 * Collapse the import box
 */
export function collapseImportBox(e) {
    if (e) e.stopPropagation();
    const box = document.getElementById('markdown-import-area');
    if (!box) return;
    box.classList.remove('expanded');
    box.classList.add('collapsed');
    box.classList.remove('drag-over');
}

// Export to window for inline handlers
export function initMarkdownGlobals() {
    window.handleMarkdownClick = handleMarkdownClick;
    window.collapseImportBox = collapseImportBox;
}
