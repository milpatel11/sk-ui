"use client";
import React, {createContext, useContext, useEffect, useState} from 'react';
import {apiClient} from '@/lib/apiClient';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';
import {Tenant} from "@/lib/types";

interface Session {
    //For Authentication 
    token: string  // User Authentication Token
    // For Authorization 
    tenant_tokens: Map<string,string>; // Tenant specific login tokens
    tenants: Map<string,Tenant>; // Tenants available for authenticated user
    expiry: Map<string, ExpirationInfo>; // Expiration info for login and tenant tokens
}

interface ExpirationInfo {
    type: 'login' | 'tenant_tokens';
    tenantId: string;
    expiresAt: number; // Expiration timestamp in ms for Tenants Token
    refreshToken: string; // Refresh token if applicable
}

interface AuthContextValue {
    session: Session;
    setSession: (s: Session) => void;
    logout: () => void;
    isAuthenticated: boolean;
    ready: boolean; // localStorage hydration complete
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const queryClient = new QueryClient();

// Helper creators and selectors for login expiry
const createEmptySession = (): Session => ({
    token: '',
    tenant_tokens: new Map<string, string>(),
    tenants: new Map<string, Tenant>(),
    expiry: new Map<string, ExpirationInfo>(),
});
const LOGIN_KEY = 'login';
const getLoginExpiry = (s: Session): number | null => s.expiry.get(LOGIN_KEY)?.expiresAt ?? null;
const getLoginRefreshToken = (s: Session): string | null => s.expiry.get(LOGIN_KEY)?.refreshToken ?? null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [session, setSession] = useState<Session>(createEmptySession());
    const [ready, setReady] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Soft clear without calling backend (used during hydration for expired tokens)
    const softClear = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('expiresAt');
        }
        setSession(createEmptySession());
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken') || '';
            const storedRefreshToken = localStorage.getItem('refreshToken');
            const expiresAtStr = localStorage.getItem('expiresAt');
            const expiresAt = expiresAtStr ? Number(expiresAtStr) : null;
            // If token is expired, clear immediately so isAuthenticated is false
            if (token && expiresAt && expiresAt <= Date.now()) {
                softClear();
            } else {
                const next = createEmptySession();
                next.token = token || '';
                if (expiresAt || storedRefreshToken) {
                    next.expiry.set(LOGIN_KEY, {
                        type: 'login',
                        tenantId: '',
                        expiresAt: expiresAt ?? 0,
                        refreshToken: storedRefreshToken || '',
                    });
                }
                setSession(next);
            }
        }
        setReady(true);
    }, []);

    const logout = async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch {
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('expiresAt');
        }
        setSession(createEmptySession());
    };

    const refreshSession = async () => {
        if (typeof window === 'undefined') return;
        try {
            const currentRefresh = getLoginRefreshToken(session);
            const resp = await apiClient.post('/auth/refresh', currentRefresh ? {refreshToken: currentRefresh} : undefined);
            const {accessToken, refreshToken: newRefreshToken, expiresInSeconds} = resp.data || {};
            const newExpiresAt = expiresInSeconds ? (Number(expiresInSeconds) > 24 * 3600 ? Number(expiresInSeconds) * 1000 : Date.now() + Number(expiresInSeconds) * 1000) : null;
            const next = {...createEmptySession(), ...session};
            next.token = accessToken || session.token || '';
            next.expiry.set(LOGIN_KEY, {
                type: 'login',
                tenantId: '',
                expiresAt: newExpiresAt ?? getLoginExpiry(session) ?? 0,
                refreshToken: newRefreshToken || currentRefresh || '',
            });
            setSession(next);
            if (accessToken) localStorage.setItem('authToken', accessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            if (newExpiresAt) localStorage.setItem('expiresAt', String(newExpiresAt));
        } catch {
            logout();
        }
    };

    // Show confirm dialog 1 minute before login token expiry
    useEffect(() => {
        const loginExpiry = getLoginExpiry(session);
        if (!session.token || !loginExpiry) return;
        const msUntilPrompt = loginExpiry - Date.now() - 60_000;
        const delay = Math.max(0, msUntilPrompt);
        const timeout = setTimeout(() => setDialogOpen(true), delay);
        return () => clearTimeout(timeout);
    }, [session]);

    // Auto logout at expiry
    useEffect(() => {
        const loginExpiry = getLoginExpiry(session);
        if (!loginExpiry) return;
        const msUntilLogout = loginExpiry - Date.now();
        if (msUntilLogout <= 0) {
            logout();
            return;
        }
        const timer = setTimeout(() => logout(), msUntilLogout);
        return () => clearTimeout(timer);
    }, [session]);

    const handleConfirm = () => {
        setDialogOpen(false);
        refreshSession();
    };
    const handleLogout = () => {
        setDialogOpen(false);
        logout();
    };

    // Derived auth flag uses expiry if present
    const isAuthenticated = !!session.token && (!getLoginExpiry(session) || getLoginExpiry(session)! > Date.now());

    return (
        <AuthContext.Provider value={{session, setSession, logout, isAuthenticated, ready}}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            <Dialog open={dialogOpen} onClose={handleLogout}>
                <DialogTitle>Session Expiring</DialogTitle>
                <DialogContent>Your session is about to expire. Do you want to stay logged in?</DialogContent>
                <DialogActions>
                    <Button onClick={handleLogout} color="secondary">Logout</Button>
                    <Button onClick={handleConfirm} color="primary" autoFocus>Stay Logged In</Button>
                </DialogActions>
            </Dialog>
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};