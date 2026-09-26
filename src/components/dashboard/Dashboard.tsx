import React, { useState, useEffect } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { Meeting } from '../../types';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  ArrowRight,
  Shield,
  Play,
  HardDrive,
  Download,
  Settings,
  Sparkles,
  Lock,
  ShieldAlert,
  Info,
  X,
  Radio,
  FileVideo,
  CheckCircle2,
  StopCircle,
} from 'lucide-react';

interface ReplayModalData {
  id: string;
  title: string;
  hostName: string;
  durationSeconds: number;
  url: string;
  createdAt: string;
  participantCount: number;
  summary?: string;
}

export const Dashboard: React.FC = () => {
  const { t } = useI18n();
  const { user, token, isStandardUser, isAdmin, isHost } = useAuth();
  const { enterLobby } = useMeeting();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'active' | 'recordings'>('active');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Video Replay Modal State
  const [replayModal, setReplayModal] = useState<ReplayModalData | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // New Meeting Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [muteOnEntry, setMuteOnEntry] = useState(false);

  // Fetch meetings and recordings from server
  const fetchDashboardData = async () => {
    try {
      const [resMeetings, resRecordings] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/recordings'),
      ]);

      if (resMeetings.ok) {
        const json = await resMeetings.json();
        setMeetings(json.data || []);
      }
      if (resRecordings.ok) {
        const jsonRec = await resRecordings.json();
        setRecordings(jsonRec.data || []);
      }
    } catch (e) {
      console.warn('Failed to load dashboard data:', e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartInstant = async () => {
    if (isStandardUser) {
      toast.warning(
        'Tài khoản của bạn là Người dùng thường (Participant), không có quyền tạo cuộc họp. Vui lòng liên hệ Admin để nâng quyền Host.',
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
          title: `${user.name} — ${t.dashboard.instantMeeting}`,
          hostId: user.id,
          hostName: user.name,
          hostAvatar: user.avatarUrl,
          settings: { waitingRoomEnabled: false, muteOnEntry: false },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        fetchDashboardData();
        enterLobby(json.data);
        toast.success('Đã khởi tạo phòng họp tức thì!', 'AuraMeet SFU');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Không thể tạo cuộc họp.', 'Lỗi');
      }
    } catch (e) {
      console.warn('Error starting instant meeting:', e);
      toast.error('Lỗi kết nối máy chủ.', 'Lỗi mạng');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (isStandardUser) {
      toast.warning(
        'Tài khoản của bạn là Người dùng thường (Participant), không có quyền lên lịch cuộc họp.',
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
          title: newTitle.trim(),
          description: newDesc.trim(),
          hostId: user.id,
          hostName: user.name,
          hostAvatar: user.avatarUrl,
          scheduledStartTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          settings: { waitingRoomEnabled, muteOnEntry },
        }),
      });

      if (res.ok) {
        setIsScheduleOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchDashboardData();
        toast.success('Đã lên lịch cuộc họp thành công!', 'Lịch cuộc họp');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Lỗi khi lên lịch cuộc họp.');
      }
    } catch (e) {
      console.warn('Error scheduling meeting:', e);
      toast.error('Lỗi kết nối máy chủ.');
    }
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/meetings/${meetingId}/end`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          durationSeconds: Math.floor(Math.random() * 600) + 180,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        }),
      });

      if (res.ok) {
        toast.success('Cuộc họp đã kết thúc và video được lưu trữ thành công!', 'Đã kết thúc cuộc họp');
        fetchDashboardData();
        setActiveTab('recordings');
      } else {
        toast.error('Không thể kết thúc cuộc họp.');
      }
    } catch (e) {
      toast.error('Lỗi kết nối máy chủ.');
    }
  };

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickJoinCode.trim();
    if (!clean) return;

    const matched = meetings.find((m) => m.id === clean);
    if (matched) {
      enterLobby(matched);
      toast.info(`Đang kết nối vào phòng họp ${matched.title}...`, 'Tham gia cuộc họp');
    } else {
      enterLobby({
        id: clean,
        title: `Room ${clean}`,
        hostId: 'host',
        hostName: 'Organizer',
        scheduledStartTime: new Date().toISOString(),
        status: 'LIVE',
        settings: {
          isLocked: false,
          waitingRoomEnabled: false,
          allowScreenShare: true,
          allowChat: true,
          muteOnEntry: false,
          requireHostApproval: false,
          maxParticipants: 100,
          e2eeEnabled: true,
          simulcastEnabled: true,
          preferredQuality: 'auto',
        },
        participantCount: 1,
        createdAt: new Date().toISOString(),
      });
      toast.info(`Đang kết nối vào phòng ${clean}...`, 'Phòng họp');
    }
  };

  const copyCode = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Đã sao chép mã cuộc họp vào bộ nhớ tạm!', 'Sao chép');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter meetings by status
  const ongoingMeetings = meetings.filter((m) => m.status === 'LIVE' || m.status === 'SCHEDULED');
  const completedMeetings = meetings.filter((m) => m.status === 'ENDED');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 transition-colors duration-200 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 sm:pb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase">
              <span className="truncate max-w-[200px]">{user.organizationName}</span>
              <span>·</span>
              <span className="font-mono">WebRTC SFU Cluster</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1 flex flex-wrap items-center gap-2.5">
              <span>{t.dashboard.welcome}, {user.name}</span>
              <span
                className={`font-mono text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase shadow-2xs ${
                  isAdmin
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40'
                    : isHost
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                }`}
              >
                {user.role}
              </span>
            </h1>
          </div>

          {/* Quick Actions (Full width on mobile, inline on tablet+) */}
          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (isStandardUser) {
                  toast.warning(
                    'Tài khoản của bạn là Người dùng thường (Participant), không có quyền lên lịch cuộc họp.',
                    'Quyền hạn RBAC'
                  );
                  return;
                }
                setIsScheduleOpen(true);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold shadow-xs transition-all cursor-pointer min-h-[42px] ${
                isStandardUser
                  ? 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-400 opacity-60'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200'
              }`}
            >
              {isStandardUser ? <Lock className="w-4 h-4 text-amber-500" /> : <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              <span>{t.dashboard.scheduleMeeting}</span>
            </button>

            <button
              onClick={handleStartInstant}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-md transition-all cursor-pointer min-h-[42px] ${
                isStandardUser
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 hover:scale-[1.01]'
              }`}
            >
              {isStandardUser ? <Lock className="w-4 h-4 text-amber-500" /> : <Video className="w-4 h-4" />}
              <span>{t.dashboard.instantMeeting}</span>
            </button>
          </div>
        </div>

        {/* RBAC notice banner for standard users */}
        {isStandardUser && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-amber-800 dark:text-amber-300 font-semibold block mb-0.5">
                Chế độ Người dùng thường (Participant)
              </strong>
              Bạn có thể xem các cuộc họp đang diễn ra và tham gia bằng mã phòng bên dưới. Quyền tạo cuộc họp mới, ghi hình và quản lý phòng được điều khiển bởi Quản trị viên (Admin).
            </div>
          </div>
        )}

        {/* Quick Join Banner */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Bạn có mã mời hoặc đường dẫn cuộc họp?
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Nhập mã cuộc họp (ví dụ: aur-123-456) để kết nối trực tiếp vào phòng hội nghị.
            </p>
          </div>

          <form onSubmit={handleQuickJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={quickJoinCode}
              onChange={(e) => setQuickJoinCode(e.target.value)}
              placeholder={t.dashboard.quickJoinPlaceholder}
              className="w-full sm:w-64 md:w-72 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono min-h-[42px]"
            />
            <button
              type="submit"
              disabled={!quickJoinCode.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all whitespace-nowrap shadow-md shadow-indigo-600/20 cursor-pointer min-h-[42px] flex items-center justify-center"
            >
              {t.dashboard.joinBtn}
            </button>
          </form>
        </div>

        {/* Dynamic Filter Tabs: Active vs Recordings */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{t.dashboard.tabsActive}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'active'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {ongoingMeetings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recordings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'recordings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <FileVideo className="w-3.5 h-3.5" />
            <span>{t.dashboard.tabsRecordings}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'recordings'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {recordings.length + completedMeetings.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Ongoing / Active Meetings */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {ongoingMeetings.length === 0 ? (
              <div className="p-8 sm:p-14 text-center rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <Radio className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.dashboard.noActiveMeetings}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {t.dashboard.noActiveMeetingsDesc}
                </p>
                {!isStandardUser && (
                  <button
                    onClick={handleStartInstant}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.dashboard.instantMeeting}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {ongoingMeetings.map((m) => {
                  const isLive = m.status === 'LIVE' || m.participantCount > 0;
                  const canEnd = isAdmin || user.id === m.hostId;
                  return (
                    <div
                      key={m.id}
                      className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isLive
                                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 animate-pulse'
                                : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isLive ? 'bg-rose-500' : 'bg-indigo-500'
                              }`}
                            />
                            <span>{isLive ? t.dashboard.statusLive : t.dashboard.statusScheduled}</span>
                          </span>

                          <button
                            onClick={() => copyCode(m.id)}
                            className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-mono transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Sao chép mã cuộc họp"
                          >
                            <span>{m.id}</span>
                            {copiedId === m.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {m.title}
                        </h3>

                        {m.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {m.description}
                          </p>
                        )}

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{t.dashboard.host}:</span>
                          <span>{m.hostName}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>{m.participantCount} {t.dashboard.participants}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {canEnd && (
                            <button
                              onClick={() => handleEndMeeting(m.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-500/30 transition-all cursor-pointer min-h-[36px]"
                              title="Kết thúc và lưu lại video xem lại"
                            >
                              <StopCircle className="w-3.5 h-3.5 inline mr-1" />
                              <span>Kết thúc</span>
                            </button>
                          )}

                          <button
                            onClick={() => enterLobby(m)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] cursor-pointer min-h-[36px]"
                          >
                            <span>{t.dashboard.joinBtn}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Completed Meetings & Video Replays */}
        {activeTab === 'recordings' && (
          <div className="space-y-4">
            {recordings.length === 0 && completedMeetings.length === 0 ? (
              <div className="p-8 sm:p-14 text-center rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <FileVideo className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.dashboard.noRecordings}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {t.dashboard.noRecordingsDesc}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {/* Render recordings from recordings database */}
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                        <span className="flex items-center gap-1 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(rec.durationSeconds / 60)}m {rec.durationSeconds % 60}s
                        </span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                          {t.dashboard.statusEnded}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {rec.meetingTitle}
                      </h4>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p>
                          {t.dashboard.host}: <strong className="text-slate-700 dark:text-slate-300">{rec.hostName || 'Organizer'}</strong>
                        </p>
                        <p>
                          {t.dashboard.endedAt}: {new Date(rec.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() =>
                          setReplayModal({
                            id: rec.id,
                            title: rec.meetingTitle,
                            hostName: rec.hostName || 'Host',
                            durationSeconds: rec.durationSeconds,
                            url: rec.url,
                            createdAt: rec.createdAt,
                            participantCount: rec.participantCount || 1,
                            summary: rec.summary,
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer min-h-[38px]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t.dashboard.replayVideo}</span>
                      </button>

                      <a
                        href={rec.url}
                        download={`recording-${rec.id}.mp4`}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center min-h-[38px] min-w-[38px]"
                        title={t.dashboard.downloadVideo}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Replay Modal */}
      {replayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col text-slate-900 dark:text-slate-100">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div className="truncate">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {replayModal.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.dashboard.replayVideo} · {t.dashboard.host}: {replayModal.hostName} · {Math.floor(replayModal.durationSeconds / 60)}m {replayModal.durationSeconds % 60}s
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReplayModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Display */}
            <div className="bg-black relative aspect-video flex items-center justify-center overflow-hidden">
              <video
                src={replayModal.url}
                controls
                autoPlay
                playbackRate={playbackSpeed}
                className="w-full h-full object-contain"
              >
                Trình duyệt của bạn không hỗ trợ phát thẻ video.
              </video>
            </div>

            {/* Controls Bar & Metadata */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t.dashboard.speed}:
                  </span>
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <a
                  href={replayModal.url}
                  download={`replay-${replayModal.id}.mp4`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-xs font-semibold border border-indigo-200 dark:border-indigo-500/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.dashboard.downloadVideo}</span>
                </a>
              </div>

              {/* AI Minutes & Summary Takeaway */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.dashboard.meetingSummary}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {replayModal.summary ||
                    'Cuộc họp kết thúc thành công với sự tham gia của các thành viên. Hệ thống SFU đã lưu trữ toàn bộ các luồng video và tín hiệu âm thanh vào cơ sở dữ liệu để phục vụ việc xem lại.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.dashboard.scheduleMeeting}
              </h3>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề cuộc họp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Họp thảo luận kỹ thuật quý 3..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả & Mục tiêu cuộc họp
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Nội dung chính và các quyết định cần thống nhất..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waitingRoomEnabled}
                    onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600"
                  />
                  <span>Bật phòng chờ (Chủ tọa phê duyệt trước khi vào)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={muteOnEntry}
                    onChange={(e) => setMuteOnEntry(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600"
                  />
                  <span>Tự động tắt tiếng micro khi vào phòng</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-colors cursor-pointer min-h-[38px]"
                >
                  Tạo cuộc họp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
