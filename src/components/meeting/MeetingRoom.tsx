import React, { useState, useEffect } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { VideoTile } from './VideoTile';
import { MeetingControls } from './MeetingControls';
import { ChatPanel } from './ChatPanel';
import { ParticipantsPanel } from './ParticipantsPanel';
import { BreakoutModal } from './BreakoutModal';
import { AISummaryModal } from './AISummaryModal';
import { RecordingModal } from './RecordingModal';
import { MeetingSettingsModal } from './MeetingSettingsModal';
import {
  ShieldCheck,
  Copy,
  Check,
  Lock,
  Clock,
  Sparkles,
  ScreenShare,
  Layers,
  Hourglass,
  PhoneOff,
} from 'lucide-react';
import { Participant } from '../../types';

export const MeetingRoom: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const {
    activeMeeting,
    inWaitingRoom,
    isMeetingLocked,
    participants,
    localStream,
    screenStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    layoutMode,
    pinnedParticipantId,
    setPinnedParticipantId,
    activeSpeakerId,
    leaveMeeting,
    toggleAudio,
    toggleVideo,
  } = useMeeting();

  // Panels and Modals state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isBreakoutOpen, setIsBreakoutOpen] = useState(false);
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Meeting duration timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'm' || e.key === 'M') {
        toggleAudio();
      } else if (e.key === 'v' || e.key === 'V') {
        toggleVideo();
      } else if (e.key === 'c' || e.key === 'C') {
        setIsChatOpen((prev) => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        setIsParticipantsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAudio, toggleVideo]);

  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyMeetingInvite = () => {
    const url = `${window.location.origin}?room=${activeMeeting?.id || 'session'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Local user represented as Participant
  const localParticipant: Participant = {
    id: user.id,
    odUserId: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isHost: activeMeeting?.hostId === user.id || user.role === 'HOST' || user.role === 'SUPER_ADMIN',
    isCoHost: user.role === 'CO_HOST',
    isMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    isSpeaking: false,
    audioLevel: 0,
    networkQuality: 'excellent',
    joinedAt: new Date().toISOString(),
    inWaitingRoom: false,
    stream: localStream || undefined,
  };

  // Combined active participants (filter out waiting room)
  const activeParticipants = [
    localParticipant,
    ...participants.filter((p) => p.id !== user.id && !p.inWaitingRoom),
  ];

  // If currently held in Waiting Room
  if (inWaitingRoom) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Hourglass className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              {t.meeting.waitingRoomMsg}
            </h2>
            <p className="text-xs text-slate-400">
              Meeting: <span className="text-slate-200 font-semibold">{activeMeeting?.title}</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div>Host: {activeMeeting?.hostName || 'Sarah Chen'}</div>
            <div className="text-indigo-400">Waiting for host approval...</div>
          </div>
          <button
            onClick={leaveMeeting}
            className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Leave Waiting Room</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine stage layout (grid vs pinned vs screen share)
  const pinnedParticipant = pinnedParticipantId
    ? activeParticipants.find((p) => p.id === pinnedParticipantId)
    : null;

  const activeScreenShare = isScreenSharing
    ? { isLocal: true, stream: screenStream }
    : null;

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
      {/* Top Meeting Information Bar */}
      <div className="h-14 bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-20 backdrop-blur-md">
        {/* Left: Meeting Title & Code */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
              {activeMeeting?.title || 'AuraMeet Video Session'}
            </h1>
            {isMeetingLocked && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span>{activeMeeting?.id || 'aur-session'}</span>
            <button
              onClick={copyMeetingInvite}
              className="text-slate-400 hover:text-white transition-colors"
              title="Copy meeting invite link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Center: Live Call Timer */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{formatDuration(elapsedSeconds)}</span>
        </div>

        {/* Right: Security Badge & Quick Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[11px]">E2EE Encrypted</span>
          </div>

          <button
            onClick={copyMeetingInvite}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? t.meeting.linkCopied : t.meeting.copyInviteLink}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Canvas Stage */}
        <div className="flex-1 p-3 sm:p-4 flex items-center justify-center overflow-hidden">
          {/* Case 1: Active Screen Share */}
          {activeScreenShare ? (
            <div className="w-full h-full flex flex-col lg:flex-row gap-3">
              {/* Large Screen Share Surface */}
              <div className="flex-1 h-full rounded-2xl overflow-hidden bg-slate-900 border border-indigo-500/50 shadow-2xl relative flex items-center justify-center">
                {activeScreenShare.stream && (
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el && activeScreenShare.stream) el.srcObject = activeScreenShare.stream;
                    }}
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="absolute top-3 left-3 bg-indigo-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-indigo-800 text-xs font-medium text-indigo-200 flex items-center gap-2">
                  <ScreenShare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>You are presenting your screen</span>
                </div>
              </div>

              {/* Sidebar Participant Filmstrip */}
              <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-28 sm:max-h-40 lg:max-h-full shrink-0">
                {activeParticipants.map((p) => (
                  <div key={p.id} className="w-36 sm:w-48 lg:w-full aspect-video shrink-0">
                    <VideoTile
                      participant={p}
                      isLocal={p.id === user.id}
                      stream={p.id === user.id ? localStream : p.stream}
                      isPinned={pinnedParticipantId === p.id}
                      onTogglePin={() =>
                        setPinnedParticipantId(pinnedParticipantId === p.id ? null : p.id)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : pinnedParticipant ? (
            /* Case 2: Pinned Participant Spotlight */
            <div className="w-full h-full flex flex-col lg:flex-row gap-3">
              <div className="flex-1 h-full min-h-[220px]">
                <VideoTile
                  participant={pinnedParticipant}
                  isLocal={pinnedParticipant.id === user.id}
                  stream={pinnedParticipant.id === user.id ? localStream : pinnedParticipant.stream}
                  isPinned={true}
                  onTogglePin={() => setPinnedParticipantId(null)}
                />
              </div>
              <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-28 sm:max-h-40 lg:max-h-full shrink-0">
                {activeParticipants
                  .filter((p) => p.id !== pinnedParticipant.id)
                  .map((p) => (
                    <div key={p.id} className="w-36 sm:w-48 lg:w-full aspect-video shrink-0">
                      <VideoTile
                        participant={p}
                        isLocal={p.id === user.id}
                        stream={p.id === user.id ? localStream : p.stream}
                        onTogglePin={() => setPinnedParticipantId(p.id)}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Case 3: Adaptive Responsive Participant Grid */
            <div
              className={`w-full h-full grid gap-2 sm:gap-4 place-content-center ${
                activeParticipants.length === 1
                  ? 'grid-cols-1 max-w-4xl max-h-[82vh]'
                  : activeParticipants.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-6xl max-h-[82vh]'
                  : activeParticipants.length <= 4
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl max-h-[85vh]'
                  : activeParticipants.length <= 6
                  ? 'grid-cols-2 md:grid-cols-3 max-w-7xl max-h-[85vh]'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl max-h-[85vh]'
              }`}
            >
              {activeParticipants.map((p) => (
                <div key={p.id} className="w-full h-full aspect-video min-h-[120px] sm:min-h-[160px]">
                  <VideoTile
                    participant={p}
                    isLocal={p.id === user.id}
                    stream={p.id === user.id ? localStream : p.stream}
                    isPinned={pinnedParticipantId === p.id}
                    onTogglePin={() =>
                      setPinnedParticipantId(pinnedParticipantId === p.id ? null : p.id)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Panels */}
        {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
        {isParticipantsOpen && <ParticipantsPanel onClose={() => setIsParticipantsOpen(false)} />}
      </div>

      {/* Bottom Meeting Controls Bar */}
      <MeetingControls
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (isParticipantsOpen) setIsParticipantsOpen(false);
        }}
        onToggleParticipants={() => {
          setIsParticipantsOpen(!isParticipantsOpen);
          if (isChatOpen) setIsChatOpen(false);
        }}
        onOpenBreakout={() => setIsBreakoutOpen(true)}
        onOpenAISummary={() => setIsAISummaryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRecording={() => setIsRecordingOpen(true)}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
      />

      {/* Interactive Modals */}
      {isBreakoutOpen && <BreakoutModal onClose={() => setIsBreakoutOpen(false)} />}
      {isAISummaryOpen && <AISummaryModal onClose={() => setIsAISummaryOpen(false)} />}
      {isRecordingOpen && <RecordingModal onClose={() => setIsRecordingOpen(false)} />}
      {isSettingsOpen && <MeetingSettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};
