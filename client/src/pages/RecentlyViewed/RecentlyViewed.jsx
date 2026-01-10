/* ==========================================
   Recently Viewed Page
   Display recently viewed articles
   ========================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recentlyViewedAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './RecentlyViewed.css';

const RecentlyViewed = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRecentlyViewed();
    }, []);

    const loadRecentlyViewed = async () => {
        try {
            setError(null);
            const data = await recentlyViewedAPI.getAll();
            setRecentlyViewed(data || []);
        } catch (err) {
            console.error('Error loading recently viewed:', err);
            // Don't redirect to login on error - just show empty state
            setError('שגיאה בטעינת ההיסטוריה');
            setRecentlyViewed([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!window.confirm('האם לנקות את היסטוריית הצפייה?')) return;
        try {
            await recentlyViewedAPI.clear();
            setRecentlyViewed([]);
            toast.success('ההיסטוריה נוקתה');
        } catch (err) {
            toast.error('שגיאה בניקוי ההיסטוריה');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>טוען היסטוריה...</p>
            </div>
        );
    }

    return (
        <section className="recently-viewed-view">
            <div className="articles-header">
                <h2><i className="fa-solid fa-clock-rotate-left"></i> מאמרים שנצפו לאחרונה</h2>
                {recentlyViewed.length > 0 && (
                    <button className="btn-clear-history" onClick={handleClearHistory}>
                        <i className="fa-solid fa-trash"></i> נקה היסטוריה
                    </button>
                )}
            </div>

            {error ? (
                <div className="error-state">
                    <p>{error}</p>
                    <button onClick={loadRecentlyViewed} className="btn-retry">נסה שוב</button>
                </div>
            ) : (
                <div className="articles-grid">
                    {recentlyViewed.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <i className="fa-solid fa-clock-rotate-left"></i>
                            </div>
                            <h3>אין היסטוריית צפייה</h3>
                            <p>מאמרים שתצפו בהם יופיעו כאן</p>
                        </div>
                    ) : (
                        recentlyViewed.map(item => (
                            <div
                                key={item.article_id || item.id}
                                className="article-card"
                                onClick={() => navigate(`/articles/${item.article_id || item.id}`)}
                            >
                                <div className="article-card-header">
                                    <h3>{item.article?.title || item.title || 'מאמר'}</h3>
                                </div>
                                <div className="article-card-body">
                                    <p className="article-summary">{item.article?.summary || item.summary || 'אין תקציר'}</p>
                                </div>
                                <div className="article-card-footer">
                                    <span className="article-date">נצפה: {formatDate(item.viewed_at || item.updated_at)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </section>
    );
};

export default RecentlyViewed;
