/* ==========================================
   ThemeContext Tests
   Tests for theme state and toggle functionality
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

// Test component that uses the theme context
function TestComponent() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <div>
            <div data-testid="isDark">{isDark.toString()}</div>
            <button onClick={toggleTheme}>Toggle Theme</button>
        </div>
    );
}

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        // Reset document attributes
        document.documentElement.removeAttribute('data-theme');
        document.body.classList.remove('dark-mode', 'light-mode');
    });

    describe('Initial State', () => {
        it('defaults to dark mode when no saved preference', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId('isDark').textContent).toBe('true');
        });

        it('loads saved dark theme preference from localStorage', () => {
            localStorage.setItem('theme', 'dark');

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId('isDark').textContent).toBe('true');
        });

        it('loads saved light theme preference from localStorage', () => {
            localStorage.setItem('theme', 'light');

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId('isDark').textContent).toBe('false');
        });
    });

    describe('Theme Toggle', () => {
        it('toggles from dark to light', async () => {
            const user = userEvent.setup();

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId('isDark').textContent).toBe('true');

            await user.click(screen.getByText('Toggle Theme'));

            expect(screen.getByTestId('isDark').textContent).toBe('false');
        });

        it('toggles from light to dark', async () => {
            const user = userEvent.setup();
            localStorage.setItem('theme', 'light');

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId('isDark').textContent).toBe('false');

            await user.click(screen.getByText('Toggle Theme'));

            expect(screen.getByTestId('isDark').textContent).toBe('true');
        });
    });

    describe('LocalStorage Persistence', () => {
        it('saves theme preference to localStorage', async () => {
            const user = userEvent.setup();

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            // Default is dark
            expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

            // Toggle to light
            await user.click(screen.getByText('Toggle Theme'));

            expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
        });
    });

    describe('DOM Updates', () => {
        it('sets data-theme attribute on document', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        it('adds dark-mode class to body in dark mode', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(document.body.classList.contains('dark-mode')).toBe(true);
            expect(document.body.classList.contains('light-mode')).toBe(false);
        });

        it('adds light-mode class to body in light mode', async () => {
            const user = userEvent.setup();

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            await user.click(screen.getByText('Toggle Theme'));

            expect(document.body.classList.contains('light-mode')).toBe(true);
            expect(document.body.classList.contains('dark-mode')).toBe(false);
        });

        it('updates data-theme attribute when toggled', async () => {
            const user = userEvent.setup();

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

            await user.click(screen.getByText('Toggle Theme'));

            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });
    });
});

describe('useTheme hook', () => {
    it('throws error when used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            render(<TestComponent />);
        }).toThrow('useTheme must be used within a ThemeProvider');

        consoleError.mockRestore();
    });
});
