/* ==========================================
   API Service Tests
   Tests for session management and API module structure
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession, setSession } from './api';

// Mock axios module
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        })),
        post: vi.fn(),
    },
}));

describe('Session Management', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getSession', () => {
        it('returns null when no session exists', () => {
            const result = getSession();
            expect(result).toBeNull();
        });

        it('returns parsed session when session exists', () => {
            const session = { access_token: 'test-token', user: { id: 1 } };
            localStorage.setItem('sb-session', JSON.stringify(session));

            const result = getSession();
            expect(result).toEqual(session);
        });

        it('returns null for invalid JSON', () => {
            localStorage.setItem('sb-session', 'invalid-json');

            const result = getSession();
            expect(result).toBeNull();
        });
    });

    describe('setSession', () => {
        it('stores session in localStorage', () => {
            const session = { access_token: 'test-token', user: { id: 1 } };

            setSession(session);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'sb-session',
                JSON.stringify(session)
            );
        });

        it('removes session when null is passed', () => {
            setSession(null);

            expect(localStorage.removeItem).toHaveBeenCalledWith('sb-session');
        });

        it('removes session when undefined is passed', () => {
            setSession(undefined);

            expect(localStorage.removeItem).toHaveBeenCalledWith('sb-session');
        });
    });
});

describe('API Modules Structure', () => {
    // Import the API modules dynamically to test their structure
    it('exports all required API modules', async () => {
        const api = await import('./api');

        // Check auth API
        expect(api.authAPI).toBeDefined();
        expect(typeof api.authAPI.register).toBe('function');
        expect(typeof api.authAPI.login).toBe('function');
        expect(typeof api.authAPI.logout).toBe('function');
        expect(typeof api.authAPI.getMe).toBe('function');

        // Check categories API
        expect(api.categoriesAPI).toBeDefined();
        expect(typeof api.categoriesAPI.getAll).toBe('function');
        expect(typeof api.categoriesAPI.create).toBe('function');
        expect(typeof api.categoriesAPI.delete).toBe('function');

        // Check departments API
        expect(api.departmentsAPI).toBeDefined();
        expect(typeof api.departmentsAPI.getAll).toBe('function');

        // Check priorities API
        expect(api.prioritiesAPI).toBeDefined();
        expect(typeof api.prioritiesAPI.getAll).toBe('function');

        // Check articles API
        expect(api.articlesAPI).toBeDefined();
        expect(typeof api.articlesAPI.getAll).toBe('function');
        expect(typeof api.articlesAPI.getOne).toBe('function');
        expect(typeof api.articlesAPI.create).toBe('function');
        expect(typeof api.articlesAPI.update).toBe('function');
        expect(typeof api.articlesAPI.delete).toBe('function');
        expect(typeof api.articlesAPI.search).toBe('function');

        // Check upload API
        expect(api.uploadAPI).toBeDefined();
        expect(typeof api.uploadAPI.uploadAttachment).toBe('function');
        expect(typeof api.uploadAPI.uploadImage).toBe('function');

        // Check users API
        expect(api.usersAPI).toBeDefined();
        expect(typeof api.usersAPI.getAll).toBe('function');

        // Check favorites API
        expect(api.favoritesAPI).toBeDefined();
        expect(typeof api.favoritesAPI.getAll).toBe('function');
        expect(typeof api.favoritesAPI.add).toBe('function');
        expect(typeof api.favoritesAPI.remove).toBe('function');

        // Check recently viewed API
        expect(api.recentlyViewedAPI).toBeDefined();
        expect(typeof api.recentlyViewedAPI.getAll).toBe('function');
        expect(typeof api.recentlyViewedAPI.add).toBe('function');
        expect(typeof api.recentlyViewedAPI.clear).toBe('function');

        // Check stats API
        expect(api.statsAPI).toBeDefined();
        expect(typeof api.statsAPI.getStats).toBe('function');
    });

    it('exports default API object with all modules', async () => {
        const api = await import('./api');

        expect(api.default).toBeDefined();
        expect(api.default.auth).toBeDefined();
        expect(api.default.categories).toBeDefined();
        expect(api.default.departments).toBeDefined();
        expect(api.default.priorities).toBeDefined();
        expect(api.default.articles).toBeDefined();
        expect(api.default.upload).toBeDefined();
        expect(api.default.users).toBeDefined();
        expect(api.default.favorites).toBeDefined();
        expect(api.default.recentlyViewed).toBeDefined();
        expect(api.default.stats).toBeDefined();
    });
});
