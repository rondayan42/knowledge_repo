/* ==========================================
   Favorites Page Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Favorites from './Favorites';

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
    favoritesAPI: {
        getAll: vi.fn(),
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

import { favoritesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';

const renderFavorites = () => {
    return render(
        <MemoryRouter>
            <Favorites />
        </MemoryRouter>
    );
};

const mockFavorites = [
    {
        article_id: 1,
        article: { title: 'Favorite Article 1', summary: 'Summary 1' },
        created_at: '2024-01-15T10:00:00Z',
    },
    {
        article_id: 2,
        article: { title: 'Favorite Article 2', summary: 'Summary 2' },
        created_at: '2024-01-16T10:00:00Z',
    },
];

describe('Favorites Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        favoritesAPI.getAll.mockResolvedValue(mockFavorites);
        favoritesAPI.remove.mockResolvedValue({});
    });

    describe('Loading State', () => {
        it('shows loading state initially', () => {
            renderFavorites();

            expect(screen.getByText('טוען מועדפים...')).toBeInTheDocument();
        });
    });

    describe('Favorites Display', () => {
        it('displays favorites after loading', async () => {
            renderFavorites();

            await waitFor(() => {
                expect(screen.getByText('Favorite Article 1')).toBeInTheDocument();
                expect(screen.getByText('Favorite Article 2')).toBeInTheDocument();
            });
        });

        it('displays page header', async () => {
            renderFavorites();

            await waitFor(() => {
                expect(screen.getByText('המאמרים המועדפים שלי')).toBeInTheDocument();
            });
        });

        it('navigates to article detail when clicked', async () => {
            const user = userEvent.setup();
            renderFavorites();

            await waitFor(() => {
                expect(screen.getByText('Favorite Article 1')).toBeInTheDocument();
            });

            const articleCard = screen.getByText('Favorite Article 1').closest('.article-card');
            await user.click(articleCard);

            expect(mockNavigate).toHaveBeenCalledWith('/articles/1');
        });
    });

    describe('Remove Favorite', () => {
        it('removes favorite when button clicked', async () => {
            const user = userEvent.setup();
            const successToast = vi.fn();

            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });

            renderFavorites();

            await waitFor(() => {
                expect(screen.getByText('Favorite Article 1')).toBeInTheDocument();
            });

            const favoriteButtons = screen.getAllByTitle('הסר מהמועדפים');
            await user.click(favoriteButtons[0]);

            await waitFor(() => {
                expect(favoritesAPI.remove).toHaveBeenCalledWith(1);
            });
        });
    });

    describe('Empty State', () => {
        it('shows empty state when no favorites', async () => {
            favoritesAPI.getAll.mockResolvedValue([]);

            renderFavorites();

            await waitFor(() => {
                expect(screen.getByText('אין מאמרים מועדפים')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('shows error state on API failure', async () => {
            favoritesAPI.getAll.mockRejectedValue(new Error('Network error'));

            renderFavorites();

            await waitFor(() => {
                expect(screen.getByText('שגיאה בטעינת המועדפים')).toBeInTheDocument();
            });
        });

        it('shows retry button on error', async () => {
            favoritesAPI.getAll.mockRejectedValue(new Error('Network error'));

            renderFavorites();

            await waitFor(() => {
                expect(screen.getByText('נסה שוב')).toBeInTheDocument();
            });
        });
    });
});
