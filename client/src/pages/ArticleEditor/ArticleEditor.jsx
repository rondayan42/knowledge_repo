/* ==========================================
   Article Editor Page
   Create/Edit articles with rich text editor
   Full-featured toolbar matching original vanilla JS
   ========================================== */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { articlesAPI, categoriesAPI, departmentsAPI, prioritiesAPI, uploadAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { importFile } from '../../utils/fileImporter';
import './ArticleEditor.css';

const ArticleEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const isEditing = !!id;
    const imageInputRef = useRef(null);
    const importInputRef = useRef(null);

    // Form state
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [priorityId, setPriorityId] = useState('');
    const [customTags, setCustomTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [attachments, setAttachments] = useState([]);

    // Metadata state
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Color pickers state
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Preset colors
    const presetColors = [
        '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
        '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
        '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    ];

    // TipTap editor with all extensions
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4] },
            }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
            Image,
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
        ],
        content: '',
    });

    // Load metadata
    useEffect(() => {
        const loadData = async () => {
            try {
                const [cats, deps, pris] = await Promise.all([
                    categoriesAPI.getAll(),
                    departmentsAPI.getAll(),
                    prioritiesAPI.getAll(),
                ]);
                setCategories(cats || []);
                setDepartments(deps || []);
                setPriorities(pris || []);

                // If editing, load article
                if (id) {
                    const article = await articlesAPI.getOne(id);
                    setTitle(article.title || '');
                    setSummary(article.summary || '');
                    setCategoryId(article.category_id?.toString() || '');
                    setDepartmentId(article.department_id?.toString() || '');
                    setPriorityId(article.priority_id?.toString() || '');
                    setCustomTags(article.tags?.map(t => t.name) || []);
                    setAttachments(article.attachments || []);
                    editor?.commands.setContent(article.content || '');
                }
            } catch (err) {
                toast.error('שגיאה בטעינת הנתונים');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, editor]);

    const handleAddTag = () => {
        const tag = tagInput.trim();
        if (tag && !customTags.includes(tag)) {
            setCustomTags([...customTags, tag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setCustomTags(customTags.filter(t => t !== tagToRemove));
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            try {
                const result = await uploadAPI.uploadAttachment(file);
                setAttachments(prev => [...prev, result]);
                toast.success(`הקובץ ${file.name} הועלה בהצלחה`);
            } catch (err) {
                toast.error(`שגיאה בהעלאת ${file.name}`);
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('נא לבחור קובץ תמונה בלבד');
            return;
        }

        try {
            const result = await uploadAPI.uploadImage(file);
            editor?.chain().focus().setImage({ src: result.url }).run();
            toast.success('התמונה הועלתה בהצלחה');
        } catch (err) {
            toast.error('שגיאה בהעלאת התמונה');
        }
    };

    const handleInsertLink = () => {
        const url = prompt('הזן כתובת URL:');
        if (url) {
            editor?.chain().focus().setLink({ href: url }).run();
        }
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        try {
            toast.info('מייבא קובץ...');
            const { title: importedTitle, summary: importedSummary, html } = await importFile(file);

            if (importedTitle && !title) setTitle(importedTitle);
            if (importedSummary && !summary) setSummary(importedSummary);
            if (html) editor?.commands.setContent(html);

            toast.success('הקובץ יובא בהצלחה!');
        } catch (err) {
            toast.error(err.message || 'שגיאה בייבוא הקובץ');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        try {
            toast.info('מייבא קובץ...');
            const { title: importedTitle, summary: importedSummary, html } = await importFile(file);

            if (importedTitle && !title) setTitle(importedTitle);
            if (importedSummary && !summary) setSummary(importedSummary);
            if (html) editor?.commands.setContent(html);

            toast.success('הקובץ יובא בהצלחה!');
        } catch (err) {
            toast.error(err.message || 'שגיאה בייבוא הקובץ');
        }
    };

    const handleInsertTable = () => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !categoryId || !departmentId || !priorityId) {
            toast.error('נא למלא את כל השדות הנדרשים');
            return;
        }

        setSaving(true);

        try {
            const articleData = {
                title,
                summary,
                content: editor?.getHTML() || '',
                category_id: parseInt(categoryId),
                department_id: parseInt(departmentId),
                priority_id: parseInt(priorityId),
                tags: customTags,
                attachmentIds: attachments.map(a => a.id).filter(Boolean),
            };

            if (isEditing) {
                await articlesAPI.update(id, articleData);
                toast.success('המאמר עודכן בהצלחה!');
            } else {
                await articlesAPI.create(articleData);
                toast.success('המאמר נוצר בהצלחה!');
            }

            navigate('/');
        } catch (err) {
            toast.error('שגיאה בשמירת המאמר');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק מאמר זה?')) return;

        try {
            await articlesAPI.delete(id);
            toast.success('המאמר נמחק בהצלחה!');
            navigate('/');
        } catch (err) {
            toast.error('שגיאה במחיקת המאמר');
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>טוען...</p>
            </div>
        );
    }

    return (
        <section className="editor-view">
            <div className="editor-container">
                <h2>{isEditing ? 'עריכת מאמר' : 'יצירת מאמר חדש'}</h2>

                {/* Import area */}
                <div
                    className={`import-dropzone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => importInputRef.current?.click()}
                >
                    <i className="fa-solid fa-file-import"></i>
                    <span>גרור קובץ לכאן או לחץ לייבוא (DOCX, HTML, Markdown)</span>
                    <input
                        type="file"
                        ref={importInputRef}
                        onChange={handleImportFile}
                        accept=".docx,.doc,.html,.htm,.md,.markdown,.txt"
                        style={{ display: 'none' }}
                    />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">כותרת המאמר:</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="הזן כותרת..."
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="category">קטגוריה:</label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="">בחר קטגוריה</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="department">מחלקה:</label>
                            <select
                                id="department"
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                required
                            >
                                <option value="">בחר מחלקה</option>
                                {departments.map(dep => (
                                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="priority">עדיפות:</label>
                            <select
                                id="priority"
                                value={priorityId}
                                onChange={(e) => setPriorityId(e.target.value)}
                                required
                            >
                                <option value="">בחר עדיפות</option>
                                {priorities.map(pri => (
                                    <option key={pri.id} value={pri.id}>{pri.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="summary">תקציר:</label>
                        <textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            rows="2"
                            placeholder="תקציר קצר של המאמר..."
                        />
                    </div>

                    <div className="form-group">
                        <label>תוכן המאמר:</label>

                        {/* Full-featured toolbar */}
                        <div className="editor-toolbar">
                            {/* Text formatting group */}
                            <div className="toolbar-group">
                                <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
                                    className={editor?.isActive('bold') ? 'active' : ''} title="מודגש (Ctrl+B)">
                                    <i className="fa-solid fa-bold"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
                                    className={editor?.isActive('italic') ? 'active' : ''} title="נטוי (Ctrl+I)">
                                    <i className="fa-solid fa-italic"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()}
                                    className={editor?.isActive('underline') ? 'active' : ''} title="קו תחתון (Ctrl+U)">
                                    <i className="fa-solid fa-underline"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()}
                                    className={editor?.isActive('strike') ? 'active' : ''} title="קו חוצה">
                                    <i className="fa-solid fa-strikethrough"></i>
                                </button>
                            </div>

                            <div className="toolbar-divider"></div>

                            {/* Headings group */}
                            <div className="toolbar-group">
                                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                    className={editor?.isActive('heading', { level: 1 }) ? 'active' : ''} title="כותרת 1">
                                    H1
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                    className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''} title="כותרת 2">
                                    H2
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                                    className={editor?.isActive('heading', { level: 3 }) ? 'active' : ''} title="כותרת 3">
                                    H3
                                </button>
                            </div>

                            <div className="toolbar-divider"></div>

                            {/* Lists group */}
                            <div className="toolbar-group">
                                <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                    className={editor?.isActive('bulletList') ? 'active' : ''} title="רשימת תבליטים">
                                    <i className="fa-solid fa-list-ul"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                    className={editor?.isActive('orderedList') ? 'active' : ''} title="רשימה ממוספרת">
                                    <i className="fa-solid fa-list-ol"></i>
                                </button>
                            </div>

                            <div className="toolbar-divider"></div>

                            {/* Alignment group */}
                            <div className="toolbar-group">
                                <button type="button" onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                                    className={editor?.isActive({ textAlign: 'right' }) ? 'active' : ''} title="יישור לימין">
                                    <i className="fa-solid fa-align-right"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                                    className={editor?.isActive({ textAlign: 'center' }) ? 'active' : ''} title="מרכז">
                                    <i className="fa-solid fa-align-center"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                                    className={editor?.isActive({ textAlign: 'left' }) ? 'active' : ''} title="יישור לשמאל">
                                    <i className="fa-solid fa-align-left"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                                    className={editor?.isActive({ textAlign: 'justify' }) ? 'active' : ''} title="יישור מלא">
                                    <i className="fa-solid fa-align-justify"></i>
                                </button>
                            </div>

                            <div className="toolbar-divider"></div>

                            {/* Colors group */}
                            <div className="toolbar-group color-pickers">
                                <div className="color-picker-wrapper">
                                    <button type="button" onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                                        className="color-btn" title="צבע טקסט">
                                        <i className="fa-solid fa-font"></i>
                                        <span className="color-indicator" style={{ backgroundColor: '#000' }}></span>
                                    </button>
                                    {showTextColorPicker && (
                                        <div className="color-dropdown">
                                            {presetColors.map(color => (
                                                <button key={color} type="button"
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => {
                                                        editor?.chain().focus().setColor(color).run();
                                                        setShowTextColorPicker(false);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="color-picker-wrapper">
                                    <button type="button" onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                                        className="color-btn" title="צבע רקע">
                                        <i className="fa-solid fa-highlighter"></i>
                                    </button>
                                    {showBgColorPicker && (
                                        <div className="color-dropdown">
                                            {presetColors.map(color => (
                                                <button key={color} type="button"
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => {
                                                        editor?.chain().focus().toggleHighlight({ color }).run();
                                                        setShowBgColorPicker(false);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="toolbar-divider"></div>

                            {/* Insert group */}
                            <div className="toolbar-group">
                                <button type="button" onClick={handleInsertLink} title="הוסף קישור">
                                    <i className="fa-solid fa-link"></i>
                                </button>
                                <button type="button" onClick={() => imageInputRef.current?.click()} title="הוסף תמונה">
                                    <i className="fa-solid fa-image"></i>
                                </button>
                                <button type="button" onClick={handleInsertTable} title="הוסף טבלה">
                                    <i className="fa-solid fa-table"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                                    className={editor?.isActive('codeBlock') ? 'active' : ''} title="בלוק קוד">
                                    <i className="fa-solid fa-code"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                    className={editor?.isActive('blockquote') ? 'active' : ''} title="ציטוט">
                                    <i className="fa-solid fa-quote-right"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="קו אופקי">
                                    <i className="fa-solid fa-minus"></i>
                                </button>
                            </div>

                            <div className="toolbar-divider"></div>

                            {/* History group */}
                            <div className="toolbar-group">
                                <button type="button" onClick={() => editor?.chain().focus().undo().run()}
                                    disabled={!editor?.can().undo()} title="בטל">
                                    <i className="fa-solid fa-rotate-left"></i>
                                </button>
                                <button type="button" onClick={() => editor?.chain().focus().redo().run()}
                                    disabled={!editor?.can().redo()} title="בצע שוב">
                                    <i className="fa-solid fa-rotate-right"></i>
                                </button>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={imageInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />

                        <EditorContent editor={editor} className="rich-editor" />
                    </div>

                    <div className="form-group">
                        <label>תגיות נוספות:</label>
                        <div className="tags-input-container">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                placeholder="הוסף תגית..."
                            />
                            <button type="button" onClick={handleAddTag} className="add-tag-btn">+</button>
                        </div>
                        <div className="custom-tags-list">
                            {customTags.map(tag => (
                                <span key={tag} className="tag">
                                    {tag}
                                    <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>קבצים מצורפים:</label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.png,.jpg,.jpeg,.gif"
                        />
                        <div className="attachments-list">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="attachment-item">
                                    <span>{att.file_name || att.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'שומר...' : 'שמור מאמר'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
                            ביטול
                        </button>
                        {isEditing && (
                            <button type="button" className="btn-danger" onClick={handleDelete}>
                                מחק מאמר
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
};

export default ArticleEditor;
