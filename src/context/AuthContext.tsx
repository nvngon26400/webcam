import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setUserRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    organizationName?: string,
    role?: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickLoginAs: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const DEFAULT_GUEST_USER: User = {
  id: 'usr_guest_default',
  email: 'guest@aurameet.io',
  name: 'Khách (Guest)',
  role: 'GUEST',
  organizationId: 'org_aurameet_public',
  organizationName: 'AuraMeet Public',
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aurameet_token');
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('aurameet_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default starter user (Ngôn Cnp or Sarah Chen)
    return {
      id: 'usr_ngon_01',
      email: 'ngoncnp01@gmail.com',
      name: 'Ngôn Cnp',
      avatarUrl: '/src/assets/images/avatar_sarah_chen_1790412735734.jpg',
      role: 'HOST',
      organizationId: 'org_aurameet_enterprise',
      organizationName: 'AuraMeet Enterprise',
      createdAt: '2026-01-15T08:00:00Z',
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!token || user.role !== 'GUEST';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Verify token on mount with server
  const verifySession = useCallback(async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          try {
            localStorage.setItem('aurameet_current_user', JSON.stringify(data.user));
          } catch {}
        }
      } else {
        // Token expired on server, clear
        localStorage.removeItem('aurameet_token');
        setToken(null);
      }
    } catch (e) {
      console.warn('Session verification error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      verifySession(token);
    }
  }, [token, verifySession]);

  const setUserRole = (role: UserRole) => {
    setUser((prev) => {
      const updated = { ...prev, role };
      try {
        localStorage.setItem('aurameet_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed.' };
      }

      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('aurameet_token', data.token);
        localStorage.setItem('aurameet_current_user', JSON.stringify(data.user));
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during login.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    organizationName?: string,
    role: UserRole = 'HOST'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, organizationName, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('aurameet_token', data.token);
        localStorage.setItem('aurameet_current_user', JSON.stringify(data.user));
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during registration.' };
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = async (email: string) => {
    return await login(email, 'password123');
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      setToken(null);
      setIsAuthenticated(false);
      setUser(DEFAULT_GUEST_USER);
      try {
        localStorage.removeItem('aurameet_token');
        localStorage.setItem('aurameet_current_user', JSON.stringify(DEFAULT_GUEST_USER));
      } catch {}
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
    if (user.role === 'HOST') {
      const hostPerms = [
        'CREATE_MEETING', 'START_MEETING', 'END_MEETING', 'ADMIT_PARTICIPANT',
        'REMOVE_PARTICIPANT', 'MUTE_PARTICIPANT', 'DISABLE_VIDEO', 'SHARE_SCREEN',
        'SHARE_AUDIO', 'SEND_CHAT', 'DELETE_CHAT', 'RECORD_MEETING', 'LOCK_MEETING',
        'MANAGE_WAITING_ROOM', 'MANAGE_BREAKOUT_ROOMS', 'VIEW_RECORDING'
      ];
      return hostPerms.includes(permission);
    }
    if (user.role === 'CO_HOST') {
      const coHostPerms = [
        'START_MEETING', 'ADMIT_PARTICIPANT', 'REMOVE_PARTICIPANT', 'MUTE_PARTICIPANT',
        'DISABLE_VIDEO', 'SHARE_SCREEN', 'SHARE_AUDIO', 'SEND_CHAT', 'RECORD_MEETING',
        'MANAGE_WAITING_ROOM', 'VIEW_RECORDING'
      ];
      return coHostPerms.includes(permission);
    }
    if (user.role === 'PARTICIPANT') {
      const participantPerms = ['SHARE_SCREEN', 'SHARE_AUDIO', 'SEND_CHAT', 'VIEW_RECORDING'];
      return participantPerms.includes(permission);
    }
    // GUEST
    return ['SHARE_AUDIO', 'SEND_CHAT'].includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        setUser,
        setUserRole,
        hasPermission,
        login,
        register,
        logout,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
