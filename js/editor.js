/* ==========================================
   Rich Text Editor Module
   Text formatting and editing functions
   ========================================== */

import { showToast } from './utils.js';

/**
 * Execute a formatting command on the editor
 */
export function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('article-content').focus();
}

/**
 * Change font size in editor
 */
export function changeFontSize(size) {
    if (size) {
        document.execCommand('fontSize', false, size);
        document.getElementById('article-content').focus();
    }
}

/**
 * Change font family in editor
 */
export function changeFontName(font) {
    if (font) {
        document.execCommand('fontName', false, font);
        document.getElementById('article-content').focus();
    }
}

/**
 * Change text color in editor
 */
export function changeTextColor(color) {
    document.execCommand('foreColor', false, color);
    document.getElementById('article-content').focus();
}

/**
 * Change background color in editor
 */
export function changeBackColor(color) {
    document.execCommand('backColor', false, color);
    document.getElementById('article-content').focus();
}

/**
 * Insert a heading at cursor position
 */
export function insertHeading() {
    const selection = window.getSelection();
    if (selection.toString()) {
        document.execCommand('formatBlock', false, 'h3');
    } else {
        document.execCommand('insertHTML', false, '<h3>כותרת</h3>');
    }
    document.getElementById('article-content').focus();
}

/**
 * Insert a link at cursor position
 */
export function insertLink() {
    const url = prompt('הזן כתובת URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
    document.getElementById('article-content').focus();
}

/**
 * Trigger the image file input
 */
export function triggerImageUpload() {
    const imageInput = document.getElementById('image-input');
    if (imageInput) {
        imageInput.click();
    }
}

/**
 * Handle image file selection and upload
 */
export async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('נא לבחור קובץ תמונה בלבד', 'error');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('גודל התמונה מוגבל ל-10MB', 'error');
        return;
    }

    showToast('מעלה תמונה...', 'info');

    // Check if API is available
    if (typeof isUsingAPI === 'function' && isUsingAPI()) {
        // Upload to server/S3
        try {
            // Upload using API client which handles auth headers
            const result = await API.uploadImage(file);

            // Result is already parsed JSON from API.uploadImage

            // Insert image at cursor position
            insertImageAtCursor(result.url, file.name);
            showToast('התמונה הועלתה בהצלחה!', 'success');

        } catch (error) {
            console.error('Image upload error:', error);
            showToast(error.message || 'שגיאה בהעלאת התמונה', 'error');
        }
    } else {
        // Local mode: convert to base64
        try {
            const base64Url = await fileToBase64(file);
            insertImageAtCursor(base64Url, file.name);
            showToast('התמונה נוספה בהצלחה!', 'success');
        } catch (error) {
            console.error('Image conversion error:', error);
            showToast('שגיאה בהוספת התמונה', 'error');
        }
    }

    // Reset file input
    event.target.value = '';
}

/**
 * Convert file to base64 data URL
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Insert image HTML at cursor position in editor
 */
function insertImageAtCursor(url, alt = '') {
    const editor = document.getElementById('article-content');
    editor.focus();

    const imgHtml = `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; margin: 1rem 0; border-radius: 8px;">`;

    document.execCommand('insertHTML', false, imgHtml);
}

/**
 * Toggle article preview panel
 */
export function togglePreview() {
    const previewPanel = document.getElementById('preview-panel');
    const editor = document.querySelector('.editor-panel');

    if (previewPanel.style.display === 'none') {
        previewPanel.style.display = 'block';
        updatePreview();
    } else {
        previewPanel.style.display = 'none';
    }
}

/**
 * Update article preview with current content
 */
