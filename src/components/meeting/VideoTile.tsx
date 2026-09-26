import React, { useEffect, useRef } from 'react';
import { Participant } from '../../types';
import { Mic, MicOff, Hand, Pin, ShieldCheck, Wifi, Maximize2 } from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';

interface VideoTileProps {
  participant: Participant;
  isLocal?: boolean;
  stream?: MediaStream | null;
  isPinned?: boolean;
  onTogglePin?: () => void;
  className?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  isLocal = false,
  stream,
  isPinned = false,
  onTogglePin,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isBlurEnabled, activeSpeakerId } = useMeeting();

  // Attach stream to video tag
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isSpeaking = participant.isSpeaking || activeSpeakerId === participant.id;

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-200 group flex items-center justify-center select-none ${
        isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/70 shadow-[0_0_24px_rgba(16,185,129,0.2)]'
          : isPinned
          ? 'border-indigo-500 ring-1 ring-indigo-500/50'
          : 'border-slate-800/80 hover:border-slate-700'
      } ${className}`}
    >
      {/* Video Stream Element */}
      {!participant.isVideoOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${
            isLocal ? 'transform -scale-x-100' : ''
          } ${isLocal && isBlurEnabled ? 'blur-[4px] contrast-105' : ''}`}
        />
      ) : (
        /* Video Off Avatar Placeholder */
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative">
            {participant.avatarUrl ? (
              <img
                src={participant.avatarUrl}
                alt={participant.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-slate-700/80 object-cover shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-700 to-violet-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-slate-700/80 shadow-xl">
                {participant.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            {/* Speaking animated halo */}
            {isSpeaking && (
              <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-60" />
            )}
          </div>
          <span className="text-sm font-semibold text-slate-200">
            {participant.name} {isLocal && '(You)'}
          </span>
        </div>
      )}

      {/* Hand Raised Banner */}
      {participant.isHandRaised && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-500/90 text-slate-950 font-semibold text-xs px-2.5 py-1 rounded-lg backdrop-blur-md shadow-md animate-bounce">
          <Hand className="w-3.5 h-3.5" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Network Quality Indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/70 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-slate-300">
        <Wifi className="w-3 h-3 text-emerald-400" />
        <span className="font-mono">38ms</span>
      </div>

      {/* Action Overlay (Pin, Fullscreen) on Hover */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800">
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${
              isPinned ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
            }`}
            title={isPinned ? 'Unpin' : 'Pin for everyone'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom Name & Audio State Tag */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/80 text-xs text-slate-200">
          {/* Speaking Audio VU or Mic State */}
          {participant.isMuted ? (
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
          ) : isSpeaking ? (
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 bg-emerald-400 h-2 animate-pulse" />
              <span className="w-0.5 bg-emerald-400 h-3 animate-pulse delay-75" />
              <span className="w-0.5 bg-emerald-400 h-1.5 animate-pulse delay-150" />
            </div>
          ) : (
            <Mic className="w-3.5 h-3.5 text-slate-400" />
          )}

          <span className="font-medium truncate max-w-[130px] sm:max-w-[180px]">
            {participant.name} {isLocal && '(You)'}
          </span>

          {participant.isHost && (
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-950/80 px-1 rounded">
              Host
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
