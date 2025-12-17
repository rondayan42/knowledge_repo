/* ==========================================
   File Attachments Module
   Upload, manage, and display file attachments
   ========================================== */

import { state, setCurrentAttachments, setUploadsInProgress } from './state.js';
import { escapeHtml, showToast, getFileIcon, formatFileSize } from './utils.js';

/**
 * Initialize file upload functionality
 */
export function initFileUpload() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('file-upload-area');
    
    if (!fileInput || !uploadArea) return;
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });
}

/**
 * Handle file input selection
 */
function handleFileSelect(e) {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input
}

/**
 * Process uploaded files
 */
export function handleFiles(files) {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed',
        'image/png',
        'image/jpeg',
        'image/gif'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    for (const file of files) {
        // Check file type
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|png|jpg|jpeg|gif)$/i)) {
            showToast(`סוג קובץ לא נתמך: ${file.name}`, 'error');
            continue;
        }
        
        // Check file size
        if (file.size > maxSize) {
            showToast(`הקובץ גדול מדי (מקסימום 10MB): ${file.name}`, 'error');
            continue;
        }

        // If API is available, upload to server/cloud
        if (typeof isUsingAPI === 'function' && isUsingAPI()) {
            setUploadsInProgress(state.uploadsInProgress + 1);
            renderAttachments();
            showToast(`מעלה את "${file.name}"...`, 'info');
            API.uploadAttachment(file)
                .then(att => {
                    state.currentAttachments.push({
                        id: String(att.id),
                        name: att.file_name,
                        size: att.size,
                        url: att.url,
                        mime_type: att.mime_type
                    });
                    setUploadsInProgress(Math.max(0, state.uploadsInProgress - 1));
                    renderAttachments();
                    showToast(`הקובץ "${file.name}" הועלה ונשמר בענן`, 'success');
                })
                .catch(err => {
                    console.error('Upload error', err);
                    setUploadsInProgress(Math.max(0, state.uploadsInProgress - 1));
                    renderAttachments();
                    showToast(`שגיאה בהעלאת הקובץ: ${file.name}`, 'error');
                });
        } else {
            // Local fallback: base64 in localStorage
            const reader = new FileReader();
            reader.onload = (e) => {
                const attachment = {
                    id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                };
                state.currentAttachments.push(attachment);
                renderAttachments();
                showToast(`הקובץ "${file.name}" נוסף בהצלחה`, 'success');
            };
            reader.readAsDataURL(file);
        }
    }
}

/**
 * Render attachments list in editor
 */
export function renderAttachments() {
    const container = document.getElementById('attachments-list');
    if (!container) return;
    
    const uploadingHtml = state.uploadsInProgress > 0 ? `
        <div class="uploading-indicator">
            <span class="spinner"></span>
            <span>מעלה ${state.uploadsInProgress} קובץ${state.uploadsInProgress > 1 ? 'ים' : ''}...</span>
        </div>
    ` : '';

    const itemsHtml = state.currentAttachments.map(att => `
        <div class="attachment-item">
            <div class="attachment-info">
                <span class="attachment-icon">${getFileIcon(att.name)}</span>
                <div class="attachment-details">
                    <span class="attachment-name">${escapeHtml(att.name)}</span>
                    <span class="attachment-size">${formatFileSize(att.size)}</span>
                </div>
            </div>
            <div class="attachment-actions">
                ${att.url ? `<a class="btn-download" href="${att.url}" download target="_blank">הורדה</a>` : ''}
                <button type="button" class="btn-remove-attachment" onclick="removeAttachment('${att.id}')">הסר</button>
            </div>
        </div>
    `).join('');

    if (!itemsHtml && !uploadingHtml) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = uploadingHtml + itemsHtml;
}

/**
 * Remove an attachment
 */
export function removeAttachment(id) {
    setCurrentAttachments(state.currentAttachments.filter(a => a.id !== id));
    renderAttachments();
}

/**
 * Download an attachment
 */
export function downloadAttachment(id) {
    const attachment = state.currentAttachments.find(a => a.id === id);
    if (!attachment) return;
    
    const href = attachment.url || attachment.data;
    if (!href) return;
    const link = document.createElement('a');
    link.href = href;
    link.download = attachment.name;
    link.target = '_blank';
    link.click();
}

// Export to window for inline handlers
export function initAttachmentsGlobals() {
    window.removeAttachment = removeAttachment;
    window.downloadAttachment = downloadAttachment;
}
