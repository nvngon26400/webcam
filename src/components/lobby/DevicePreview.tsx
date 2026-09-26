import React, { useState, useEffect, useRef } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Sparkles,
  Settings,
  Shield,
  ArrowRight,
  X,
  Radio,
} from 'lucide-react';

export const DevicePreview: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const {
    activeMeeting,
    localStream,
    isMuted,
    isVideoOff,
    isBlurEnabled,
    localAudioLevel,
    devices,
    selectedCameraId,
    selectedMicId,
    selectedSpeakerId,
    setSelectedCameraId,
    setSelectedMicId,
    setSelectedSpeakerId,
    toggleAudio,
    toggleVideo,
    toggleBlur,
    joinActiveMeeting,
    leaveMeeting,
  } = useMeeting();

  const [displayName, setDisplayName] = useState(user.name);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Test speaker chime
  const playSpeakerTest = () => {
    try {
      setIsPlayingTestTone(true);
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);

      setTimeout(() => {
        setIsPlayingTestTone(false);
        ctx.close();
      }, 700);
    } catch (e) {
      console.warn('Audio test error:', e);
      setIsPlayingTestTone(false);
    }
  };

  const handleJoin = () => {
    joinActiveMeeting(displayName);
  };

  const isHost = activeMeeting?.hostId === user.id || user.role === 'HOST' || user.role === 'SUPER_ADMIN';
  const requireWaiting = activeMeeting?.settings?.waitingRoomEnabled && !isHost;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Top bar info */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                AuraMeet Lobby
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">
                {activeMeeting?.id || 'aur-session'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {activeMeeting?.title || 'Video Conference'}
            </h1>
          </div>
          <button
            onClick={leaveMeeting}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Video Preview Box */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
              {/* Actual Video Track */}
              {!isVideoOff && localStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 transition-all ${
                    isBlurEnabled ? 'blur-[4px] contrast-105' : ''
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-3 border border-slate-700">
                    <VideoOff className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">
                    {t.lobby.cameraOff}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Your camera is currently disabled
                  </span>
                </div>
              )}

              {/* Bottom In-Tile Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/60 shadow-lg">
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full transition-all ${
                    isMuted
                      ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={isMuted ? t.meeting.unmute : t.meeting.mute}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-all ${
                    isVideoOff
                      ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={isVideoOff ? t.meeting.startVideo : t.meeting.stopVideo}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleBlur}
                  className={`p-3 rounded-full transition-all ${
                    isBlurEnabled
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={t.lobby.blurBackground}
                >
                  <Sparkles className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-3 rounded-full transition-all ${
                    showSettings ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={t.lobby.deviceSettings}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic VU Meter Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                <Radio className={`w-3.5 h-3.5 ${!isMuted && localAudioLevel > 0.05 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <div className="flex items-center gap-0.5 h-3">
                  {[0.1, 0.25, 0.4, 0.6, 0.8].map((threshold, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        !isMuted && localAudioLevel >= threshold
                          ? idx > 3 ? 'bg-rose-500 h-3.5' : 'bg-emerald-400 h-3'
                          : 'bg-slate-700 h-1'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-slate-300">
                  {isMuted ? 'Muted' : `${Math.round(localAudioLevel * 100)}%`}
                </span>
              </div>
            </div>

            {/* Quick Test Speaker button */}
            <div className="w-full flex items-center justify-between mt-3 px-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>WebRTC SFU Encrypted Session</span>
              </span>
              <button
                onClick={playSpeakerTest}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingTestTone ? 'text-indigo-400 animate-bounce' : ''}`} />
                <span>{isPlayingTestTone ? 'Playing chime...' : t.lobby.testSpeaker}</span>
              </button>
            </div>
          </div>

          {/* Join Form / Right Box */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                {t.lobby.readyToJoin}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure your display name and review device permissions before entering.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.lobby.enterName}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Status info */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Host:</span>
                  <span className="font-medium text-white">{activeMeeting?.hostName || 'Sarah Chen'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Waiting Room:</span>
                  <span className={requireWaiting ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                    {requireWaiting ? 'Enabled (Host approval)' : 'Direct Entry'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Media Pipeline:</span>
                  <span className="text-indigo-400 font-mono">LiveKit SFU Cluster</span>
                </div>
              </div>

              {/* Primary Join Button */}
              <button
                onClick={handleJoin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01]"
              >
                <span>{requireWaiting ? t.lobby.askToJoin : t.lobby.joinNow}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* In-Lobby Device Settings Modal/Drawer */}
            {showSettings && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-300">
                  {t.lobby.deviceSettings}
                </div>

                {/* Camera selector */}
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">
                    {t.lobby.cameraSelect}
                  </label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {devices.videoInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                    {devices.videoInputs.length === 0 && (
                      <option value="">Aura Virtual HD Camera (Default)</option>
                    )}
                  </select>
                </div>

                {/* Mic selector */}
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">
                    {t.lobby.micSelect}
                  </label>
                  <select
                    value={selectedMicId}
                    onChange={(e) => setSelectedMicId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {devices.audioInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                    {devices.audioInputs.length === 0 && (
                      <option value="">Internal System Microphone</option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
