import React, { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { Settings, X, Mic, Video, Shield, Gauge, Lock, Users } from 'lucide-react';
import { QualityLayer } from '../../types';

interface MeetingSettingsModalProps {
  onClose: () => void;
}

export const MeetingSettingsModal: React.FC<MeetingSettingsModalProps> = ({ onClose }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const {
    devices,
    selectedCameraId,
    selectedMicId,
    selectedSpeakerId,
    setSelectedCameraId,
    setSelectedMicId,
    setSelectedSpeakerId,
    isMeetingLocked,
    toggleMeetingLock,
    isBlurEnabled,
    toggleBlur,
  } = useMeeting();

  const [activeTab, setActiveTab] = useState<'devices' | 'bandwidth' | 'security'>('devices');
  const [preferredQuality, setPreferredQuality] = useState<QualityLayer>('auto');

  const isHost = user.role === 'HOST' || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.meeting.settings}
              </h2>
              <p className="text-xs text-slate-400">
                Media device routing, quality profile & meeting security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/30 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('devices')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'devices'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Audio & Video</span>
          </button>

          <button
            onClick={() => setActiveTab('bandwidth')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'bandwidth'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Quality & Bandwidth</span>
          </button>

          {isHost && (
            <button
              onClick={() => setActiveTab('security')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Host Security</span>
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5">
          {activeTab === 'devices' && (
            <div className="space-y-4">
              {/* Camera Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Camera
                </label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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

              {/* Mic Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Microphone
                </label>
                <select
                  value={selectedMicId}
                  onChange={(e) => setSelectedMicId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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

              {/* Virtual Background */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Virtual Background Blur</div>
                  <div className="text-[11px] text-slate-400">Soft Gaussian blur applied to background</div>
                </div>
                <button
                  onClick={toggleBlur}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    isBlurEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isBlurEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'bandwidth' && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300">
                Simulcast Receive Quality Profile
              </label>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'auto', label: 'Adaptive Auto', desc: 'Dynamically switches based on network jitter and viewport size' },
                  { id: '1080p', label: 'High Definition (1080p 60fps)', desc: 'Full fidelity video for high-bandwidth connections' },
                  { id: '720p', label: 'Standard Definition (720p 30fps)', desc: 'Balanced bandwidth consumption (~1.2 Mbps)' },
                  { id: '360p', label: 'Low Bandwidth (360p 15fps)', desc: 'Recommended on mobile or constrained cellular connections' },
                  { id: 'audio_only', label: 'Audio Only', desc: 'Disables incoming video to preserve minimal connectivity' },
                ].map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setPreferredQuality(tier.id as QualityLayer)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      preferredQuality === tier.id
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{tier.label}</div>
                      <div className="text-[11px] text-slate-400">{tier.desc}</div>
                    </div>
                    {preferredQuality === tier.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Meeting Lock */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Lock Meeting</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    When locked, no new participants can join the call
                  </div>
                </div>
                <button
                  onClick={toggleMeetingLock}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    isMeetingLocked ? 'bg-rose-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isMeetingLocked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Waiting room notice */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-xs space-y-1 text-slate-300">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enterprise Security Invariants</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  End-to-End Encryption active with DTLS 1.3 and SRTP AES-GCM 256-bit keys negotiated per peer session.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
