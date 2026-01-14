/* ==========================================
   Tags Page Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Tags from './Tags';

// Mock API
vi.mock('../../services/api', () => ({
    categoriesAPI: {
        getAll: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
    },
    departmentsAPI: {
        getAll: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
    },
    prioritiesAPI: {
        getAll: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
    },
    articlesAPI: {
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

import { categoriesAPI, departmentsAPI, prioritiesAPI, articlesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';

const renderTags = () => {
    return render(
        <MemoryRouter>
            <Tags />
        </MemoryRouter>
    );
};

const mockCategories = [
    { id: 1, name: 'Category 1', description: 'Desc 1' },
    { id: 2, name: 'Category 2', description: 'Desc 2' },
];

const mockDepartments = [
    { id: 1, name: 'Department 1', description: 'Desc 1' },
];

const mockPriorities = [
    { id: 1, name: 'High', level: 1, color: '#ff0000' },
    { id: 2, name: 'Low', level: 2, color: '#00ff00' },
];

describe('Tags Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        categoriesAPI.getAll.mockResolvedValue(mockCategories);
        departmentsAPI.getAll.mockResolvedValue(mockDepartments);
        prioritiesAPI.getAll.mockResolvedValue(mockPriorities);
        articlesAPI.getAll.mockResolvedValue([]);
        categoriesAPI.create.mockResolvedValue({ id: 3, name: 'New Category' });
        departmentsAPI.create.mockResolvedValue({ id: 2, name: 'New Department' });
        prioritiesAPI.create.mockResolvedValue({ id: 3, name: 'Medium' });
        categoriesAPI.delete.mockResolvedValue({});
        departmentsAPI.delete.mockResolvedValue({});
        prioritiesAPI.delete.mockResolvedValue({});
    });

    describe('Loading State', () => {
        it('shows loading state initially', () => {
            renderTags();

            expect(screen.getByText('טוען...')).toBeInTheDocument();
        });
    });

    describe('Display', () => {
        it('displays page header', async () => {
            renderTags();

            await waitFor(() => {
                expect(screen.getByText('ניהול תגיות ומאפיינים')).toBeInTheDocument();
            });
        });

        it('displays categories section', async () => {
            renderTags();

            await waitFor(() => {
                expect(screen.getByText('קטגוריות')).toBeInTheDocument();
            });
        });

        it('displays departments section', async () => {
            renderTags();

            await waitFor(() => {
                expect(screen.getByText('מחלקות')).toBeInTheDocument();
            });
        });

        it('displays priorities section', async () => {
            renderTags();

            await waitFor(() => {
                expect(screen.getByText('עדיפויות')).toBeInTheDocument();
            });
        });

        it('displays category items', async () => {
            renderTags();

            await waitFor(() => {
                expect(screen.getByText('Category 1')).toBeInTheDocument();
                expect(screen.getByText('Category 2')).toBeInTheDocument();
            });
        });

        it('displays department items', async () => {
            renderTags();

            await waitFor(() => {
                expect(screen.getByText('Department 1')).toBeInTheDocument();
            });
        });

        it('displays priority items', async () => {
            renderTags();

            await waitFor(() => {
                expect(screen.getByText('High')).toBeInTheDocument();
                expect(screen.getByText('Low')).toBeInTheDocument();
            });
        });
    });

    describe('Add Category', () => {
        it('adds new category when form submitted', async () => {
            const user = userEvent.setup();
            const successToast = vi.fn();

            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });

            renderTags();

            await waitFor(() => {
                expect(screen.getByText('קטגוריות')).toBeInTheDocument();
            });

            // Find category input by placeholder
            const categoryInput = screen.getByPlaceholderText('שם קטגוריה חדשה');
            await user.type(categoryInput, 'New Category');

            // Find and click the add button
            const addButtons = screen.getAllByText('הוסף');
            await user.click(addButtons[0]);

            await waitFor(() => {
                expect(categoriesAPI.create).toHaveBeenCalledWith('New Category', '');
            });
        });
    });

    describe('Delete Category', () => {
        it('shows delete button for categories', async () => {
            renderTags();

            await waitFor(() => {
                expect(screen.getByText('Category 1')).toBeInTheDocument();
            });

            const deleteButtons = document.querySelectorAll('.btn-delete-tag');
            expect(deleteButtons.length).toBeGreaterThan(0);
        });

        it('deletes category when confirmed', async () => {
            const user = userEvent.setup();
            const successToast = vi.fn();
            window.confirm = vi.fn(() => true);

            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });

            renderTags();

            await waitFor(() => {
                expect(screen.getByText('Category 1')).toBeInTheDocument();
            });

            // Find delete button for first category
            const categoryItem = screen.getByText('Category 1').closest('.tag-item');
            const deleteButton = categoryItem.querySelector('.btn-delete-tag');
            await user.click(deleteButton);

            await waitFor(() => {
                expect(categoriesAPI.delete).toHaveBeenCalledWith(1);
            });
        });
    });

    describe('Error Handling', () => {
        it('shows error toast when delete fails', async () => {
            const user = userEvent.setup();
            const errorToast = vi.fn();
            window.confirm = vi.fn(() => true);
            categoriesAPI.delete.mockRejectedValue(new Error('Failed'));

            useToast.mockReturnValue({
                success: vi.fn(),
                error: errorToast,
            });

            renderTags();

            await waitFor(() => {
                expect(screen.getByText('Category 1')).toBeInTheDocument();
            });

            const categoryItem = screen.getByText('Category 1').closest('.tag-item');
            const deleteButton = categoryItem.querySelector('.btn-delete-tag');
            await user.click(deleteButton);

            await waitFor(() => {
                expect(errorToast).toHaveBeenCalled();
            });
        });
    });
});
