/* ==========================================
   Article Detail Page
   View individual article content
   ========================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articlesAPI, recentlyViewedAPI, favoritesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './ArticleDetail.css';

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const loadArticle = async () => {
            try {
                const data = await articlesAPI.getOne(id);
                setArticle(data);
                // Track recently viewed
                await recentlyViewedAPI.add(id).catch(() => { });

                // Check if favorited
                try {
                    const favorites = await favoritesAPI.getAll();
                    const isFav = favorites.some(f => f.article_id === parseInt(id));
                    setIsFavorite(isFav);
                } catch { }
            } catch (err) {
                toast.error('שגיאה בטעינת המאמר');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [id]);

    const toggleFavorite = async () => {
        try {
            if (isFavorite) {
                await favoritesAPI.remove(id);
                setIsFavorite(false);
                toast.success('הוסר מהמועדפים');
            } else {
                await favoritesAPI.add(id);
                setIsFavorite(true);
                toast.success('נוסף למועדפים');
            }
        } catch (err) {
            toast.error('שגיאה בעדכון מועדפים');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>טוען מאמר...</p>
            </div>
        );
    }

    if (!article) {
        return null;
    }

    return (
        <section className="article-detail-view">
            <div className="article-detail-wrapper">
                <div className="article-detail-container">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← חזרה לרשימה
                    </button>

                    <div className="article-detail-header">
                        <div className="article-title-row">
                            <h1>{article.title}</h1>
                            <button
                                className={`btn-favorite ${isFavorite ? 'active' : ''}`}
                                onClick={toggleFavorite}
                                title={isFavorite ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
                            >
                                <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                            </button>
                        </div>
                        <div className="article-detail-meta">
                            <span className="tag category">{article.category_name}</span>
                            <span className="tag department">{article.department_name}</span>
                            <span className="tag priority">{article.priority_name}</span>
                            {article.tags?.map(tag => (
                                <span key={tag.id} className="tag">{tag.name}</span>
                            ))}
                        </div>
                        {article.summary && (
                            <p><strong>תקציר:</strong> {article.summary}</p>
                        )}
                    </div>

                    <div
                        className="article-detail-body"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />

                    {article.attachments?.length > 0 && (
                        <div className="article-attachments">
                            <h3><i className="fa-solid fa-paperclip"></i> קבצים מצורפים</h3>
                            <div className="download-list">
                                {article.attachments.map(att => (
                                    <a
                                        key={att.id}
                                        href={att.url}
                                        download={att.file_name}
                                        className="download-item"
                                    >
                                        <span className="file-icon">
                                            <i className="fa-solid fa-file"></i>
                                        </span>
                                        <div className="file-info">
                                            <span className="file-name">{att.file_name}</span>
                                            <span className="file-size">{(att.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <span className="download-icon">
                                            <i className="fa-solid fa-download"></i>
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="article-detail-footer">
                        <div>
                            <p><strong>נוצר:</strong> {formatDate(article.created_at)}</p>
                            <p><strong>עודכן:</strong> {formatDate(article.updated_at)}</p>
                            {article.author && <p><strong>מחבר:</strong> {article.author}</p>}
                        </div>
                        <div className="footer-actions">
                            <button className="btn-print" onClick={() => window.print()}>
                                <i className="fa-solid fa-print"></i> הדפסה
                            </button>
                            <button className="btn-edit" onClick={() => navigate(`/editor/${article.id}`)}>
                                עריכת מאמר
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ArticleDetail;
