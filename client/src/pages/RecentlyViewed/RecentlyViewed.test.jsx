/* ==========================================
   RecentlyViewed Page Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecentlyViewed from './RecentlyViewed';

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
    recentlyViewedAPI: {
        getAll: vi.fn(),
        clear: vi.fn(),
    },
}));

// Mock toast
vi.mock('../../components/common/Toast', () => ({
    useToast: vi.fn(() => ({
        success: vi.fn(),
        error: vi.fn(),
    })),
}));

import { recentlyViewedAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';

const renderRecentlyViewed = () => {
    return render(
        <MemoryRouter>
            <RecentlyViewed />
        </MemoryRouter>
    );
};

const mockRecentlyViewed = [
    {
        article_id: 1,
        article: { title: 'Recent Article 1', summary: 'Summary 1' },
        viewed_at: '2024-01-15T10:00:00Z',
    },
    {
        article_id: 2,
        article: { title: 'Recent Article 2', summary: 'Summary 2' },
        viewed_at: '2024-01-16T10:00:00Z',
    },
];

describe('RecentlyViewed Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        recentlyViewedAPI.getAll.mockResolvedValue(mockRecentlyViewed);
        recentlyViewedAPI.clear.mockResolvedValue({});
    });

    describe('Loading State', () => {
        it('shows loading state initially', () => {
            renderRecentlyViewed();

            expect(screen.getByText('טוען היסטוריה...')).toBeInTheDocument();
        });
    });

    describe('Recently Viewed Display', () => {
        it('displays recently viewed articles after loading', async () => {
            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('Recent Article 1')).toBeInTheDocument();
                expect(screen.getByText('Recent Article 2')).toBeInTheDocument();
            });
        });

        it('displays page header', async () => {
            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('מאמרים שנצפו לאחרונה')).toBeInTheDocument();
            });
        });

        it('navigates to article detail when clicked', async () => {
            const user = userEvent.setup();
            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('Recent Article 1')).toBeInTheDocument();
            });

            const articleCard = screen.getByText('Recent Article 1').closest('.article-card');
            await user.click(articleCard);

            expect(mockNavigate).toHaveBeenCalledWith('/articles/1');
        });
    });

    describe('Clear History', () => {
        it('shows clear history button when there are items', async () => {
            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('נקה היסטוריה')).toBeInTheDocument();
            });
        });

        it('clears history when button clicked and confirmed', async () => {
            const user = userEvent.setup();
            const successToast = vi.fn();

            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });
            window.confirm = vi.fn(() => true);

            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('נקה היסטוריה')).toBeInTheDocument();
            });

            await user.click(screen.getByText('נקה היסטוריה'));

            await waitFor(() => {
                expect(recentlyViewedAPI.clear).toHaveBeenCalled();
                expect(successToast).toHaveBeenCalledWith('ההיסטוריה נוקתה');
            });
        });

        it('does not clear history when cancelled', async () => {
            const user = userEvent.setup();
            window.confirm = vi.fn(() => false);

            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('נקה היסטוריה')).toBeInTheDocument();
            });

            await user.click(screen.getByText('נקה היסטוריה'));

            expect(recentlyViewedAPI.clear).not.toHaveBeenCalled();
        });
    });

    describe('Empty State', () => {
        it('shows empty state when no recently viewed', async () => {
            recentlyViewedAPI.getAll.mockResolvedValue([]);

            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('אין היסטוריית צפייה')).toBeInTheDocument();
            });
        });

        it('does not show clear button when empty', async () => {
            recentlyViewedAPI.getAll.mockResolvedValue([]);

            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('אין היסטוריית צפייה')).toBeInTheDocument();
            });

            expect(screen.queryByText('נקה היסטוריה')).not.toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('shows error state on API failure', async () => {
            recentlyViewedAPI.getAll.mockRejectedValue(new Error('Network error'));

            renderRecentlyViewed();

            await waitFor(() => {
                expect(screen.getByText('שגיאה בטעינת ההיסטוריה')).toBeInTheDocument();
            });
        });
    });
});
