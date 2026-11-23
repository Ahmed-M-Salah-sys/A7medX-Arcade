'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ─── Hardcoded Admin Credentials ───────────────────────────────────────────
const ADMIN_EMAIL = 'ahmedsalah567801@gmail.com';
const ADMIN_PASSWORD = 'ah3122010';
const STORAGE_KEY = 'arcade_auth';
const TOKEN_KEY = 'arcade_token';

// ─── Types ─────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  displayName: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  hydrated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

// ─── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        parsed.displayName = parsed.name || parsed.displayName || parsed.email;
        parsed.name = parsed.name || parsed.displayName;
        setUser(parsed);
      }
      if (storedToken) {
        setToken(storedToken);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Update user state and persist to localStorage
  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next: AuthUser = {
        ...prev,
        ...updates,
        name: updates.name || updates.displayName || prev.name,
        displayName: updates.displayName || updates.name || prev.displayName,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Synchronize admin name from profile settings on mount and role change
  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/profile')
        .then((res) => res.json())
        .then((data) => {
          const profileName = data.profile?.displayName || data.profile?.name;
          if (data.success && profileName) {
            updateUser({ name: profileName, displayName: profileName });
          }
        })
        .catch(() => {});
    }
  }, [user?.role, updateUser]);

  // Listen to profileUpdated events dispatched across window
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ name?: string; displayName?: string }>;
      const profileName = custom.detail?.displayName || custom.detail?.name;
      if (profileName) {
        updateUser({ name: profileName, displayName: profileName });
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [updateUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        return { success: false, error: 'Email and password are required.' };
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            name: data.user.name,
            displayName: data.user.name,
          };
          setUser(authUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

          if (data.token) {
            setToken(data.token);
            localStorage.setItem(TOKEN_KEY, data.token);
          }

          return { success: true, user: authUser };
        }

        return { success: false, error: data.error || 'Invalid email or password.' };
      } catch {
        // Fallback admin check if fetch fails
        if (trimmedEmail === ADMIN_EMAIL.toLowerCase() && trimmedPassword === ADMIN_PASSWORD) {
          const adminUser: AuthUser = {
            id: 'admin',
            email: ADMIN_EMAIL,
            role: 'admin',
            name: 'Ahmed Mohamed Salah',
            displayName: 'Ahmed Mohamed Salah',
          };
          setUser(adminUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
          return { success: true, user: adminUser };
        }
        return { success: false, error: 'Connection error. Please try again.' };
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!trimmedName || !trimmedEmail || !trimmedPassword) {
        return { success: false, error: 'All fields are required.' };
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password: trimmedPassword }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            name: data.user.name,
            displayName: data.user.name,
          };
          setUser(authUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

          if (data.token) {
            setToken(data.token);
            localStorage.setItem(TOKEN_KEY, data.token);
          }

          return { success: true, user: authUser };
        }

        return { success: false, error: data.error || 'Registration failed.' };
      } catch {
        return { success: false, error: 'Connection error. Please try again.' };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isLoggedIn, hydrated, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
