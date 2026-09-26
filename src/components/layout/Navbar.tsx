import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useMeeting } from '../../context/MeetingContext';
import { Video, ShieldCheck, Globe, User, BookOpen, BarChart3, Plus, LogOut } from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'admin' | 'docs';
  setCurrentView: (view: 'landing' | 'dashboard' | 'admin' | 'docs') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { language, setLanguage, t } = useI18n();
  const { user, setUserRole, logout } = useAuth();
  const { inMeeting } = useMeeting();

  // If inside active meeting, navbar is hidden for full immersion
  if (inMeeting) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 text-left group focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AuraMeet
                <span className="text-[10px] font-medium tracking-normal text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-1.5 py-0.2 rounded">
                  SFU HD
                </span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean typography) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={() => setCurrentView('landing')}
            className={`transition-colors hover:text-white ${currentView === 'landing' ? 'text-indigo-400 font-semibold' : ''}`}
          >
            {t.nav.overview}
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`transition-colors hover:text-white ${currentView === 'dashboard' ? 'text-indigo-400 font-semibold' : ''}`}
          >
            {t.nav.meetings}
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`transition-colors hover:text-white ${currentView === 'admin' ? 'text-indigo-400 font-semibold' : ''}`}
          >
            {t.nav.admin}
          </button>
          <button
            onClick={() => setCurrentView('docs')}
            className={`transition-colors hover:text-white flex items-center gap-1 ${currentView === 'docs' ? 'text-indigo-400 font-semibold' : ''}`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            {t.nav.architecture}
          </button>
        </nav>

        {/* Zone 3: Actions, i18n & User Profile */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 text-xs font-medium">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'en'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('vi')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'vi'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              VI
            </button>
          </div>

          {/* Role Switcher Pill for Testing Authorization */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 border border-slate-800 bg-slate-900/60 rounded-lg px-2.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={user.role}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="SUPER_ADMIN" className="bg-slate-900 text-slate-200">Role: Super Admin</option>
              <option value="ADMIN" className="bg-slate-900 text-slate-200">Role: Admin</option>
              <option value="HOST" className="bg-slate-900 text-slate-200">Role: Host (Sarah Chen)</option>
              <option value="CO_HOST" className="bg-slate-900 text-slate-200">Role: Co-Host</option>
              <option value="PARTICIPANT" className="bg-slate-900 text-slate-200">Role: Participant</option>
              <option value="GUEST" className="bg-slate-900 text-slate-200">Role: Guest</option>
            </select>
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <img
              src={user.avatarUrl || '/src/assets/images/avatar_sarah_chen_1790412735734.jpg'}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full border border-slate-700 object-cover"
            />
            <div className="hidden xl:block text-left text-xs">
              <div className="font-medium text-slate-200 leading-tight">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate max-w-[120px]">{user.organizationName}</div>
            </div>
          </div>

          {/* Quick CTA */}
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.nav.newMeeting}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
