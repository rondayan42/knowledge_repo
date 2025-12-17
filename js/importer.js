/* ==========================================
   Content Import Module
   Parse and import DOCX, HTML, and Markdown files
   ========================================== */

import { showToast } from './utils.js';

/**
 * Initialize file import functionality
 */
export function initFileImport() {
    const fileInput = document.getElementById('import-file-input');
    const importArea = document.getElementById('import-area');

    if (!fileInput || !importArea) return;

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

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
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

/**
 * Handle file selection from input
 */
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
    e.target.value = '';
}

/**
 * Process an uploaded file based on its extension
 */
async function handleFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    showToast('מקבל קובץ...', 'info');

    try {
        switch (extension) {
            case 'md':
            case 'markdown':
            case 'txt':
                await importMarkdown(file);
                break;
            case 'docx':
                await importDocx(file);
                break;
            case 'html':
            case 'htm':
                await importHtml(file);
                break;
            default:
                showToast('סוג קובץ לא נתמך. אנא בחר DOCX, HTML או Markdown/TXT', 'error');
        }
    } catch (error) {
        console.error('Import error:', error);
        showToast('שגיאה בייבוא הקובץ: ' + error.message, 'error');
    }
}

/**
 * Import Markdown file
 */
function importMarkdown(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const markdown = e.target.result;
                const html = markdownToHtml(markdown);

                // Extract title
                let title = file.name.replace(/\.(md|markdown|txt)$/i, '');
                const titleMatch = markdown.match(/^#\s+(.+)$/m);
                if (titleMatch) {
                    title = titleMatch[1].trim();
                }

                // Extract summary
                let summary = '';
                const paragraphMatch = markdown.match(/^(?!#)(.+)$/m);
                if (paragraphMatch) {
                    summary = paragraphMatch[1].trim().substring(0, 200);
                }

                populateEditor(title, summary, html);
                showToast('קובץ Markdown יובא בהצלחה!', 'success');
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Import DOCX file using Mammoth.js
 */
function importDocx(file) {
    return new Promise((resolve, reject) => {
        if (typeof mammoth === 'undefined') {
            reject(new Error('רכיב המרת DOCX לא נטען (mammoth.js)'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;

            mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                .then(result => {
                    const html = result.value; // The generated HTML
                    const messages = result.messages; // Any warnings

                    if (messages.length > 0) {
                        console.warn('Mammoth messages:', messages);
                    }

                    const title = file.name.replace(/\.docx$/i, '');
                    // Try to generate simple summary from text content (strip tags)
                    const textContent = html.replace(/<[^>]*>?/gm, ' ');
                    const summary = textContent.substring(0, 200).trim();

                    populateEditor(title, summary, html);
                    showToast('קובץ Word יובא בהצלחה!', 'success');
                    resolve();
                })
                .catch(reject);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Import HTML file
 */
function importHtml(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const rawHtml = e.target.result;
                const parser = new DOMParser();
                const doc = parser.parseFromString(rawHtml, 'text/html');

                // Apply inline styles to important formatting elements
                applyInlineStylesToElements(doc);

                // Try to find main content
                let contentNode = doc.querySelector('main') || doc.querySelector('body');
                let html = contentNode ? contentNode.innerHTML : rawHtml;

                // Basic cleanup? (Optional: remove scripts, styles if malicious - though editor acts as admin tool usually)
                // For now, we trust the user's import or the editor's display security (if any)

                let title = doc.title || file.name.replace(/\.html?$/i, '');
                // Try to find h1 for title if doc title is empty
                const h1 = doc.querySelector('h1');
                if (h1) title = h1.textContent;

                const summary = doc.body.textContent.trim().substring(0, 200);

                populateEditor(title, summary, html);
                showToast('קובץ HTML יובא בהצלחה!', 'success');
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Apply inline styles to important formatting elements (tables, code, etc.)
 * This preserves visual formatting when HTML is imported into the editor.
 */
function applyInlineStylesToElements(doc) {
    // Create a hidden iframe to compute styles from the original document
    // Give it real dimensions so percentage widths compute correctly
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:600px;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(doc.documentElement.outerHTML);
        iframeDoc.close();

        // Elements to preserve styling for
        const selectors = ['table', 'th', 'td', 'tr', 'thead', 'tbody', 'pre', 'code', 'blockquote'];
        const styleProps = [
            'border', 'border-collapse', 'border-bottom', 'padding', 'margin',
            'background-color', 'background', 'color', 'font-family', 'font-size',
            'font-weight', 'text-align', 'vertical-align', 'border-radius',
            'display', 'direction', 'line-height'
        ];

        selectors.forEach(selector => {
            const originalElements = iframeDoc.querySelectorAll(selector);
            const targetElements = doc.querySelectorAll(selector);

            originalElements.forEach((origEl, index) => {
                if (!targetElements[index]) return;

                const computed = iframe.contentWindow.getComputedStyle(origEl);
                const inlineStyles = [];

                styleProps.forEach(prop => {
                    const value = computed.getPropertyValue(prop);
                    // Only add non-default/meaningful values
                    if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px') {
                        inlineStyles.push(`${prop}: ${value}`);
                    }
                });

                // Special handling for width - check if original has width: 100% style
                if (selector === 'table') {
                    // Force table to be 100% width if it was styled that way
                    const tableStyle = origEl.getAttribute('style') || '';
                    if (tableStyle.includes('100%') || computed.getPropertyValue('width').includes('900')) {
                        inlineStyles.push('width: 100%');
                    }
                }

                if (inlineStyles.length > 0) {
                    const existingStyle = targetElements[index].getAttribute('style') || '';
                    targetElements[index].setAttribute('style', existingStyle + inlineStyles.join('; ') + ';');
                }
            });
        });
    } finally {
        document.body.removeChild(iframe);
    }
}

/**
 * Populate values into the editor form
 */
function populateEditor(title, summary, content) {
    // Populate form
    const titleInput = document.getElementById('article-title');
    const summaryInput = document.getElementById('article-summary');
    const contentEditor = document.getElementById('article-content');

    if (titleInput && title) titleInput.value = title;
    if (summaryInput && summary) summaryInput.value = summary;
    if (contentEditor && content) contentEditor.innerHTML = content;
}

/**
 * Convert markdown to HTML (Legacy function from markdown.js)
 */
export function markdownToHtml(markdown) {
    let html = markdown;

    // Escape HTML entities first
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Tables (process early, before bold/italic/code transformations)
    // Look for: | header | header |
    //           | :----- | :----- |
    //           | cell   | cell   |
    const tableRegex = /^\|(.+)\|\r?\n\|([-:| ]+)\|\r?\n((\|.*\|\r?\n?)*)/gm;

    // Helper to determine alignment from separator
    function getAlignment(separator) {
        if (!separator) return null;
        const trimmed = separator.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        if (trimmed.startsWith(':')) return 'left';
        return null;
    }

    html = html.replace(tableRegex, (match, headerStr, separatorStr, bodyStr) => {
        const headers = headerStr.split('|').filter(h => h).map(h => h.trim());
        const separators = separatorStr.split('|').filter(s => s).map(s => s.trim());

        let tableHtml = '<table><thead><tr>';

        // Build header
        headers.forEach((header, index) => {
            const align = getAlignment(separators[index]);
            const alignAttr = align ? ` style="text-align: ${align}"` : '';
            tableHtml += `<th${alignAttr}>${header}</th>`;
        });

        tableHtml += '</tr></thead><tbody>';

        // Build body
        if (bodyStr && bodyStr.trim()) {
            const rows = bodyStr.trim().split(/\r?\n/);
            rows.forEach(row => {
                if (!row.trim()) return; // Skip empty rows
                // Remove first and last pipe if proper markdown table
                const cleanRow = row.replace(/^\|/, '').replace(/\|$/, '');
                const cells = cleanRow.split('|');

                tableHtml += '<tr>';
                cells.forEach((cell, index) => {
                    const align = getAlignment(separators[index]);
                    const alignAttr = align ? ` style="text-align: ${align}"` : '';
                    const cellContent = cell ? cell.trim() : '';
                    tableHtml += `<td${alignAttr}>${cellContent}</td>`;
                });
                tableHtml += '</tr>';
            });
        }

        tableHtml += '</tbody></table>';
        return tableHtml;
    });

    // Code blocks (process before inline code and bold/italic)
    html = html.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Headers
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

    // Inline code
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

    // List handling (Ordered and Unordered)
    // We need a more robust approach to distinguishing between UL and OL

    // Process unordered lists
    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li class="ul-item">$1</li>');

    // Process ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ol-item">$1</li>');

    // Wrap consecutive UL items (grouping them even if separated by newlines)
    html = html.replace(/((?:<li class="ul-item">.*<\/li>\s*)+)/g, (match) => {
        return '<ul>' + match.replace(/class="ul-item"/g, '').trim() + '</ul>';
    });

    // Wrap consecutive OL items (grouping them even if separated by newlines)
    html = html.replace(/((?:<li class="ol-item">.*<\/li>\s*)+)/g, (match) => {
        return '<ol>' + match.replace(/class="ol-item"/g, '').trim() + '</ol>';
    });

    // Tables were moved earlier in the pipeline (after HTML escaping, before inline formatting)

    // Paragraphs
    const lines = html.split('\n');
    html = lines.map(line => {
        line = line.trim();
        if (!line) return '';
        if (line.match(/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|p)/)) return line;
        return `<p>${line}</p>`;
    }).join('\n');

    // Clean up
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
 * Handle click on import area
 */
export function handleImportClick(e) {
    const box = document.getElementById('import-area');
    if (!box) return;
    // If collapsed, expand first
    if (box.classList.contains('collapsed')) {
        expandImportBox();
        return;
    }
    // Already expanded -> open file dialog
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) {
        fileInput.click();
    }
}

/**
 * Expand the import box
 */
export function expandImportBox() {
    const box = document.getElementById('import-area');
    if (!box) return;
    box.classList.add('expanded');
    box.classList.remove('collapsed');
}

/**
 * Collapse the import box
 */
export function collapseImportBox(e) {
    if (e) e.stopPropagation();
    const box = document.getElementById('import-area');
    if (!box) return;
    box.classList.remove('expanded');
    box.classList.add('collapsed');
    box.classList.remove('drag-over');
}

// Export to window for inline handlers
export function initImporterGlobals() {
    window.handleImportClick = handleImportClick;
    window.collapseImportBox = collapseImportBox;
}
