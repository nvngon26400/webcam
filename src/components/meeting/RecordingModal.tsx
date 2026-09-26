import React from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useI18n } from '../../context/I18nContext';
import { Radio, X, Download, Play, CheckCircle, Clock, HardDrive } from 'lucide-react';

interface RecordingModalProps {
  onClose: () => void;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({ onClose }) => {
  const { t } = useI18n();
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    recordingsList,
    activeMeeting,
  } = useMeeting();

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isRecording ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
              <Radio className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.recordings.title}
              </h2>
              <p className="text-xs text-slate-400">
                High-definition WebM/MP4 composite media capture
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

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Active Recording Controller */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
                  }`}
                />
                <span className="text-sm font-semibold text-white">
                  {isRecording ? 'Recording in progress...' : 'Ready to record session'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Duration: {formatTimer(recordingDuration)} · 1080p 30fps
              </div>
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
              }`}
            >
              {isRecording ? 'Stop & Save Recording' : 'Start Recording'}
            </button>
          </div>

          {/* Recordings List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Session Recordings ({recordingsList.length})
            </h3>

            {recordingsList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6">
                {t.recordings.noRecordings}
              </div>
            ) : (
              <div className="space-y-2.5">
                {recordingsList.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200">{rec.meetingTitle}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatTimer(rec.durationSeconds)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-500" />
                          {formatFileSize(rec.fileSizeBytes)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        title={t.recordings.play}
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-200" />
                      </a>
                      <a
                        href={rec.url}
                        download={`AuraMeet_${rec.meetingId}_${Date.now()}.webm`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
