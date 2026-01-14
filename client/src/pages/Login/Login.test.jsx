/* ==========================================
   Login Page Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

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
        login: vi.fn(),
        register: vi.fn(),
        isAuthenticated: false,
    })),
}));

// Mock toast
vi.mock('../../components/common/Toast', () => ({
    useToast: vi.fn(() => ({
        success: vi.fn(),
        error: vi.fn(),
    })),
}));

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

const renderLogin = () => {
    return render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );
};

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({
            login: vi.fn(),
            register: vi.fn(),
            isAuthenticated: false,
        });
    });

    describe('Rendering', () => {
        it('renders login form by default', () => {
            renderLogin();

            expect(screen.getByText('Knowledge Repository')).toBeInTheDocument();
            expect(screen.getByLabelText('דואר אלקטרוני')).toBeInTheDocument();
            expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'התחברות' })).toBeInTheDocument();
        });

        it('can switch to register mode', async () => {
            const user = userEvent.setup();
            renderLogin();

            await user.click(screen.getByText('אין לך חשבון? הירשם'));

            expect(screen.getByLabelText('אימות סיסמה')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'הרשמה' })).toBeInTheDocument();
        });

        it('can switch back to login mode', async () => {
            const user = userEvent.setup();
            renderLogin();

            await user.click(screen.getByText('אין לך חשבון? הירשם'));
            await user.click(screen.getByText('יש לך חשבון? התחבר'));

            expect(screen.queryByLabelText('אימות סיסמה')).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'התחברות' })).toBeInTheDocument();
        });
    });

    describe('Login Flow', () => {
        it('calls login with email and password', async () => {
            const user = userEvent.setup();
            const login = vi.fn().mockResolvedValue({});
            const successToast = vi.fn();

            useAuth.mockReturnValue({
                login,
                register: vi.fn(),
                isAuthenticated: false,
            });
            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });

            renderLogin();

            await user.type(screen.getByLabelText('דואר אלקטרוני'), 'test@test.com');
            await user.type(screen.getByLabelText('סיסמה'), 'password123');
            await user.click(screen.getByRole('button', { name: 'התחברות' }));

            await waitFor(() => {
                expect(login).toHaveBeenCalledWith('test@test.com', 'password123');
            });
        });

        it('shows success toast and navigates on successful login', async () => {
            const user = userEvent.setup();
            const login = vi.fn().mockResolvedValue({});
            const successToast = vi.fn();

            useAuth.mockReturnValue({
                login,
                register: vi.fn(),
                isAuthenticated: false,
            });
            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });

            renderLogin();

            await user.type(screen.getByLabelText('דואר אלקטרוני'), 'test@test.com');
            await user.type(screen.getByLabelText('סיסמה'), 'password123');
            await user.click(screen.getByRole('button', { name: 'התחברות' }));

            await waitFor(() => {
                expect(successToast).toHaveBeenCalledWith('התחברת בהצלחה!');
            });
        });

        it('shows error toast on login failure', async () => {
            const user = userEvent.setup();
            const login = vi.fn().mockRejectedValue({ error: 'Invalid credentials' });
            const errorToast = vi.fn();

            useAuth.mockReturnValue({
                login,
                register: vi.fn(),
                isAuthenticated: false,
            });
            useToast.mockReturnValue({
                success: vi.fn(),
                error: errorToast,
            });

            renderLogin();

            await user.type(screen.getByLabelText('דואר אלקטרוני'), 'test@test.com');
            await user.type(screen.getByLabelText('סיסמה'), 'wrong');
            await user.click(screen.getByRole('button', { name: 'התחברות' }));

            await waitFor(() => {
                expect(errorToast).toHaveBeenCalledWith('Invalid credentials');
            });
        });
    });

    describe('Register Flow', () => {
        it('shows error when passwords do not match', async () => {
            const user = userEvent.setup();
            const errorToast = vi.fn();

            useToast.mockReturnValue({
                success: vi.fn(),
                error: errorToast,
            });

            renderLogin();

            await user.click(screen.getByText('אין לך חשבון? הירשם'));
            await user.type(screen.getByLabelText('דואר אלקטרוני'), 'test@test.com');
            await user.type(screen.getByLabelText('סיסמה'), 'password123');
            await user.type(screen.getByLabelText('אימות סיסמה'), 'different');
            await user.click(screen.getByRole('button', { name: 'הרשמה' }));

            expect(errorToast).toHaveBeenCalledWith('הסיסמאות אינן תואמות');
        });

        it('calls register when passwords match', async () => {
            const user = userEvent.setup();
            const register = vi.fn().mockResolvedValue({});
            const successToast = vi.fn();

            useAuth.mockReturnValue({
                login: vi.fn(),
                register,
                isAuthenticated: false,
            });
            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
            });

            renderLogin();

            await user.click(screen.getByText('אין לך חשבון? הירשם'));
            await user.type(screen.getByLabelText('דואר אלקטרוני'), 'test@test.com');
            await user.type(screen.getByLabelText('סיסמה'), 'password123');
            await user.type(screen.getByLabelText('אימות סיסמה'), 'password123');
            await user.click(screen.getByRole('button', { name: 'הרשמה' }));

            await waitFor(() => {
                expect(register).toHaveBeenCalledWith('test@test.com', 'password123');
            });
        });
    });

    describe('Redirect', () => {
        it('redirects to home if already authenticated', () => {
            useAuth.mockReturnValue({
                login: vi.fn(),
                register: vi.fn(),
                isAuthenticated: true,
            });

            renderLogin();

            expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
        });
    });
});
