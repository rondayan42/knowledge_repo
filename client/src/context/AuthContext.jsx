/* ==========================================
   Authentication Context
   Provides auth state and functions to all components
   ========================================== */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, getSession, setSession as saveSession } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const session = getSession();
            if (session?.access_token) {
                try {
                    const response = await authAPI.getMe();
                    setUser(response.user);
                } catch {
                    saveSession(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login(email, password);
            saveSession(response);
            setUser(response.user);
            return response;
        } catch (err) {
            setError(err.error || 'Login failed');
            throw err;
        }
    }, []);

    const register = useCallback(async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.register(email, password);
            saveSession(response);
            setUser(response.user);
            return response;
        } catch (err) {
            setError(err.error || 'Registration failed');
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        await authAPI.logout();
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
