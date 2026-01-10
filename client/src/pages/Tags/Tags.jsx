/* ==========================================
   Tags Management Page
   Manage categories, departments, and priorities
   ========================================== */

import { useState, useEffect } from 'react';
import { categoriesAPI, departmentsAPI, prioritiesAPI, articlesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Tags.css';

const Tags = () => {
    const toast = useToast();

    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    // New item inputs
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [newDepartment, setNewDepartment] = useState('');
    const [newDepartmentDesc, setNewDepartmentDesc] = useState('');
    const [newPriority, setNewPriority] = useState('');
    const [newPriorityLevel, setNewPriorityLevel] = useState(2);
    const [newPriorityColor, setNewPriorityColor] = useState('#3b82f6');

    const priorityLevels = [
        { level: 1, icon: 'fa-arrow-down', text: 'נמוכה', color: '#22c55e' },
        { level: 2, icon: 'fa-minus', text: 'בינונית', color: '#eab308' },
        { level: 3, icon: 'fa-arrow-up', text: 'גבוהה', color: '#f97316' },
        { level: 4, icon: 'fa-fire', text: 'קריטית', color: '#ef4444' },
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cats, deps, pris, arts] = await Promise.all([
                categoriesAPI.getAll(),
                departmentsAPI.getAll(),
                prioritiesAPI.getAll(),
                articlesAPI.getAll(),
            ]);
            setCategories(cats || []);
            setDepartments(deps || []);
            setPriorities(pris || []);
            setArticles(arts || []);
        } catch (err) {
            toast.error('שגיאה בטעינת הנתונים');
        } finally {
            setLoading(false);
        }
    };

    const isTagInUse = (type, id) => {
        return articles.some(article => {
            switch (type) {
                case 'category': return article.category_id === id;
                case 'department': return article.department_id === id;
                case 'priority': return article.priority_id === id;
                default: return false;
            }
        });
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) {
            toast.error('נא להזין שם קטגוריה');
            return;
        }
        if (categories.some(c => c.name === newCategory.trim())) {
            toast.error('קטגוריה זו כבר קיימת');
            return;
        }
        try {
            await categoriesAPI.create(newCategory.trim(), newCategoryDesc.trim());
            toast.success('קטגוריה נוספה בהצלחה');
            setNewCategory('');
            setNewCategoryDesc('');
            loadData();
        } catch (err) {
            toast.error('שגיאה בהוספת קטגוריה');
        }
    };

    const handleAddDepartment = async () => {
        if (!newDepartment.trim()) {
            toast.error('נא להזין שם מחלקה');
            return;
        }
        if (departments.some(d => d.name === newDepartment.trim())) {
            toast.error('מחלקה זו כבר קיימת');
            return;
        }
        try {
            await departmentsAPI.create(newDepartment.trim(), newDepartmentDesc.trim());
            toast.success('מחלקה נוספה בהצלחה');
            setNewDepartment('');
            setNewDepartmentDesc('');
            loadData();
        } catch (err) {
            toast.error('שגיאה בהוספת מחלקה');
        }
    };

    const handleAddPriority = async () => {
        if (!newPriority.trim()) {
            toast.error('נא להזין שם עדיפות');
            return;
        }
        if (priorities.some(p => p.name === newPriority.trim())) {
            toast.error('עדיפות זו כבר קיימת');
            return;
        }
        try {
            await prioritiesAPI.create(newPriority.trim(), newPriorityLevel, newPriorityColor);
            toast.success('עדיפות נוספה בהצלחה');
            setNewPriority('');
            setNewPriorityLevel(2);
            setNewPriorityColor('#3b82f6');
            loadData();
        } catch (err) {
            toast.error('שגיאה בהוספת עדיפות');
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (isTagInUse('category', id)) {
            toast.error('לא ניתן למחוק קטגוריה שנמצאת בשימוש במאמרים');
            return;
        }
        if (!window.confirm(`האם למחוק את הקטגוריה "${name}"?`)) return;
        try {
            await categoriesAPI.delete(id);
            toast.success('קטגוריה נמחקה');
            loadData();
        } catch (err) {
            toast.error('לא ניתן למחוק קטגוריה בשימוש');
        }
    };

    const handleDeleteDepartment = async (id, name) => {
        if (isTagInUse('department', id)) {
            toast.error('לא ניתן למחוק מחלקה שנמצאת בשימוש במאמרים');
            return;
        }
        if (!window.confirm(`האם למחוק את המחלקה "${name}"?`)) return;
        try {
            await departmentsAPI.delete(id);
            toast.success('מחלקה נמחקה');
            loadData();
        } catch (err) {
            toast.error('לא ניתן למחוק מחלקה בשימוש');
        }
    };

    const handleDeletePriority = async (id, name) => {
        if (isTagInUse('priority', id)) {
            toast.error('לא ניתן למחוק עדיפות שנמצאת בשימוש במאמרים');
            return;
        }
        if (!window.confirm(`האם למחוק את העדיפות "${name}"?`)) return;
        try {
            await prioritiesAPI.delete(id);
            toast.success('עדיפות נמחקה');
            loadData();
        } catch (err) {
            toast.error('לא ניתן למחוק עדיפות בשימוש');
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
        <section className="manage-tags-view">
            <div className="tags-manager-container">
                <h2>ניהול תגיות</h2>

                <div className="tags-sections">
                    {/* Categories */}
                    <div className="tag-section">
                        <h3><i className="fa-solid fa-folder"></i> קטגוריות</h3>
                        <div className="add-tag-form">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="שם קטגוריה..."
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                            <input
                                type="text"
                                value={newCategoryDesc}
                                onChange={(e) => setNewCategoryDesc(e.target.value)}
                                placeholder="תיאור (אופציונלי)..."
                            />
                            <button onClick={handleAddCategory} className="btn-add">
                                <i className="fa-solid fa-plus"></i> הוסף
                            </button>
                        </div>
                        <ul className="tags-list">
                            {categories.map(cat => (
                                <li key={cat.id} className={isTagInUse('category', cat.id) ? 'in-use' : ''}>
                                    <div className="tag-info">
                                        <span className="tag-name">{cat.name}</span>
                                        {cat.description && <span className="tag-desc">{cat.description}</span>}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                        className="btn-delete-tag"
                                        disabled={isTagInUse('category', cat.id)}
                                        title={isTagInUse('category', cat.id) ? 'בשימוש' : 'מחק'}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </li>
                            ))}
                            {categories.length === 0 && <p className="empty-list">אין קטגוריות</p>}
                        </ul>
                    </div>

                    {/* Departments */}
                    <div className="tag-section">
                        <h3><i className="fa-solid fa-building"></i> מחלקות</h3>
                        <div className="add-tag-form">
                            <input
                                type="text"
                                value={newDepartment}
                                onChange={(e) => setNewDepartment(e.target.value)}
                                placeholder="שם מחלקה..."
                                onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
                            />
                            <input
                                type="text"
                                value={newDepartmentDesc}
                                onChange={(e) => setNewDepartmentDesc(e.target.value)}
                                placeholder="תיאור (אופציונלי)..."
                            />
                            <button onClick={handleAddDepartment} className="btn-add">
                                <i className="fa-solid fa-plus"></i> הוסף
                            </button>
                        </div>
                        <ul className="tags-list">
                            {departments.map(dep => (
                                <li key={dep.id} className={isTagInUse('department', dep.id) ? 'in-use' : ''}>
                                    <div className="tag-info">
                                        <span className="tag-name">{dep.name}</span>
                                        {dep.description && <span className="tag-desc">{dep.description}</span>}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDepartment(dep.id, dep.name)}
                                        className="btn-delete-tag"
                                        disabled={isTagInUse('department', dep.id)}
                                        title={isTagInUse('department', dep.id) ? 'בשימוש' : 'מחק'}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </li>
                            ))}
                            {departments.length === 0 && <p className="empty-list">אין מחלקות</p>}
                        </ul>
                    </div>

                    {/* Priorities */}
                    <div className="tag-section priority-section">
                        <h3><i className="fa-solid fa-flag"></i> עדיפויות</h3>
                        <div className="priority-creator">
                            <div className="priority-name-row">
                                <input
                                    type="text"
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value)}
                                    placeholder="שם עדיפות..."
                                    className="priority-name-input"
                                />
                                <div className="priority-color-wrapper">
                                    <span className="color-label">צבע:</span>
                                    <input
                                        type="color"
                                        value={newPriorityColor}
                                        onChange={(e) => setNewPriorityColor(e.target.value)}
                                        className="priority-color-input"
                                    />
                                </div>
                            </div>

                            <div className="priority-level-row">
                                <span className="level-label">רמת דחיפות:</span>
                                <div className="level-buttons">
                                    {priorityLevels.map(lvl => (
                                        <button
                                            key={lvl.level}
                                            type="button"
                                            className={`level-btn ${newPriorityLevel === lvl.level ? 'active' : ''}`}
                                            style={{ '--level-color': lvl.color }}
                                            onClick={() => setNewPriorityLevel(lvl.level)}
                                        >
                                            <span className="level-icon"><i className={`fa-solid ${lvl.icon}`}></i></span>
                                            <span className="level-text">{lvl.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={handleAddPriority} className="btn-add-priority">
                                <i className="fa-solid fa-plus"></i> הוסף עדיפות
                            </button>
                        </div>

                        <ul className="tags-list priority-list">
                            {priorities.map(pri => (
                                <li key={pri.id} className={isTagInUse('priority', pri.id) ? 'in-use' : ''}>
                                    <div className="tag-info">
                                        <span
                                            className="tag-name priority-badge"
                                            style={{
                                                backgroundColor: pri.color || '#3b82f6',
                                                color: '#fff'
                                            }}
                                        >
                                            {pri.name}
                                        </span>
                                        <span className="tag-level">רמה {pri.level}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePriority(pri.id, pri.name)}
                                        className="btn-delete-tag"
                                        disabled={isTagInUse('priority', pri.id)}
                                        title={isTagInUse('priority', pri.id) ? 'בשימוש' : 'מחק'}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </li>
                            ))}
                            {priorities.length === 0 && <p className="empty-list">אין עדיפויות</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Tags;
