/* ==========================================
   AuthContext Tests
   Tests for authentication state and functions
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the API module
vi.mock('../services/api', () => ({
    authAPI: {
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        getMe: vi.fn(),
    },
    getSession: vi.fn(() => null),
    setSession: vi.fn(),
}));

import { authAPI, getSession, setSession } from '../services/api';

// Test component that uses the auth context
function TestComponent() {
    const { user, loading, error, isAuthenticated, isAdmin, login, register, logout } = useAuth();

    return (
        <div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
            <div data-testid="isAdmin">{isAdmin.toString()}</div>
            <div data-testid="user">{user ? user.email : 'null'}</div>
            <div data-testid="error">{error || 'none'}</div>
            <button onClick={() => login('test@test.com', 'password')}>Login</button>
            <button onClick={() => register('test@test.com', 'password')}>Register</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getSession.mockReturnValue(null);
    });

    describe('Initial State', () => {
        it('starts with loading true and no user', async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // After initial load completes
            await waitFor(() => {
                expect(screen.getByTestId('loading').textContent).toBe('false');
            });

            expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
            expect(screen.getByTestId('user').textContent).toBe('null');
        });

        it('checks existing session on mount', async () => {
            const mockSession = { access_token: 'test-token' };
            const mockUser = { id: 1, email: 'test@test.com', role: 'user' };

            getSession.mockReturnValue(mockSession);
            authAPI.getMe.mockResolvedValue({ user: mockUser });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('user').textContent).toBe('test@test.com');
            });

            expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
        });
    });

    describe('Login', () => {
        it('logs in successfully and updates state', async () => {
            const user = userEvent.setup();
            const mockResponse = {
                user: { id: 1, email: 'test@test.com', role: 'user' },
                access_token: 'token',
            };

            authAPI.login.mockResolvedValue(mockResponse);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading').textContent).toBe('false');
            });

            await user.click(screen.getByText('Login'));

            await waitFor(() => {
                expect(screen.getByTestId('user').textContent).toBe('test@test.com');
            });

            expect(setSession).toHaveBeenCalledWith(mockResponse);
        });

        it('handles login error', async () => {
            const user = userEvent.setup();
            const mockError = { error: 'Invalid credentials' };

            authAPI.login.mockRejectedValue(mockError);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading').textContent).toBe('false');
            });

            await user.click(screen.getByText('Login'));

            await waitFor(() => {
                expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
            });
        });
    });

    describe('Register', () => {
        it('registers successfully and updates state', async () => {
            const user = userEvent.setup();
            const mockResponse = {
                user: { id: 1, email: 'test@test.com', role: 'user' },
                access_token: 'token',
            };

            authAPI.register.mockResolvedValue(mockResponse);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading').textContent).toBe('false');
            });

            await user.click(screen.getByText('Register'));

            await waitFor(() => {
                expect(screen.getByTestId('user').textContent).toBe('test@test.com');
            });

            expect(setSession).toHaveBeenCalledWith(mockResponse);
        });
    });

    describe('Logout', () => {
        it('clears user state on logout', async () => {
            const user = userEvent.setup();
            const mockSession = { access_token: 'test-token' };
            const mockUser = { id: 1, email: 'test@test.com', role: 'user' };

            getSession.mockReturnValue(mockSession);
            authAPI.getMe.mockResolvedValue({ user: mockUser });
            authAPI.logout.mockResolvedValue();

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('user').textContent).toBe('test@test.com');
            });

            await user.click(screen.getByText('Logout'));

            await waitFor(() => {
                expect(screen.getByTestId('user').textContent).toBe('null');
            });

            expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
        });
    });

    describe('Admin Role', () => {
        it('correctly identifies admin users', async () => {
            const mockSession = { access_token: 'test-token' };
            const mockUser = { id: 1, email: 'admin@test.com', role: 'admin' };

            getSession.mockReturnValue(mockSession);
            authAPI.getMe.mockResolvedValue({ user: mockUser });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('isAdmin').textContent).toBe('true');
            });
        });

        it('non-admin users have isAdmin false', async () => {
            const mockSession = { access_token: 'test-token' };
            const mockUser = { id: 1, email: 'user@test.com', role: 'user' };

            getSession.mockReturnValue(mockSession);
            authAPI.getMe.mockResolvedValue({ user: mockUser });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('isAdmin').textContent).toBe('false');
            });
        });
    });
});

describe('useAuth hook', () => {
    it('throws error when used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            render(<TestComponent />);
        }).toThrow('useAuth must be used within an AuthProvider');

        consoleError.mockRestore();
    });
});