export function updatePreview() {
    const content = document.getElementById('article-content').innerHTML;
    const preview = document.getElementById('article-preview');

    if (preview) {
        preview.innerHTML = content;
        // Re-highlight code blocks in preview if Highlight.js available
        if (typeof hljs !== 'undefined') {
            preview.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
    }
}

/**
 * Insert a code block at cursor position
 */
export function insertCodeBlock() {
    const editor = document.getElementById('article-content');
    editor.focus();

    const codeHtml = `<pre><code contenteditable="true">// הקלד קוד כאן</code></pre><p><br></p>`;
    document.execCommand('insertHTML', false, codeHtml);
}

/**
 * Insert a blockquote at cursor position
 */
export function insertBlockquote() {
    const editor = document.getElementById('article-content');
    editor.focus();

    const selection = window.getSelection();
    const selectedText = selection.toString() || 'טקסט ציטוט';

    const quoteHtml = `<blockquote style="border-right: 4px solid #c41e3a; padding-right: 1rem; margin: 1rem 0; color: #555; font-style: italic;">${selectedText}</blockquote><p><br></p>`;
    document.execCommand('insertHTML', false, quoteHtml);
}

/**
 * Insert a horizontal rule
 */
export function insertHorizontalRule() {
    const editor = document.getElementById('article-content');
    editor.focus();

    document.execCommand('insertHTML', false, '<hr style="border: none; border-top: 2px solid #ddd; margin: 2rem 0;"><p><br></p>');
}

/**
 * Insert a basic table
 */
/**
 * Insert a table - Opens the Table Creator Modal
 */
export function insertTable() {
    const modal = document.getElementById('table-creator-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Focus first input
        setTimeout(() => {
            document.getElementById('table-rows').focus();
        }, 100);
    }
}

/**
 * Close the table creator modal
 */
export function closeTableCreatorModal() {
    const modal = document.getElementById('table-creator-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Confirm and insert the table based on modal inputs
 */
export function confirmInsertTable() {
    const rows = parseInt(document.getElementById('table-rows').value) || 3;
    const cols = parseInt(document.getElementById('table-cols').value) || 3;
    const hasHeader = document.getElementById('table-header').checked;

    const editor = document.getElementById('article-content');
    editor.focus();

    // Generate Table HTML
    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">';

    // Header
    if (hasHeader) {
        tableHtml += '<thead><tr>';
        for (let j = 0; j < cols; j++) {
            tableHtml += `<th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5; text-align: right;">כותרת ${j + 1}</th>`;
        }
        tableHtml += '</tr></thead>';
    }

    // Body
    // If has header, we can subtract 1 from rows count if we consider input as total rows,
    // OR just treat input as data rows.
    // Standard expectation: "Rows" usually means data rows in this context, or total structure.
    // Let's assume Rows = Data Rows to be generous.
    const dataRows = rows;

    tableHtml += '<tbody>';
    for (let i = 0; i < dataRows; i++) {
        tableHtml += '<tr>';
        for (let j = 0; j < cols; j++) {
            tableHtml += `<td style="border: 1px solid #ddd; padding: 0.75rem; text-align: right;">תא ${i + 1}-${j + 1}</td>`;
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';

    document.execCommand('insertHTML', false, tableHtml);
    closeTableCreatorModal();
}

/**
 * Indent the current block (move right)
 */
export function indentBlock() {
    document.execCommand('indent', false, null);
    document.getElementById('article-content').focus();
}

/**
 * Outdent the current block (move left)
 */
export function outdentBlock() {
    document.execCommand('outdent', false, null);
    document.getElementById('article-content').focus();
}

/**
 * Set text direction (LTR/RTL) for the current block
 */
export function setDirection(dir) {
    console.log('setDirection called with:', dir);
    const editor = document.getElementById('article-content');

    // Save current selection before any focus changes
    const selection = window.getSelection();
    let savedRange = null;
    if (selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
    }

    editor.focus();

    // Restore selection if it was saved
    if (savedRange) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
    }

    if (!selection.rangeCount) {
        console.log('No selection range');
        return;
    }

    const range = selection.getRangeAt(0);
    console.log('Range:', range);

    // Find the nearest block element
    let block = range.commonAncestorContainer;
    if (block.nodeType === 3) { // Text node
        block = block.parentNode;
    }
    console.log('Starting block:', block, block?.tagName);

    // List of block-level tag names
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI', 'TABLE', 'TR', 'TD', 'TH', 'THEAD', 'TBODY'];

    // Traverse up until we find a block-level element or the editor itself
    while (block && block !== editor && !blockTags.includes(block.tagName)) {
        block = block.parentNode;
    }
    console.log('Found block:', block, block?.tagName);

    // If we reached the editor itself, apply direction to all children
    if (block === editor) {
        console.log('Block is editor, applying to all children');

        // Apply to all immediate child elements
        const children = editor.children;
        if (children.length > 0) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                child.setAttribute('dir', dir);
                child.style.direction = dir;
                child.style.textAlign = dir === 'ltr' ? 'left' : 'right';

                // If it's a list, also apply all necessary styles
                if (child.tagName === 'UL' || child.tagName === 'OL') {
                    child.style.paddingLeft = dir === 'ltr' ? '2rem' : '0';
                    child.style.paddingRight = dir === 'ltr' ? '0' : '2rem';
                    child.style.listStylePosition = 'outside';

                    child.querySelectorAll('li').forEach(li => {
                        li.setAttribute('dir', dir);
                        li.style.direction = dir;
                        li.style.textAlign = dir === 'ltr' ? 'left' : 'right';
                    });
                }
            }
            console.log('Applied to', children.length, 'children');
        } else {
            // No child elements - just text nodes in the editor
            // Wrap all content in a div
            const content = editor.innerHTML;
            if (content.trim()) {
                editor.innerHTML = `<div dir="${dir}" style="direction: ${dir}; text-align: ${dir === 'ltr' ? 'left' : 'right'};">${content}</div>`;
                console.log('Wrapped all content in div');
            }
        }
        return;
    }

    // Apply direction to the found block
    if (block && block !== editor) {
        console.log('Applying direction to block:', block.tagName);
        block.setAttribute('dir', dir);
        block.style.direction = dir;
        block.style.textAlign = dir === 'ltr' ? 'left' : 'right';

        // For list items, also set the parent list direction
        if (block.tagName === 'LI' && block.parentElement) {
            block.parentElement.setAttribute('dir', dir);
            block.parentElement.style.direction = dir;
            console.log('Also applied to parent list');
        }
        // For UL/OL, apply to all items with full styling
        if (block.tagName === 'UL' || block.tagName === 'OL') {
            // Apply all necessary styles to the list itself
            block.style.paddingLeft = dir === 'ltr' ? '2rem' : '0';
            block.style.paddingRight = dir === 'ltr' ? '0' : '2rem';
            block.style.listStylePosition = 'outside';

            block.querySelectorAll('li').forEach(li => {
                li.setAttribute('dir', dir);
                li.style.direction = dir;
                li.style.textAlign = dir === 'ltr' ? 'left' : 'right';
            });
            console.log('Applied to all list items');
        }
        // For table cells, set the table direction
        if (['TD', 'TH'].includes(block.tagName)) {
            let table = block.closest('table');
            if (table) {
                table.setAttribute('dir', dir);
                table.style.direction = dir;
                console.log('Also applied to table');
            }
        }
    }
}


/**
 * Keyboard shortcuts map
 * Format: { key: { ctrl: boolean, shift: boolean, action: function } }
 */
const KEYBOARD_SHORTCUTS = {
    'b': { ctrl: true, shift: false, action: () => formatText('bold'), description: 'מודגש (Bold)' },
    'i': { ctrl: true, shift: false, action: () => formatText('italic'), description: 'נטוי (Italic)' },
    'u': { ctrl: true, shift: false, action: () => formatText('underline'), description: 'קו תחתון (Underline)' },
    'r': { ctrl: true, shift: false, action: () => formatText('justifyRight'), description: 'יישור לימין' },
    'l': { ctrl: true, shift: false, action: () => formatText('justifyLeft'), description: 'יישור לשמאל' },
    'e': { ctrl: true, shift: false, action: () => formatText('justifyCenter'), description: 'מרכז' },
    'j': { ctrl: true, shift: false, action: () => formatText('justifyFull'), description: 'יישור מלא' },
    'k': { ctrl: true, shift: false, action: () => insertLink(), description: 'הוסף קישור' },
    'h': { ctrl: true, shift: false, action: () => insertHeading(), description: 'הוסף כותרת' },
    ']': { ctrl: true, shift: false, action: () => indentBlock(), description: 'הזז ימינה (Indent)' },
    '[': { ctrl: true, shift: false, action: () => outdentBlock(), description: 'הזז שמאלה (Outdent)' },
    '1': { ctrl: true, shift: false, action: () => formatText('insertOrderedList'), description: 'רשימה ממוספרת' },
    '8': { ctrl: true, shift: true, action: () => formatText('insertUnorderedList'), description: 'רשימת תבליטים' },
    'q': { ctrl: true, shift: false, action: () => insertBlockquote(), description: 'ציטוט' },
    'd': { ctrl: true, shift: false, action: () => formatText('strikeThrough'), description: 'קו חוצה' },
};

/**
 * Handle keyboard shortcuts in the editor
 */
function handleEditorKeydown(event) {
    const key = event.key.toLowerCase();
    const shortcut = KEYBOARD_SHORTCUTS[key];

    if (!shortcut) return;

    // Check if the required modifiers match
    const ctrlPressed = event.ctrlKey || event.metaKey; // metaKey for Mac
    const shiftPressed = event.shiftKey;

    if (shortcut.ctrl === ctrlPressed && shortcut.shift === shiftPressed) {
        event.preventDefault();
        shortcut.action();
    }
}

/**
 * Initialize keyboard shortcuts for the editor
 */
export function initEditorKeyboardShortcuts() {
    const editor = document.getElementById('article-content');
    if (!editor) return;

    // Remove existing listener to prevent duplicates
    editor.removeEventListener('keydown', handleEditorKeydown);

    // Add keyboard shortcut listener
    editor.addEventListener('keydown', handleEditorKeydown);

    console.log('Editor keyboard shortcuts initialized');
}

/**
 * Get list of available keyboard shortcuts
 */
export function getKeyboardShortcuts() {
    return Object.entries(KEYBOARD_SHORTCUTS).map(([key, config]) => ({
        key: key.toUpperCase(),
        ctrl: config.ctrl,
        shift: config.shift,
        description: config.description
    }));
}

// Export functions to window for inline onclick handlers
export function initEditorGlobals() {
    window.formatText = formatText;
    window.changeFontSize = changeFontSize;
    window.changeFontName = changeFontName;
    window.changeTextColor = changeTextColor;
    window.changeBackColor = changeBackColor;
    window.insertHeading = insertHeading;
    window.insertLink = insertLink;
    window.triggerImageUpload = triggerImageUpload;
    window.handleImageUpload = handleImageUpload;
    window.togglePreview = togglePreview;
    window.updatePreview = updatePreview;
    window.insertCodeBlock = insertCodeBlock;
    window.insertBlockquote = insertBlockquote;
    window.insertHorizontalRule = insertHorizontalRule;
    window.insertTable = insertTable;
    window.closeTableCreatorModal = closeTableCreatorModal;
    window.confirmInsertTable = confirmInsertTable;
    window.indentBlock = indentBlock;
    window.outdentBlock = outdentBlock;
    window.setDirection = setDirection;
    window.getKeyboardShortcuts = getKeyboardShortcuts;

    // Initialize keyboard shortcuts for the editor
    // Use setTimeout to ensure the editor element is in the DOM
    setTimeout(() => {
        initEditorKeyboardShortcuts();
    }, 100);
}

