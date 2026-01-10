/* ==========================================
   Articles Page
   Display article list with search/filter
   ========================================== */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesAPI, categoriesAPI, departmentsAPI, prioritiesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Articles.css';

const Articles = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // Data state
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [articlesData, categoriesData, departmentsData, prioritiesData] = await Promise.all([
                    articlesAPI.getAll(),
                    categoriesAPI.getAll(),
                    departmentsAPI.getAll(),
                    prioritiesAPI.getAll(),
                ]);

                setArticles(articlesData || []);
                setCategories(categoriesData || []);
                setDepartments(departmentsData || []);
                setPriorities(prioritiesData || []);
            } catch (err) {
                toast.error('שגיאה בטעינת הנתונים');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Filter and sort articles
    const filteredArticles = useMemo(() => {
        let result = [...articles];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(article =>
                article.title?.toLowerCase().includes(term) ||
                article.summary?.toLowerCase().includes(term) ||
                article.content?.toLowerCase().includes(term) ||
                article.tags?.some(t => t.name?.toLowerCase().includes(term))
            );
        }

        // Category filter
        if (categoryFilter) {
            result = result.filter(a => a.category_name === categoryFilter);
        }

        // Department filter
        if (departmentFilter) {
            result = result.filter(a => a.department_name === departmentFilter);
        }

        // Priority filter
        if (priorityFilter) {
            result = result.filter(a => a.priority_name === priorityFilter);
        }

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.updated_at) - new Date(b.updated_at);
                case 'date-desc':
                    return new Date(b.updated_at) - new Date(a.updated_at);
                case 'title-asc':
                    return (a.title || '').localeCompare(b.title || '', 'he');
                case 'title-desc':
                    return (b.title || '').localeCompare(a.title || '', 'he');
                case 'priority':
                    return (b.priority_level || 0) - (a.priority_level || 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [articles, searchTerm, categoryFilter, departmentFilter, priorityFilter, sortBy]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>טוען מאמרים...</p>
            </div>
        );
    }

    return (
        <section className="articles-view">
            <div className="articles-header">
                <h2>כל המאמרים</h2>

                <div className="filters-section">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="חיפוש מאמרים..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="search-icon">
                            <i className="fa-solid fa-magnifying-glass"></i>
                        </span>
                    </div>

                    <div className="filter-dropdowns">
                        <div className="dropdown-group">
                            <label>קטגוריה:</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="">הכל</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dropdown-group">
                            <label>מחלקה:</label>
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <option value="">הכל</option>
                                {departments.map(dep => (
                                    <option key={dep.id} value={dep.name}>{dep.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dropdown-group">
                            <label>עדיפות:</label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                            >
                                <option value="">הכל</option>
                                {priorities.map(pri => (
                                    <option key={pri.id} value={pri.name}>{pri.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dropdown-group">
                            <label>מיון לפי:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="date-desc">תאריך (חדש לישן)</option>
                                <option value="date-asc">תאריך (ישן לחדש)</option>
                                <option value="title-asc">שם (א-ת)</option>
                                <option value="title-desc">שם (ת-א)</option>
                                <option value="priority">עדיפות</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="articles-grid">
                {filteredArticles.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <i className="fa-solid fa-file-lines"></i>
                        </div>
                        <h3>אין מאמרים להצגה</h3>
                        <p>צרו את המאמר הראשון שלכם באמצעות עורך המאמרים</p>
                    </div>
                ) : (
                    filteredArticles.map(article => (
                        <div
                            key={article.id}
                            className="article-card"
                            onClick={() => navigate(`/articles/${article.id}`)}
                        >
                            <div className="article-card-header">
                                <h3>{article.title}</h3>
                                <div className="article-meta">
                                    <span><i className="fa-solid fa-folder"></i> {article.category_name}</span>
                                    <span><i className="fa-solid fa-building"></i> {article.department_name}</span>
                                    {article.attachments?.length > 0 && (
                                        <span><i className="fa-solid fa-paperclip"></i> {article.attachments.length} קבצים</span>
                                    )}
                                </div>
                            </div>

                            <div className="article-card-body">
                                <p className="article-summary">{article.summary || 'אין תקציר'}</p>
                                <div className="article-tags">
                                    <span className="tag category">{article.category_name}</span>
                                    <span className="tag department">{article.department_name}</span>
                                    <span className="tag priority">{article.priority_name}</span>
                                    {article.tags?.map(tag => (
                                        <span key={tag.id} className="tag">{tag.name}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="article-card-footer">
                                <span className="article-date">עודכן: {formatDate(article.updated_at)}</span>
                                <div className="article-actions">
                                    <button
                                        className="btn-edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/editor/${article.id}`);
                                        }}
                                    >
                                        עריכה
                                    </button>
                                    <button
                                        className="btn-view"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/articles/${article.id}`);
                                        }}
                                    >
                                        צפייה
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default Articles;
