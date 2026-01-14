/* ==========================================
   ArticleDetail Page Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ArticleDetail from './ArticleDetail';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock API
vi.mock('../../services/api', () => ({
    articlesAPI: {
        getOne: vi.fn(),
    },
    recentlyViewedAPI: {
        add: vi.fn(),
    },
    favoritesAPI: {
        getAll: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
    },
}));

// Mock toast
vi.mock('../../components/common/Toast', () => ({
    useToast: vi.fn(() => ({
        success: vi.fn(),
        error: vi.fn(),
    })),
}));

import { articlesAPI, recentlyViewedAPI, favoritesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';

const renderArticleDetail = (articleId = '1') => {
    return render(
        <MemoryRouter initialEntries={[`/articles/${articleId}`]}>
            <Routes>
                <Route path="/articles/:id" element={<ArticleDetail />} />
            </Routes>
        </MemoryRouter>
    );
};

const mockArticle = {
    id: 1,
    title: 'Test Article',
    summary: 'This is a test summary',
    content: '<p>Article content here</p>',
    category_name: 'Category A',
    department_name: 'Department X',
    priority_name: 'High',
    author: 'John Doe',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
    tags: [{ id: 1, name: 'Tag1' }],
    attachments: [],
};

describe('ArticleDetail Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        articlesAPI.getOne.mockResolvedValue(mockArticle);
        recentlyViewedAPI.add.mockResolvedValue({});
        favoritesAPI.getAll.mockResolvedValue([]);
        favoritesAPI.add.mockResolvedValue({});
        favoritesAPI.remove.mockResolvedValue({});
    });

    describe('Loading State', () => {
        it('shows loading state initially', () => {
            renderArticleDetail();

            expect(screen.getByText('טוען מאמר...')).toBeInTheDocument();
        });
    });

    describe('Article Display', () => {
        it('displays article title after loading', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('Test Article')).toBeInTheDocument();
            });
        });

        it('displays article summary', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText(/This is a test summary/)).toBeInTheDocument();
            });
        });

        it('displays article content', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('Article content here')).toBeInTheDocument();
            });
        });

        it('displays category, department, and priority tags', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('Category A')).toBeInTheDocument();
                expect(screen.getByText('Department X')).toBeInTheDocument();
                expect(screen.getByText('High')).toBeInTheDocument();
            });
        });

        it('displays article tags', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('Tag1')).toBeInTheDocument();
            });
        });

        it('displays author name', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText(/John Doe/)).toBeInTheDocument();
            });
        });
    });

    describe('Navigation', () => {
        it('shows back button', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('← חזרה לרשימה')).toBeInTheDocument();
            });
        });

        it('navigates back when back button clicked', async () => {
            const user = userEvent.setup();
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('← חזרה לרשימה')).toBeInTheDocument();
            });

            await user.click(screen.getByText('← חזרה לרשימה'));

            expect(mockNavigate).toHaveBeenCalledWith('/');
        });

        it('shows edit button', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('עריכת מאמר')).toBeInTheDocument();
            });
        });
    });

    describe('Favorites', () => {
        it('shows unfavorited state by default', async () => {
            renderArticleDetail();

            await waitFor(() => {
                const favoriteButton = document.querySelector('.btn-favorite');
                expect(favoriteButton).not.toHaveClass('active');
            });
        });

        it('shows favorited state when article is favorited', async () => {
            favoritesAPI.getAll.mockResolvedValue([{ article_id: 1 }]);

            renderArticleDetail();

            await waitFor(() => {
                const favoriteButton = document.querySelector('.btn-favorite');
                expect(favoriteButton).toHaveClass('active');
            });
        });

        it('toggles favorite when button clicked', async () => {
            const user = userEvent.setup();
            const successToast = vi.fn();

            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });

            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('Test Article')).toBeInTheDocument();
            });

            const favoriteButton = document.querySelector('.btn-favorite');
            await user.click(favoriteButton);

            await waitFor(() => {
                expect(favoritesAPI.add).toHaveBeenCalledWith('1');
            });
        });
    });

    describe('Recently Viewed', () => {
        it('tracks article as recently viewed', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('Test Article')).toBeInTheDocument();
            });

            expect(recentlyViewedAPI.add).toHaveBeenCalledWith('1');
        });
    });

    describe('Print', () => {
        it('shows print button', async () => {
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText(/הדפסה/)).toBeInTheDocument();
            });
        });

        it('calls window.print when print button clicked', async () => {
            const user = userEvent.setup();
            renderArticleDetail();

            await waitFor(() => {
                expect(screen.getByText('Test Article')).toBeInTheDocument();
            });

            await user.click(screen.getByText(/הדפסה/));

            expect(window.print).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('navigates away on API error', async () => {
            const errorToast = vi.fn();
            useToast.mockReturnValue({
                success: vi.fn(),
                error: errorToast,
            });
            articlesAPI.getOne.mockRejectedValue(new Error('Not found'));

            renderArticleDetail();

            await waitFor(() => {
                expect(errorToast).toHaveBeenCalledWith('שגיאה בטעינת המאמר');
            });
        });
    });
});
