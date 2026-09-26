import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isHost: boolean;
  isStandardUser: boolean;
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
  loginWithGoogle: (
    email: string,
    name?: string,
    avatarUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickLoginAs: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export const DEFAULT_GUEST_USER: User = {
  id: 'usr_guest_unauthenticated',
  email: '',
  name: 'Khách (Chưa đăng nhập)',
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
      const savedToken = localStorage.getItem('aurameet_token');
      const saved = localStorage.getItem('aurameet_current_user');
      // Only restore user if token also exists
      if (savedToken && saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_GUEST_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedToken = localStorage.getItem('aurameet_token');
      return !!savedToken;
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Computed RBAC helpers
  const isAdmin = isAuthenticated && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
  const isSuperAdmin = isAuthenticated && user.role === 'SUPER_ADMIN';
  const isHost = isAuthenticated && (user.role === 'HOST' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
  const isStandardUser = !isAdmin && !isHost;

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
        // Token expired or invalid on server, reset to guest
        localStorage.removeItem('aurameet_token');
        localStorage.removeItem('aurameet_current_user');
        setToken(null);
        setUser(DEFAULT_GUEST_USER);
        setIsAuthenticated(false);
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
    } else {
      setIsAuthenticated(false);
      setUser(DEFAULT_GUEST_USER);
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
        return { success: false, error: data.error || 'Đăng nhập không thành công.' };
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
      return { success: false, error: err?.message || 'Lỗi mạng khi kết nối máy chủ.' };
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
        return { success: false, error: data.error || 'Đăng ký không thành công.' };
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
      return { success: false, error: err?.message || 'Lỗi mạng khi đăng ký tài khoản.' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (email: string, name?: string, avatarUrl?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatarUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        try {
          localStorage.setItem('aurameet_token', data.token);
          localStorage.setItem('aurameet_current_user', JSON.stringify(data.user));
        } catch {}
        return { success: true };
      }
      return { success: false, error: data.error || 'Đăng nhập Google không thành công.' };
    } catch (e: any) {
      return { success: false, error: 'Lỗi kết nối khi đăng nhập Google.' };
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
        localStorage.removeItem('aurameet_current_user');
      } catch {}
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
    if (user.role === 'HOST') {
      const hostPerms = [
        'CREATE_MEETING',
        'START_MEETING',
        'END_MEETING',
        'ADMIT_PARTICIPANT',
        'REMOVE_PARTICIPANT',
        'MUTE_PARTICIPANT',
        'DISABLE_VIDEO',
        'SHARE_SCREEN',
        'SHARE_AUDIO',
        'SEND_CHAT',
        'DELETE_CHAT',
        'RECORD_MEETING',
        'LOCK_MEETING',
        'MANAGE_WAITING_ROOM',
        'MANAGE_BREAKOUT_ROOMS',
        'VIEW_RECORDING',
        'GENERATE_AI_MINUTES',
      ];
      return hostPerms.includes(permission);
    }
    if (user.role === 'PARTICIPANT') {
      // Standard user can only participate and send chat, cannot start instant meeting / breakout / record
      const participantPerms = ['SHARE_AUDIO', 'SHARE_SCREEN', 'SEND_CHAT', 'VIEW_RECORDING'];
      return participantPerms.includes(permission);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isAdmin,
        isSuperAdmin,
        isHost,
        isStandardUser,
        setUser,
        setUserRole,
        hasPermission,
        login,
        register,
        loginWithGoogle,
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
