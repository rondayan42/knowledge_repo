/* ==========================================
   Toast Component Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

// Test component that uses the toast context
function TestComponent() {
    const { showToast, success, error, info } = useToast();

    return (
        <div>
            <button onClick={() => showToast('Test message')}>Show Toast</button>
            <button onClick={() => success('Success!')}>Show Success</button>
            <button onClick={() => error('Error!')}>Show Error</button>
            <button onClick={() => info('Info!')}>Show Info</button>
        </div>
    );
}

describe('ToastProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders children', () => {
        render(
            <ToastProvider>
                <div>Child content</div>
            </ToastProvider>
        );

        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders toast container', () => {
        render(
            <ToastProvider>
                <div>Content</div>
            </ToastProvider>
        );

        expect(document.querySelector('.toast-container')).toBeInTheDocument();
    });

    it('shows toast when showToast is called', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        act(() => {
            screen.getByText('Show Toast').click();
        });

        expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('shows success toast with correct class', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        act(() => {
            screen.getByText('Show Success').click();
        });

        expect(screen.getByText('Success!')).toBeInTheDocument();
        expect(document.querySelector('.toast-success')).toBeInTheDocument();
    });

    it('shows error toast with correct class', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        act(() => {
            screen.getByText('Show Error').click();
        });

        expect(screen.getByText('Error!')).toBeInTheDocument();
        expect(document.querySelector('.toast-error')).toBeInTheDocument();
    });

    it('shows info toast with correct class', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        act(() => {
            screen.getByText('Show Info').click();
        });

        expect(screen.getByText('Info!')).toBeInTheDocument();
        expect(document.querySelector('.toast-info')).toBeInTheDocument();
    });

    it('auto-dismisses toast after duration', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        act(() => {
            screen.getByText('Show Toast').click();
        });

        expect(screen.getByText('Test message')).toBeInTheDocument();

        // Fast-forward time
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('can show multiple toasts', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        act(() => {
            screen.getByText('Show Success').click();
            screen.getByText('Show Error').click();
        });

        expect(screen.getByText('Success!')).toBeInTheDocument();
        expect(screen.getByText('Error!')).toBeInTheDocument();
    });
});

describe('useToast hook', () => {
    it('throws error when used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            render(<TestComponent />);
        }).toThrow('useToast must be used within a ToastProvider');

        consoleError.mockRestore();
    });
});
