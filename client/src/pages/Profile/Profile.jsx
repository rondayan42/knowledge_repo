/* ==========================================
   Profile Page
   User profile and admin user management
   ========================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, articlesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Profile.css';

const Profile = () => {
    const { user, isAdmin } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [myArticles, setMyArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load articles - all for admin, own for regular users
            const articles = await articlesAPI.getAll();
            if (isAdmin) {
                setMyArticles(articles || []);
            } else {
                const filtered = articles.filter(a => a.author_id === user?.id);
                setMyArticles(filtered);
            }

            // Load users if admin
            if (isAdmin) {
                const usersData = await usersAPI.getAll();
                setUsers(usersData || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await usersAPI.updateRole(userId, newRole);
            toast.success('תפקיד המשתמש עודכן');
            loadData();
        } catch (err) {
            toast.error('שגיאה בעדכון תפקיד');
        }
    };

    const handleApprove = async (userId, approved) => {
        try {
            await usersAPI.approve(userId, approved);
            toast.success(approved ? 'משתמש אושר' : 'אישור משתמש בוטל');
            loadData();
        } catch (err) {
            toast.error('שגיאה באישור משתמש');
        }
    };

    const handleDeleteArticle = async (articleId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק מאמר זה?')) return;

        try {
            await articlesAPI.delete(articleId);
            toast.success('המאמר נמחק בהצלחה');
            loadData();
        } catch (err) {
            toast.error('שגיאה במחיקת המאמר');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('he-IL');
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>טוען פרופיל...</p>
            </div>
        );
    }

    return (
        <section className="profile-view">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <i className="fa-solid fa-user-circle"></i>
                    </div>
                    <div className="profile-info">
                        <h2>{user?.email}</h2>
                        <span className={`profile-role-badge ${isAdmin ? 'admin' : ''}`}>
                            {isAdmin ? 'מנהל' : 'משתמש'}
                        </span>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-card">
                        <span className="stat-number">{myArticles.length}</span>
                        <span className="stat-label">{isAdmin ? 'כל המאמרים' : 'מאמרים'}</span>
                    </div>
                </div>

                <div className="profile-articles-section">
                    <h3><i className="fa-solid fa-file-lines"></i> {isAdmin ? 'כל המאמרים' : 'המאמרים שלי'}</h3>
                    {myArticles.length === 0 ? (
                        <p className="no-articles">עדיין לא יצרת מאמרים</p>
                    ) : (
                        <div className="profile-articles-grid">
                            {myArticles.map(article => {
                                const canEdit = isAdmin || article.author_id === user?.id;
                                return (
                                    <div key={article.id} className="mini-article-card">
                                        <div className="article-info">
                                            <h4 onClick={() => navigate(`/articles/${article.id}`)} style={{ cursor: 'pointer' }}>
                                                {article.title}
                                            </h4>
                                            <div className="article-meta">
                                                {article.category && <span><i className="fa-solid fa-folder"></i> {article.category}</span>}
                                                {article.updated_at && <span><i className="fa-solid fa-calendar"></i> {formatDate(article.updated_at)}</span>}
                                                {article.author && <span><i className="fa-solid fa-user"></i> {article.author}</span>}
                                            </div>
                                            {article.summary && <p className="article-summary">{article.summary}</p>}
                                        </div>
                                        {canEdit && (
                                            <div className="article-actions">
                                                <button
                                                    className="btn-edit-small"
                                                    onClick={() => navigate(`/editor/${article.id}`)}
                                                    title="עריכה"
                                                >
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button
                                                    className="btn-delete-small"
                                                    onClick={() => handleDeleteArticle(article.id)}
                                                    title="מחיקה"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="user-management-section">
                        <h3><i className="fa-solid fa-users-gear"></i> ניהול משתמשים</h3>
                        <p className="section-description">
                            כאן ניתן להפוך משתמשים למנהלים או להסיר הרשאות מנהל.
                        </p>
                        <div className="users-list">
                            {users.map(u => (
                                <div key={u.id} className="user-item">
                                    <div className="user-info">
                                        <span className="user-email">{u.email}</span>
                                        <span className={`user-role ${u.role}`}>{u.role}</span>
                                    </div>
                                    <div className="user-actions">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            disabled={u.id === user?.id}
                                        >
                                            <option value="user">משתמש</option>
                                            <option value="admin">מנהל</option>
                                        </select>
                                        <button
                                            className={`btn-approve ${u.approved ? 'approved' : ''}`}
                                            onClick={() => handleApprove(u.id, !u.approved)}
                                            disabled={u.id === user?.id}
                                        >
                                            {u.approved ? 'מאושר' : 'לא מאושר'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Profile;
