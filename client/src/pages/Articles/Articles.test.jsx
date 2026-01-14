/* ==========================================
   Articles Page Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Articles from './Articles';

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
        getAll: vi.fn(),
        search: vi.fn(),
    },
    categoriesAPI: {
        getAll: vi.fn(),
    },
    departmentsAPI: {
        getAll: vi.fn(),
    },
    prioritiesAPI: {
        getAll: vi.fn(),
    },
}));

// Mock toast
vi.mock('../../components/common/Toast', () => ({
    useToast: vi.fn(() => ({
        success: vi.fn(),
        error: vi.fn(),
    })),
}));

import { articlesAPI, categoriesAPI, departmentsAPI, prioritiesAPI } from '../../services/api';

const renderArticles = () => {
    return render(
        <MemoryRouter>
            <Articles />
        </MemoryRouter>
    );
};

const mockArticles = [
    {
        id: 1,
        title: 'Test Article 1',
        summary: 'Summary 1',
        category_name: 'Category A',
        department_name: 'Department X',
        priority_name: 'High',
        created_at: '2024-01-15T10:00:00Z',
    },
    {
        id: 2,
        title: 'Test Article 2',
        summary: 'Summary 2',
        category_name: 'Category B',
        department_name: 'Department Y',
        priority_name: 'Low',
        created_at: '2024-01-16T10:00:00Z',
    },
];

describe('Articles Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        articlesAPI.getAll.mockResolvedValue(mockArticles);
        categoriesAPI.getAll.mockResolvedValue([{ id: 1, name: 'Category A' }]);
        departmentsAPI.getAll.mockResolvedValue([{ id: 1, name: 'Department X' }]);
        prioritiesAPI.getAll.mockResolvedValue([{ id: 1, name: 'High' }]);
    });

    describe('Loading State', () => {
        it('shows loading state initially', () => {
            renderArticles();

            expect(screen.getByText('טוען מאמרים...')).toBeInTheDocument();
        });
    });

    describe('Articles Display', () => {
        it('displays articles after loading', async () => {
            renderArticles();

            await waitFor(() => {
                expect(screen.getByText('Test Article 1')).toBeInTheDocument();
                expect(screen.getByText('Test Article 2')).toBeInTheDocument();
            });
        });

        it('displays article summaries', async () => {
            renderArticles();

            await waitFor(() => {
                expect(screen.getByText('Summary 1')).toBeInTheDocument();
                expect(screen.getByText('Summary 2')).toBeInTheDocument();
            });
        });

        it('navigates to article detail when clicked', async () => {
            const user = userEvent.setup();
            renderArticles();

            await waitFor(() => {
                expect(screen.getByText('Test Article 1')).toBeInTheDocument();
            });

            // Find and click the first article card
            const articleCard = screen.getByText('Test Article 1').closest('.article-card');
            await user.click(articleCard);

            expect(mockNavigate).toHaveBeenCalledWith('/articles/1');
        });
    });

    describe('Empty State', () => {
        it('shows empty state when no articles', async () => {
            articlesAPI.getAll.mockResolvedValue([]);

            renderArticles();

            await waitFor(() => {
                expect(screen.getByText('לא נמצאו מאמרים')).toBeInTheDocument();
            });
        });
    });

    describe('Search', () => {
        it('renders search input', async () => {
            renderArticles();

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/חיפוש/)).toBeInTheDocument();
            });
        });
    });

    describe('Filters', () => {
        it('renders filter dropdowns', async () => {
            renderArticles();

            await waitFor(() => {
                expect(screen.getByText('Test Article 1')).toBeInTheDocument();
            });

            // Check that filter controls exist
            const selects = document.querySelectorAll('select');
            expect(selects.length).toBeGreaterThan(0);
        });
    });
});
