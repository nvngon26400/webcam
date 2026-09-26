import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User;
  setUser: (user: User) => void;
  setUserRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
}

const DEFAULT_USER: User = {
  id: 'usr_sarah_chen_01',
  email: 'sarah.chen@aurameet.enterprise.io',
  name: 'Sarah Chen',
  avatarUrl: '/src/assets/images/avatar_sarah_chen_1790412735734.jpg',
  role: 'HOST',
  organizationId: 'org_acme_cloud',
  organizationName: 'Acme Cloud Global',
  createdAt: '2026-01-15T08:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('aurameet_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  useEffect(() => {
    try {
      localStorage.setItem('aurameet_current_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  const setUserRole = (role: UserRole) => {
    setUser((prev) => ({ ...prev, role }));
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

  const logout = () => {
    setUser({
      ...DEFAULT_USER,
      id: 'usr_guest_' + Math.random().toString(36).substring(7),
      name: 'Guest User',
      email: 'guest@aurameet.io',
      role: 'GUEST',
    });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, setUserRole, hasPermission, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
