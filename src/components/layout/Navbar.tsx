import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useMeeting } from '../../context/MeetingContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
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
  Sun,
  Moon,
  ShieldAlert,
  Lock,
  Menu,
  X as CloseIcon,
  Shield,
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'admin' | 'docs';
  setCurrentView: (view: 'landing' | 'dashboard' | 'admin' | 'docs') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { language, setLanguage, t, availableLanguages } = useI18n();
  const { user, isAuthenticated, isAdmin, isStandardUser, logout } = useAuth();
  const { inMeeting } = useMeeting();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If inside active meeting, navbar is hidden for full immersion
  if (inMeeting) return null;

  const currentLangObj = availableLanguages.find((l) => l.code === language) || availableLanguages[0];

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    setCurrentView('landing');
    toast.info('Bạn đã đăng xuất tài khoản an toàn.', 'Đăng xuất');
  };

  const handleNavigate = (view: 'landing' | 'dashboard' | 'admin' | 'docs') => {
    setIsMobileMenuOpen(false);
    if (view === 'dashboard') {
      if (!isAuthenticated) {
        toast.authRequired(
          'Vui lòng đăng nhập để truy cập Bảng điều khiển cuộc họp.',
          () => handleOpenAuth('signin')
        );
        handleOpenAuth('signin');
        return;
      }
    } else if (view === 'admin') {
      if (!isAuthenticated) {
        toast.authRequired(
          'Vui lòng đăng nhập tài khoản Quản trị viên (Admin) để vào Bảng quản trị.',
          () => handleOpenAuth('signin')
        );
        handleOpenAuth('signin');
        return;
      }
      if (!isAdmin) {
        toast.warning(
          'Tài khoản của bạn là Người dùng thường (Participant), không có quyền truy cập Bảng quản trị (Admin Console).',
          'Truy cập bị từ chối'
        );
        return;
      }
    }
    setCurrentView(view);
  };

  const handleNewMeetingClick = () => {
    setIsMobileMenuOpen(false);
    if (!isAuthenticated) {
      toast.authRequired(
        'Vui lòng đăng nhập để bắt đầu cuộc họp mới.',
        () => handleOpenAuth('signin')
      );
      handleOpenAuth('signin');
      return;
    }

    if (isStandardUser) {
      toast.warning(
        'Tài khoản của bạn là Người dùng thường (Participant). Bạn có thể tham gia các cuộc họp sẵn có, nhưng chưa có quyền tạo cuộc họp mới. Hãy liên hệ Quản trị viên (Admin) để cấp quyền Host.',
        'Giới hạn quyền hạn (RBAC)'
      );
      return;
    }

    setCurrentView('dashboard');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleNavigate('landing')}
              className="flex items-center gap-2 text-left focus:outline-none cursor-pointer group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  {t.nav.brand}
                  <span className="hidden xs:inline rounded bg-indigo-500/15 dark:bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                    Enterprise
                  </span>
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop & Tablet) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
            {/* Landing/Overview */}
            <button
              onClick={() => handleNavigate('landing')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'landing'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {t.nav.overview}
            </button>

            {/* Dashboard (Cuộc họp) */}
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{t.nav.meetings}</span>
              {!isAuthenticated && (
                <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              )}
            </button>

            {/* Admin Console */}
            {isAdmin ? (
              <button
                onClick={() => handleNavigate('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-indigo-50 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{t.nav.admin}</span>
                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-200 font-mono font-bold">
                  Admin
                </span>
              </button>
            ) : isAuthenticated ? (
              <div
                title="Chỉ dành cho Quản trị viên (Admin)"
                className="flex items-center gap-1 px-2.5 py-1 text-slate-400 dark:text-slate-500 text-xs opacity-60 cursor-not-allowed"
              >
                <Lock className="w-3 h-3" />
                <span>{t.nav.admin}</span>
              </div>
            ) : null}

            {/* Architecture Whitepaper */}
            <button
              onClick={() => handleNavigate('docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'docs'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t.nav.architecture}</span>
            </button>
          </nav>

          {/* Zone 3: Actions (Theme, Language, Auth, New Meeting, Mobile Toggle) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
              aria-label="Đổi theme sáng tối"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* 5-Language Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer min-h-[38px]"
                aria-expanded={isLangMenuOpen}
              >
                <span className="text-sm">{currentLangObj.flag}</span>
                <span className="font-bold text-xs hidden sm:inline">{currentLangObj.code.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 text-slate-900 dark:text-slate-100">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 px-2.5 py-1 font-semibold">
                    {t.nav.selectLanguage}
                  </div>
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangMenuOpen(false);
                        toast.success(`Đã đổi ngôn ngữ sang ${lang.name}`, 'Đa ngôn ngữ');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                        language === lang.code
                          ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      {language === lang.code && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Auth Section */}
            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer min-h-[38px]"
                >
                  <div className="text-left hidden md:block pr-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white max-w-[120px] truncate leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium flex items-center gap-1">
                      <span>{user.role}</span>
                      {isAdmin && <ShieldCheck className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  </div>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-indigo-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 mr-1" />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-slate-900 dark:text-slate-100">
                    {/* User summary card */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 mb-2">
                      <div className="flex items-center gap-2.5">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-indigo-500/40 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{user.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">{t.auth.roleLabel}</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            isAdmin
                              ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                              : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Navigation shortcut to Admin Console */}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleNavigate('admin');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer font-semibold mb-1"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Mở Bảng điều khiển Quản trị</span>
                      </button>
                    )}

                    {/* Logout button */}
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.nav.signOut}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenAuth('signin')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer min-h-[38px]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.nav.signIn}</span>
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer min-h-[38px] shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.nav.signUp}</span>
                </button>
              </div>
            )}

            {/* Quick CTA: Cuộc họp mới (Visible on Desktop / Tablet) */}
            <button
              onClick={handleNewMeetingClick}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors whitespace-nowrap cursor-pointer min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.nav.newMeeting}</span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] items-center justify-center"
              aria-label="Mở menu di động"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <CloseIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800/90 bg-white/98 dark:bg-slate-950/95 px-4 pt-3 pb-6 backdrop-blur-xl animate-in slide-in-from-top-4 duration-200 space-y-4 text-slate-900 dark:text-slate-100 shadow-xl">
            {/* Primary Nav Links */}
            <div className="space-y-1">
              <button
                onClick={() => handleNavigate('landing')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentView === 'landing'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <span>{t.nav.overview}</span>
              </button>

              <button
                onClick={() => handleNavigate('dashboard')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{t.nav.meetings}</span>
                  {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
                </div>
              </button>

              {isAdmin ? (
                <button
                  onClick={() => handleNavigate('admin')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-indigo-600 text-white'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.nav.admin}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                    Admin
                  </span>
                </button>
              ) : null}

              <button
                onClick={() => handleNavigate('docs')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentView === 'docs'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{t.nav.architecture}</span>
                </div>
              </button>
            </div>

            {/* Quick Meeting Action */}
            <button
              onClick={handleNewMeetingClick}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.nav.newMeeting}</span>
            </button>

            {/* Mobile Auth / Profile Section */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
              {isAuthenticated ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-indigo-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isAdmin
                          ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                          : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.nav.signOut}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenAuth('signin')}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t.nav.signIn}</span>
                  </button>
                  <button
                    onClick={() => handleOpenAuth('signup')}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t.nav.signUp}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
