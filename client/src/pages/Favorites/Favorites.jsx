/* ==========================================
   Favorites Page
   Display user's favorite articles
   ========================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoritesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Favorites.css';

const Favorites = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            setError(null);
            const data = await favoritesAPI.getAll();
            setFavorites(data || []);
        } catch (err) {
            console.error('Error loading favorites:', err);
            // Don't redirect to login on error - just show empty state
            setError('שגיאה בטעינת המועדפים');
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (articleId, e) => {
        e.stopPropagation();
        try {
            await favoritesAPI.remove(articleId);
            setFavorites(favorites.filter(f => f.article_id !== articleId));
            toast.success('הוסר מהמועדפים');
        } catch (err) {
            toast.error('שגיאה בהסרה מהמועדפים');
        }
    };

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
                <p>טוען מועדפים...</p>
            </div>
        );
    }

    return (
        <section className="favorites-view">
            <div className="articles-header">
                <h2><i className="fa-solid fa-heart"></i> המאמרים המועדפים שלי</h2>
            </div>

            {error ? (
                <div className="error-state">
                    <p>{error}</p>
                    <button onClick={loadFavorites} className="btn-retry">נסה שוב</button>
                </div>
            ) : (
                <div className="articles-grid">
                    {favorites.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <i className="fa-solid fa-heart"></i>
                            </div>
                            <h3>אין מאמרים מועדפים</h3>
                            <p>לחצו על הלב במאמר כדי להוסיף למועדפים</p>
                        </div>
                    ) : (
                        favorites.map(fav => (
                            <div
                                key={fav.article_id || fav.id}
                                className="article-card"
                                onClick={() => navigate(`/articles/${fav.article_id || fav.id}`)}
                            >
                                <div className="article-card-header">
                                    <h3>{fav.article?.title || fav.title || 'מאמר'}</h3>
                                    <button
                                        className="btn-favorite active"
                                        onClick={(e) => handleRemoveFavorite(fav.article_id || fav.id, e)}
                                        title="הסר מהמועדפים"
                                    >
                                        <i className="fa-solid fa-heart"></i>
                                    </button>
                                </div>
                                <div className="article-card-body">
                                    <p className="article-summary">{fav.article?.summary || fav.summary || 'אין תקציר'}</p>
                                </div>
                                <div className="article-card-footer">
                                    <span className="article-date">נוסף: {formatDate(fav.created_at)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </section>
    );
};

export default Favorites;
