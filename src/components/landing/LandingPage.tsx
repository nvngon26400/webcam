import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useMeeting } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { ThreeCanvas } from '../common/ThreeCanvas';
import { AuthModal } from '../auth/AuthModal';
import {
  Video,
  Shield,
  Zap,
  Globe2,
  Sparkles,
  Users,
  CheckCircle,
  ArrowRight,
  Cpu,
  Layers,
  Lock,
  Radio,
  FileText,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenDocs: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenDocs }) => {
  const { t } = useI18n();
  const { user, isAuthenticated, isHost, isAdmin, isStandardUser, token } = useAuth();
  const { enterLobby } = useMeeting();
  const toast = useToast();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleInstantDemo = async () => {
    if (!isAuthenticated) {
      toast.authRequired(
        'Bạn cần đăng nhập để tạo cuộc họp trực tiếp. Người dùng vãng lai chưa thể tạo phòng.',
        () => openAuth('signin')
      );
      openAuth('signin');
      return;
    }

    if (isStandardUser) {
      toast.warning(
        'Tài khoản của bạn là Người dùng thường (Participant). Bạn có thể tham gia các cuộc họp sẵn có, nhưng cần quyền Host hoặc Admin để tạo cuộc họp mới.',
        'Phân quyền tài khoản (RBAC)'
      );
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `AuraMeet Enterprise — ${user.name}`,
          hostId: user.id,
          hostName: user.name,
          hostAvatar: user.avatarUrl,
          settings: { waitingRoomEnabled: false, muteOnEntry: false },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        enterLobby(json.data);
        toast.success('Đã khởi tạo phòng họp tức thì!', 'AuraMeet SFU');
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || 'Không thể tạo cuộc họp.', 'Lỗi');
      }
    } catch (e) {
      console.warn('Demo session error:', e);
      toast.error('Lỗi kết nối máy chủ.', 'Lỗi mạng');
    }
  };

  const handleGetStartedProtected = () => {
    if (!isAuthenticated) {
      toast.authRequired(
        'Vui lòng đăng nhập để mở Bảng điều khiển cuộc họp.',
        () => openAuth('signin')
      );
      openAuth('signin');
      return;
    }
    onGetStarted();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 transition-colors duration-200 overflow-x-hidden">
      {/* Hero Section with Interactive Three.js 3D WebGL Background */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 overflow-hidden">
        {/* Interactive 3D Three.js Particle Mesh Canvas */}
        <ThreeCanvas className="opacity-70 dark:opacity-90" intensity={1.1} />

        {/* Ambient radial glow backdrop behind 3D canvas */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] lg:w-[800px] h-[300px] sm:h-[450px] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {/* Architectural Trust Kicker */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 bg-white/80 dark:bg-indigo-950/60 backdrop-blur-md rounded-full px-3 py-1 sm:px-4 sm:py-1.5 shadow-sm max-w-full truncate">
              <span className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">{t.landing.heroBadge}</span>
              <span className="text-slate-400 dark:text-slate-600 hidden xs:inline">|</span>
              <span className="text-indigo-600 dark:text-indigo-300 font-mono text-[10px] sm:text-[11px] hidden xs:inline">
                WebGL Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-[1.1] text-balance">
              {t.landing.heroTitle}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto px-2">
              {t.landing.heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-2 sm:pt-4 px-2 sm:px-0">
              <button
                onClick={handleInstantDemo}
                className="w-full sm:w-auto min-h-[46px] px-6 sm:px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video className="w-4 h-4 shrink-0" />
                <span>{t.landing.startInstant}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={onOpenDocs}
                className="w-full sm:w-auto min-h-[46px] px-5 sm:px-6 py-3 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 backdrop-blur-md text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span>{t.landing.openDocs}</span>
              </button>
            </div>

            {/* User status kicker */}
            <div className="pt-2 px-2">
              {isAuthenticated ? (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 backdrop-blur-md shadow-2xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {t.auth.loggedInAs} <strong className="text-slate-900 dark:text-white">{user.name}</strong>
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                      isAdmin
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                        : isHost
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              ) : (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 backdrop-blur-md shadow-2xs">
                  <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>{t.auth.guestNotice}</span>
                  <button
                    onClick={() => openAuth('signin')}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold underline cursor-pointer ml-1"
                  >
                    {t.nav.signIn}
                  </button>
                </div>
              )}
            </div>

            {/* Quantitative Proof - Responsive Grid */}
            <div className="pt-3 max-w-lg mx-auto grid grid-cols-3 gap-2 sm:gap-6 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm block">99.85%</span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate block">
                  {t.admin.iceRate}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm block">&lt; 40ms</span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate block">
                  {t.admin.medianRtt}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm block">1,000+</span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate block">
                  {t.admin.activePeers}
                </span>
              </div>
            </div>
          </div>

          {/* Hero Visual Showcase */}
          <div className="mt-8 sm:mt-14 relative max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl group ring-1 ring-slate-200/50 dark:ring-white/10">
            <img
              src="/src/assets/images/hero_collab_space_1790412756485.jpg"
              alt="AuraMeet Executive Collaboration Suite"
              referrerPolicy="no-referrer"
              className="w-full aspect-[4/3] sm:aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-4 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                    Global Glass-to-Glass Pipeline
                  </div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white">
                    Simulcast-Optimized Media Mesh with Audio VU Analysis
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 max-w-xl hidden xs:block">
                    Every participant receives dynamically tailored 1080p, 720p, or 360p video streams based on viewport visibility and bandwidth feedback.
                  </p>
                </div>
                <button
                  onClick={handleGetStartedProtected}
                  className="px-4 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all self-start sm:self-auto cursor-pointer whitespace-nowrap min-h-[38px]"
                >
                  {t.nav.dashboard}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SFU Topology Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
            <span className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t.landing.topologyTitle}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.landing.topologyDesc}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* P2P Mesh Box */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-950/60 border border-rose-200 dark:border-rose-900/30 space-y-3 sm:space-y-4 shadow-sm">
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between">
                <span>{t.landing.meshHeader}</span>
                <span className="font-mono text-[11px]">O(N²) Bandwidth</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>{t.landing.meshDrawback1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>{t.landing.meshDrawback2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>{t.landing.meshDrawback3}</span>
                </li>
              </ul>
            </div>

            {/* AuraMeet SFU Box */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-950/80 border border-emerald-300 dark:border-emerald-800/50 space-y-3 sm:space-y-4 shadow-md ring-1 ring-emerald-500/20">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>{t.landing.sfuHeader}</span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-300 font-bold">
                  O(1) Bandwidth
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t.landing.sfuBenefit1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t.landing.sfuBenefit2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t.landing.sfuBenefit3}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
            <span className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t.landing.featuresTitle}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.landing.featuresSubtitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Active Speaker & VU Analyser
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Phân tích cường độ âm thanh micro theo thời gian thực (Web Audio API VU meter), phát hiện giọng nói tức thì và điều hướng luồng âm thanh thông minh.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-300" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Gemini AI Meeting Minutes
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tự động trích xuất biên bản điều hành, các quyết định then chốt và phân công đầu việc trực tiếp từ diễn biến cuộc họp với mô hình Gemini AI.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3 sm:col-span-2 lg:col-span-1 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Phòng chia nhóm nhỏ & Ghi hình
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Hỗ trợ chia nhỏ cuộc họp thành nhiều phòng Breakout Room linh hoạt, quản lý phòng chờ (Waiting Room) và lưu trữ video xem lại vào Database thực.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Auth Modal for Sign In / Sign Up */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
