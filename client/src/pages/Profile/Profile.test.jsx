/* ==========================================
   Profile Page Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock auth context
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: { id: 1, email: 'test@example.com', role: 'admin' },
        isAdmin: true,
    })),
}));

// Mock API
vi.mock('../../services/api', () => ({
    usersAPI: {
        getAll: vi.fn(),
        updateRole: vi.fn(),
        approve: vi.fn(),
        delete: vi.fn(),
    },
    articlesAPI: {
        getAll: vi.fn(),
        delete: vi.fn(),
    },
}));

// Mock toast
vi.mock('../../components/common/Toast', () => ({
    useToast: vi.fn(() => ({
        success: vi.fn(),
        error: vi.fn(),
    })),
}));

import { useAuth } from '../../context/AuthContext';
import { usersAPI, articlesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';

const renderProfile = () => {
    return render(
        <MemoryRouter>
            <Profile />
        </MemoryRouter>
    );
};

const mockUsers = [
    { id: 1, email: 'admin@test.com', role: 'admin', approved: true },
    { id: 2, email: 'user@test.com', role: 'user', approved: true },
];

const mockArticles = [
    { id: 1, title: 'My Article', author_id: 1, created_at: '2024-01-15T10:00:00Z' },
];

describe('Profile Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        usersAPI.getAll.mockResolvedValue(mockUsers);
        articlesAPI.getAll.mockResolvedValue(mockArticles);
        articlesAPI.delete.mockResolvedValue({});
    });

    describe('Rendering', () => {
        it('displays user email in header', async () => {
            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('test@example.com')).toBeInTheDocument();
            });
        });

        it('shows admin badge for admin users', async () => {
            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('מנהל מערכת')).toBeInTheDocument();
            });
        });
    });

    describe('User Articles Section', () => {
        it('displays user articles', async () => {
            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('My Article')).toBeInTheDocument();
            });
        });

        it('shows edit and delete buttons for articles', async () => {
            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('My Article')).toBeInTheDocument();
            });

            expect(document.querySelector('.btn-edit')).toBeInTheDocument();
            expect(document.querySelector('.btn-delete')).toBeInTheDocument();
        });
    });

    describe('Admin Panel', () => {
        it('shows user management section for admins', async () => {
            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('ניהול משתמשים')).toBeInTheDocument();
            });
        });

        it('displays user list for admins', async () => {
            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('admin@test.com')).toBeInTheDocument();
                expect(screen.getByText('user@test.com')).toBeInTheDocument();
            });
        });
    });

    describe('Non-Admin View', () => {
        it('does not show user management for non-admins', async () => {
            useAuth.mockReturnValue({
                user: { id: 2, email: 'user@test.com', role: 'user' },
                isAdmin: false,
            });

            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('user@test.com')).toBeInTheDocument();
            });

            expect(screen.queryByText('ניהול משתמשים')).not.toBeInTheDocument();
        });
    });

    describe('Article Actions', () => {
        it('deletes article when delete button clicked', async () => {
            const user = userEvent.setup();
            const successToast = vi.fn();
            window.confirm = vi.fn(() => true);

            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });

            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('My Article')).toBeInTheDocument();
            });

            const deleteButton = document.querySelector('.btn-delete');
            await user.click(deleteButton);

            await waitFor(() => {
                expect(articlesAPI.delete).toHaveBeenCalledWith(1);
            });
        });

        it('navigates to editor when edit button clicked', async () => {
            const user = userEvent.setup();

            renderProfile();

            await waitFor(() => {
                expect(screen.getByText('My Article')).toBeInTheDocument();
            });

            const editButton = document.querySelector('.btn-edit');
            await user.click(editButton);

            expect(mockNavigate).toHaveBeenCalledWith('/editor/1');
        });
    });
});
