"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';

interface Session {
  token: string | null;
  userId: string | null;
  expiresAt?: number | null;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>({ token: null, userId: null, expiresAt: null });
  const [ready, setReady] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Soft clear without calling backend (used during hydration for expired tokens)
  const softClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('expiresAt');
    }
    setSession({ token: null, userId: null, expiresAt: null });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const expiresAtStr = localStorage.getItem('expiresAt');
      const expiresAt = expiresAtStr ? Number(expiresAtStr) : null;
      // If token is expired, clear immediately so isAuthenticated is false
      if (expiresAt && expiresAt <= Date.now()) {
        softClear();
      } else {
        setSession({ token, userId, expiresAt });
        setRefreshToken(storedRefreshToken);
      }
    }
    setReady(true);
  }, []);

  const logout = async () => {
    try { await apiClient.post('/auth/logout'); } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('expiresAt');
    }
    setSession({ token: null, userId: null, expiresAt: null });
  };

  const refreshSession = async () => {
    if (typeof window === 'undefined') return;
    try {
      const resp = await apiClient.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken, expiresInSeconds } = resp.data || {};
      const newExpiresAt = expiresInSeconds ? Number(expiresInSeconds) * 1000 : null;
      setSession({ token: accessToken || null, userId: session.userId, expiresAt: newExpiresAt });
      if (newRefreshToken) setRefreshToken(newRefreshToken);
      if (accessToken) localStorage.setItem('authToken', accessToken);
      if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
      if (newExpiresAt) localStorage.setItem('expiresAt', String(newExpiresAt));
    } catch {
      logout();
    }
  };

  // Show confirm dialog 1 minute before expiry
  useEffect(() => {
    if (!session.token || !session.expiresAt) return;
    const msUntilPrompt = session.expiresAt - Date.now() - 60_000;
    const delay = Math.max(0, msUntilPrompt);
    const timeout = setTimeout(() => setDialogOpen(true), delay);
    return () => clearTimeout(timeout);
  }, [session.token, session.expiresAt]);

  // Auto logout at expiry
  useEffect(() => {
    if (!session.expiresAt) return;
    const msUntilLogout = session.expiresAt - Date.now();
    if (msUntilLogout <= 0) { logout(); return; }
    const timer = setTimeout(() => logout(), msUntilLogout);
    return () => clearTimeout(timer);
  }, [session.expiresAt]);

  const handleConfirm = () => { setDialogOpen(false); refreshSession(); };
  const handleLogout = () => { setDialogOpen(false); logout(); };

  // Derived auth flag uses expiry if present
  const isAuthenticated = !!session.token && (!session.expiresAt || session.expiresAt > Date.now());

  return (
    <AuthContext.Provider value={{ session, setSession, logout, isAuthenticated, ready }}>
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