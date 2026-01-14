/* ==========================================
   Header Component Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

// Mock the auth context
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: { email: 'test@example.com', role: 'user' },
        logout: vi.fn(),
        isAdmin: false,
    })),
}));

// Mock the theme context
vi.mock('../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({
        isDark: true,
        toggleTheme: vi.fn(),
    })),
}));

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const renderHeader = () => {
    return render(
        <MemoryRouter>
            <Header />
        </MemoryRouter>
    );
};

describe('Header', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders the logo', () => {
            renderHeader();

            expect(screen.getByText('Knowledge Repository')).toBeInTheDocument();
        });

        it('renders navigation links', () => {
            renderHeader();

            expect(screen.getByText('מאמרים')).toBeInTheDocument();
            expect(screen.getByText('נצפו לאחרונה')).toBeInTheDocument();
            expect(screen.getByText('מועדפים')).toBeInTheDocument();
            expect(screen.getByText('עורך מאמרים')).toBeInTheDocument();
            expect(screen.getByText('ניהול תגיות')).toBeInTheDocument();
            expect(screen.getByText('פרופיל')).toBeInTheDocument();
        });

        it('displays user email', () => {
            renderHeader();

            expect(screen.getByText('test@example.com')).toBeInTheDocument();
        });

        it('displays default text when no user email', () => {
            useAuth.mockReturnValue({
                user: null,
                logout: vi.fn(),
                isAdmin: false,
            });

            renderHeader();

            expect(screen.getByText('משתמש')).toBeInTheDocument();
        });
    });

    describe('Theme Toggle', () => {
        it('renders theme toggle button', () => {
            renderHeader();

            const themeButton = document.querySelector('.btn-theme-toggle');
            expect(themeButton).toBeInTheDocument();
        });

        it('shows sun icon in dark mode', () => {
            useTheme.mockReturnValue({
                isDark: true,
                toggleTheme: vi.fn(),
            });

            renderHeader();

            expect(document.querySelector('.fa-sun')).toBeInTheDocument();
        });

        it('shows moon icon in light mode', () => {
            useTheme.mockReturnValue({
                isDark: false,
                toggleTheme: vi.fn(),
            });

            renderHeader();

            expect(document.querySelector('.fa-moon')).toBeInTheDocument();
        });

        it('calls toggleTheme when clicked', async () => {
            const user = userEvent.setup();
            const toggleTheme = vi.fn();

            useTheme.mockReturnValue({
                isDark: true,
                toggleTheme,
            });

            renderHeader();

            const themeButton = document.querySelector('.btn-theme-toggle');
            await user.click(themeButton);

            expect(toggleTheme).toHaveBeenCalled();
        });
    });

    describe('Logout', () => {
        it('renders logout button', () => {
            renderHeader();

            expect(screen.getByText('יציאה')).toBeInTheDocument();
        });

        it('calls logout when clicked', async () => {
            const user = userEvent.setup();
            const logout = vi.fn();

            useAuth.mockReturnValue({
                user: { email: 'test@example.com' },
                logout,
                isAdmin: false,
            });

            renderHeader();

            await user.click(screen.getByText('יציאה'));

            expect(logout).toHaveBeenCalled();
        });
    });
});
