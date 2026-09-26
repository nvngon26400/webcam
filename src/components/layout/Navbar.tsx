import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useMeeting } from '../../context/MeetingContext';
import {
  Video,
  ShieldCheck,
  Globe,
  User as UserIcon,
  BookOpen,
  Plus,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  Building2,
  Mail,
  Check,
} from 'lucide-react';
import { UserRole } from '../../types';
import { AuthModal } from '../auth/AuthModal';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'admin' | 'docs';
  setCurrentView: (view: 'landing' | 'dashboard' | 'admin' | 'docs') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { language, setLanguage, t, availableLanguages } = useI18n();
  const { user, isAuthenticated, setUserRole, logout } = useAuth();
  const { inMeeting } = useMeeting();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // If inside active meeting, navbar is hidden for full immersion
  if (inMeeting) return null;

  const currentLangObj = availableLanguages.find((l) => l.code === language) || availableLanguages[0];

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
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
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 5-Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 transition-colors"
                title="Select language"
              >
                <span>{currentLangObj.flag}</span>
                <span className="font-semibold uppercase">{currentLangObj.code}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-semibold text-slate-500 px-2 py-1 uppercase tracking-wider">
                    Select Language
                  </div>
                  {availableLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                        language === l.code
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.name}</span>
                      </div>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role Switcher Pill for testing RBAC */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 border border-slate-800 bg-slate-900/60 rounded-lg px-2.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={user.role}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="SUPER_ADMIN" className="bg-slate-900 text-slate-200">Super Admin</option>
                <option value="ADMIN" className="bg-slate-900 text-slate-200">Admin</option>
                <option value="HOST" className="bg-slate-900 text-slate-200">Host</option>
                <option value="CO_HOST" className="bg-slate-900 text-slate-200">Co-Host</option>
                <option value="PARTICIPANT" className="bg-slate-900 text-slate-200">Participant</option>
                <option value="GUEST" className="bg-slate-900 text-slate-200">Guest</option>
              </select>
            </div>

            {/* Authentication Buttons / User Profile */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-colors focus:outline-none"
                >
                  <img
                    src={user.avatarUrl || '/src/assets/images/avatar_sarah_chen_1790412735734.jpg'}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-full border border-slate-700 object-cover"
                  />
                  <div className="hidden xl:block text-left text-xs">
                    <div className="font-semibold text-slate-200 leading-tight truncate max-w-[100px]">{user.name}</div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                      <img
                        src={user.avatarUrl || '/src/assets/images/avatar_sarah_chen_1790412735734.jpg'}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-full border border-slate-700 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-1.5 text-slate-300">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Organization:</span>
                        </span>
                        <span className="text-white font-medium truncate max-w-[120px]">{user.organizationName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Role:</span>
                        </span>
                        <span className="text-indigo-400 font-semibold">{user.role}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleOpenAuth('signin');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Switch Account</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.nav.signOut}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenAuth('signin')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.nav.signIn}</span>
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.nav.signUp}</span>
                </button>
              </div>
            )}

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

      {/* Real Auth Modal for Sign In / Sign Up */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
