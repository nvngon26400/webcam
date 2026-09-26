import React, { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Hand,
  MessageSquare,
  Users,
  Grid3X3,
  Maximize2,
  Minimize2,
  Sparkles,
  Settings,
  Radio,
  PhoneOff,
  Layers,
  ChevronUp,
} from 'lucide-react';

interface MeetingControlsProps {
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onOpenBreakout: () => void;
  onOpenAISummary: () => void;
  onOpenSettings: () => void;
  onOpenRecording: () => void;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
}

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  onToggleChat,
  onToggleParticipants,
  onOpenBreakout,
  onOpenAISummary,
  onOpenSettings,
  onOpenRecording,
  isChatOpen,
  isParticipantsOpen,
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const {
    isMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    isRecording,
    recordingDuration,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    toggleBlur,
    isBlurEnabled,
    layoutMode,
    setLayoutMode,
    leaveMeeting,
    endMeetingForAll,
    unreadChatCount,
    participants,
    waitingParticipants,
    startRecording,
    stopRecording,
  } = useMeeting();

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isHost = user.role === 'HOST' || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

  // Format recording timer: mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full bg-slate-950/95 border-t border-slate-800/80 px-4 py-3 sm:py-3.5 backdrop-blur-xl flex items-center justify-between z-30 select-none">
      {/* Left zone: Meeting duration & Recording Indicator */}
      <div className="hidden md:flex items-center gap-3">
        {isRecording && (
          <div
            onClick={onOpenRecording}
            className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full text-rose-400 text-xs font-mono cursor-pointer hover:bg-rose-500/20 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold">REC {formatTimer(recordingDuration)}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span>AuraMedia SFU</span>
          <span>·</span>
          <span className="text-emerald-400 font-medium">1080p 60fps</span>
        </div>
      </div>

      {/* Center zone: Core Media Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 mx-auto md:mx-0">
        {/* Audio Mic Button */}
        <button
          onClick={toggleAudio}
          className={`flex items-center justify-center p-3 rounded-2xl transition-all ${
            isMuted
              ? 'bg-rose-500/90 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-100'
          }`}
          title={isMuted ? t.meeting.unmute : t.meeting.mute}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Camera Button */}
        <button
          onClick={toggleVideo}
          className={`flex items-center justify-center p-3 rounded-2xl transition-all ${
            isVideoOff
              ? 'bg-rose-500/90 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-100'
          }`}
          title={isVideoOff ? t.meeting.startVideo : t.meeting.stopVideo}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={toggleScreenShare}
          className={`flex items-center justify-center p-3 rounded-2xl transition-all ${
            isScreenSharing
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200'
          }`}
          title={isScreenSharing ? t.meeting.stopSharing : t.meeting.shareScreen}
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* Hand Raise Button */}
        <button
          onClick={toggleHandRaise}
          className={`hidden sm:flex items-center justify-center p-3 rounded-2xl transition-all ${
            isHandRaised
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200'
          }`}
          title={isHandRaised ? t.meeting.handLower : t.meeting.handRaise}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* AI Meeting Minutes (Gemini) */}
        <button
          onClick={onOpenAISummary}
          className="flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-gradient-to-r from-violet-600/80 to-indigo-600/80 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all font-medium text-xs whitespace-nowrap"
          title={t.meeting.aiSummary}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="hidden lg:inline">{t.meeting.aiSummary}</span>
        </button>

        {/* In-Meeting Recording Toggle */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`hidden sm:flex items-center justify-center p-3 rounded-2xl transition-all ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200'
          }`}
          title={isRecording ? 'Stop Recording' : t.meeting.record}
        >
          <Radio className="w-5 h-5" />
        </button>

        {/* Leave / End Call */}
        <div className="relative">
          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center justify-center px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-semibold text-xs shadow-lg shadow-rose-600/25 transition-all gap-1.5"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">{t.meeting.leaveMeeting}</span>
          </button>

          {/* End Call Options Popover */}
          {showEndConfirm && (
            <div className="absolute bottom-16 right-0 w-60 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 space-y-2">
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  leaveMeeting();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
              >
                {t.meeting.leaveMeeting}
              </button>
              {isHost && (
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    endMeetingForAll();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/60 transition-colors"
                >
                  {t.meeting.endMeetingForAll}
                </button>
              )}
              <button
                onClick={() => setShowEndConfirm(false)}
                className="w-full text-center px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right zone: Layout, Chat, Participants & Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Layout Switcher */}
        <button
          onClick={() => setLayoutMode(layoutMode === 'grid' ? 'speaker' : 'grid')}
          className={`p-2.5 rounded-xl transition-colors ${
            layoutMode === 'speaker'
              ? 'bg-slate-700 text-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={layoutMode === 'grid' ? t.meeting.layoutSpeaker : t.meeting.layoutGrid}
        >
          <Grid3X3 className="w-5 h-5" />
        </button>

        {/* Breakout Rooms (Host/Co-host) */}
        {isHost && (
          <button
            onClick={onOpenBreakout}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={t.meeting.breakout}
          >
            <Layers className="w-5 h-5" />
          </button>
        )}

        {/* Participants Panel Toggle */}
        <button
          onClick={onToggleParticipants}
          className={`relative p-2.5 rounded-xl transition-colors ${
            isParticipantsOpen
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={t.meeting.participants}
        >
          <Users className="w-5 h-5" />
          {waitingParticipants.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {waitingParticipants.length}
            </span>
          )}
        </button>

        {/* Chat Panel Toggle */}
        <button
          onClick={onToggleChat}
          className={`relative p-2.5 rounded-xl transition-colors ${
            isChatOpen
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={t.meeting.chat}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={t.meeting.fullScreen}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Settings Modal */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={t.meeting.settings}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
