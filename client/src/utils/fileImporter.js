/* ==========================================
   File Import Utilities
   Parse and import DOCX, HTML, and Markdown files
   ========================================== */

/**
 * Convert markdown to HTML
 */
export function markdownToHtml(markdown) {
    let html = markdown;

    // Escape HTML entities first
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Tables (process early, before bold/italic/code transformations)
    const tableRegex = /^\|(.+)\|\r?\n\|([-:| ]+)\|\r?\n((\|.*\|\r?\n?)*)/gm;

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
        headers.forEach((header, index) => {
            const align = getAlignment(separators[index]);
            const alignAttr = align ? ` style="text-align: ${align}"` : '';
            tableHtml += `<th${alignAttr}>${header}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        if (bodyStr && bodyStr.trim()) {
            const rows = bodyStr.trim().split(/\r?\n/);
            rows.forEach(row => {
                if (!row.trim()) return;
                const cleanRow = row.replace(/^\|/, '').replace(/\|$/, '');
                const cells = cleanRow.split('|');
                tableHtml += '<tr>';
                cells.forEach((cell, index) => {
                    const align = getAlignment(separators[index]);
                    const alignAttr = align ? ` style="text-align: ${align}"` : '';
                    tableHtml += `<td${alignAttr}>${cell ? cell.trim() : ''}</td>`;
                });
                tableHtml += '</tr>';
            });
        }

        tableHtml += '</tbody></table>';
        return tableHtml;
    });

    // Code blocks
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

    // Lists
    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li class="ul-item">$1</li>');
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ol-item">$1</li>');

    html = html.replace(/((?:<li class="ul-item">.*<\/li>\s*)+)/g, (match) => {
        return '<ul>' + match.replace(/class="ul-item"/g, '').trim() + '</ul>';
    });
    html = html.replace(/((?:<li class="ol-item">.*<\/li>\s*)+)/g, (match) => {
        return '<ol>' + match.replace(/class="ol-item"/g, '').trim() + '</ol>';
    });

    // Paragraphs
    const lines = html.split('\n');
    html = lines.map(line => {
        line = line.trim();
        if (!line) return '';
        if (line.match(/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|p|table)/)) return line;
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

    return html;
}

/**
 * Import a file and return { title, summary, html }
 */
export async function importFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    switch (extension) {
        case 'md':
        case 'markdown':
        case 'txt':
            return importMarkdown(file);
        case 'docx':
            return importDocx(file);
        case 'html':
        case 'htm':
            return importHtml(file);
        default:
            throw new Error('סוג קובץ לא נתמך. אנא בחר DOCX, HTML או Markdown/TXT');
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

                resolve({ title, summary, html });
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
    return new Promise(async (resolve, reject) => {
        // Dynamically load mammoth if not present
        if (typeof window.mammoth === 'undefined') {
            try {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
                script.onload = () => processDocx(file, resolve, reject);
                script.onerror = () => reject(new Error('נכשל בטעינת ספריית המרת DOCX'));
                document.head.appendChild(script);
            } catch (err) {
                reject(new Error('נכשל בטעינת ספריית המרת DOCX'));
            }
        } else {
            processDocx(file, resolve, reject);
        }
    });
}

function processDocx(file, resolve, reject) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const arrayBuffer = e.target.result;

        window.mammoth.convertToHtml({ arrayBuffer })
            .then(result => {
                const html = result.value;
                const title = file.name.replace(/\.docx$/i, '');
                const textContent = html.replace(/<[^>]*>?/gm, ' ');
                const summary = textContent.substring(0, 200).trim();

                resolve({ title, summary, html });
            })
            .catch(reject);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
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

                // Try to find main content
                let contentNode = doc.querySelector('main') || doc.querySelector('body');
                let html = contentNode ? contentNode.innerHTML : rawHtml;

                let title = doc.title || file.name.replace(/\.html?$/i, '');
                const h1 = doc.querySelector('h1');
                if (h1) title = h1.textContent;

                const summary = doc.body.textContent.trim().substring(0, 200);

                resolve({ title, summary, html });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
