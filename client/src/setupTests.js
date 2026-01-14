/* ==========================================
   Test Setup
   Global mocks and Testing Library configuration
   ========================================== */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value?.toString() || '';
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock window.confirm
window.confirm = vi.fn(() => true);

// Mock window.print
window.print = vi.fn();

// Mock window.alert
window.alert = vi.fn();

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor() {
        this.observe = vi.fn();
        this.unobserve = vi.fn();
        this.disconnect = vi.fn();
    }
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
    constructor() {
        this.observe = vi.fn();
        this.unobserve = vi.fn();
        this.disconnect = vi.fn();
    }
}
window.ResizeObserver = MockResizeObserver;

// Mock DOMParser for fileImporter tests
// (Already available in jsdom, but ensure it works)

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
});
