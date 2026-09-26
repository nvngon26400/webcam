import React, { useState, useEffect } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
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
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const { enterLobby, recordingsList } = useMeeting();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Meeting Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [muteOnEntry, setMuteOnEntry] = useState(false);

  // Fetch meetings from server
  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const json = await res.json();
        setMeetings(json.data);
      }
    } catch (e) {
      console.warn('Failed to load meetings:', e);
    }
  };

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartInstant = async () => {
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
        enterLobby(json.data);
      }
    } catch (e) {
      console.warn('Error starting instant meeting:', e);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

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
        const json = await res.json();
        setMeetings((prev) => [json.data, ...prev]);
        setIsScheduleOpen(false);
        setNewTitle('');
        setNewDesc('');
      }
    } catch (e) {
      console.warn('Error scheduling meeting:', e);
    }
  };

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickJoinCode.trim();
    if (!clean) return;

    const matched = meetings.find((m) => m.id === clean);
    if (matched) {
      enterLobby(matched);
    } else {
      // Create ad-hoc session
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
    }
  };

  const copyCode = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold tracking-wider uppercase">
              <span>{user.organizationName}</span>
              <span>·</span>
              <span className="font-mono">Global Cloud SFU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {t.dashboard.welcome}, {user.name}
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold shadow-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{t.dashboard.scheduleMeeting}</span>
            </button>

            <button
              onClick={handleStartInstant}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01]"
            >
              <Video className="w-4 h-4" />
              <span>{t.dashboard.instantMeeting}</span>
            </button>
          </div>
        </div>

        {/* Quick Join Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Have a meeting invite code?
            </h2>
            <p className="text-xs text-slate-400">
              Enter any meeting code (e.g. aur-eng-sync or aur-382-910) to join directly.
            </p>
          </div>

          <form onSubmit={handleQuickJoin} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={quickJoinCode}
              onChange={(e) => setQuickJoinCode(e.target.value)}
              placeholder={t.dashboard.quickJoinPlaceholder}
              className="w-full sm:w-72 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={!quickJoinCode.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all whitespace-nowrap shadow-md shadow-indigo-600/20"
            >
              {t.dashboard.joinBtn}
            </button>
          </form>
        </div>

        {/* Scheduled & Active Meetings Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              {t.dashboard.upcomingTitle}
            </h2>
            <span className="text-xs text-slate-500">Live SFU synchronization active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((m) => {
              const isLive = m.status === 'LIVE' || m.participantCount > 1;
              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {isLive ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>LIVE SESSION</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                          SCHEDULED
                        </span>
                      )}

                      <button
                        onClick={() => copyCode(m.id)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                        title="Copy meeting code"
                      >
                        <span>{m.id}</span>
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {m.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="tabular-nums">{m.participantCount} peers</span>
                    </div>

                    <button
                      onClick={() => enterLobby(m)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-sm"
                    >
                      <span>Join Call</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cloud Recordings Section */}
        {recordingsList.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-bold text-white tracking-tight">
              {t.recordings.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordingsList.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-200">{rec.meetingTitle}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {new Date(rec.createdAt).toLocaleDateString()} · {(rec.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-200" />
                    </a>
                    <a
                      href={rec.url}
                      download={`AuraMeet_${rec.meetingId}.webm`}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {isScheduleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {t.dashboard.scheduleMeeting}
                </h3>
                <button
                  onClick={() => setIsScheduleOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meeting Topic / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q3 Technical Architecture Review"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Agenda / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief description of the call agenda..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded-xl hover:bg-slate-950/50">
                    <span>Require Waiting Room Approval</span>
                    <input
                      type="checkbox"
                      checked={waitingRoomEnabled}
                      onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded-xl hover:bg-slate-950/50">
                    <span>Mute Participants Upon Entry</span>
                    <input
                      type="checkbox"
                      checked={muteOnEntry}
                      onChange={(e) => setMuteOnEntry(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25"
                  >
                    Save & Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
