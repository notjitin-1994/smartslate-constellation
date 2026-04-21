'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;
  lastActivity: Date | null;
  sessionExpiry: Date | null;
  isSessionValid: boolean;
  rememberMe: boolean;
  autoLogin: boolean;
  setAuth: (user: User | null, session: Session | null) => void;
  setStatus: (status: AuthStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastActivity: (date: Date) => void;
  setSessionExpiry: (date: Date) => void;
  setRememberMe: (remember: boolean) => void;
  setAutoLogin: (auto: boolean) => void;
  checkSessionValidity: () => boolean;
  clearAuth: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      status: 'loading',
      isLoading: false,
      error: null,
      lastActivity: null,
      sessionExpiry: null,
      isSessionValid: false,
      rememberMe: false,
      autoLogin: false,

      setAuth: (user, session) => {
        const now = new Date();
        const sessionExpiry = session?.expires_at ? new Date(session.expires_at * 1000) : null;
        set({
          user,
          session,
          status: user ? 'authenticated' : 'unauthenticated',
          lastActivity: now,
          sessionExpiry,
          isSessionValid: sessionExpiry ? sessionExpiry > now : false,
          error: null,
        });
      },

      setStatus: (status) => set({ status }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setLastActivity: (date) => set({ lastActivity: date }),
      setSessionExpiry: (date) => set({ sessionExpiry: date }),
      setRememberMe: (remember) => set({ rememberMe: remember }),
      setAutoLogin: (auto) => set({ autoLogin: auto }),

      checkSessionValidity: () => {
        const { sessionExpiry } = get();
        const now = new Date();
        const isValid = sessionExpiry ? sessionExpiry > now : false;
        set({ isSessionValid: isValid });
        return isValid;
      },

      clearAuth: () => {
        set({
          user: null,
          session: null,
          status: 'unauthenticated',
          lastActivity: null,
          sessionExpiry: null,
          isSessionValid: false,
          error: null,
        });
      },

      reset: () => {
        set({
          user: null,
          session: null,
          status: 'loading',
          isLoading: false,
          error: null,
          lastActivity: null,
          sessionExpiry: null,
          isSessionValid: false,
          rememberMe: false,
          autoLogin: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        rememberMe: state.rememberMe,
        autoLogin: state.autoLogin,
        lastActivity: state.lastActivity,
      }),
    }
  )
);
