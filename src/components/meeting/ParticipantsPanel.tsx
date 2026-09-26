import React, { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import {
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Shield,
  UserX,
  VolumeX,
  Check,
  MoreVertical,
} from 'lucide-react';

interface ParticipantsPanelProps {
  onClose: () => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ onClose }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const {
    participants,
    waitingParticipants,
    admitParticipant,
    denyParticipant,
    admitAllWaiting,
    muteParticipant,
    muteAllParticipants,
    removeParticipant,
  } = useMeeting();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserMenu, setSelectedUserMenu] = useState<string | null>(null);

  const isHost = user.role === 'HOST' || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

  const filteredParticipants = participants
    .filter((p) => !p.inWaitingRoom)
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 md:relative md:w-80 lg:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-40 select-none shadow-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            {t.people.title}
          </h3>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            {filteredParticipants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Host Quick Actions Bar */}
      {isHost && (
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Host Controls:</span>
          <button
            onClick={muteAllParticipants}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.people.muteAll}</span>
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.people.searchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Waiting Room Section (if any) */}
      {waitingParticipants.length > 0 && isHost && (
        <div className="p-3 bg-amber-950/20 border-b border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300">
              {t.people.waitingRoom} ({waitingParticipants.length})
            </span>
            <button
              onClick={admitAllWaiting}
              className="text-amber-400 hover:text-amber-300 font-medium underline text-[11px]"
            >
              {t.people.admitAll}
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {waitingParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-slate-900/90 border border-amber-800/40 p-2 rounded-xl text-xs"
              >
                <span className="font-medium text-slate-200 truncate max-w-[140px]">
                  {p.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => admitParticipant(p.id)}
                    className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white"
                    title={t.people.admit}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => denyParticipant(p.id)}
                    className="p-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white"
                    title={t.people.deny}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-Call Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredParticipants.map((p) => {
          const isMe = p.id === user.id;
          return (
            <div
              key={p.id}
              className="relative flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
            >
              {/* Left: Avatar + Name + Badges */}
              <div className="flex items-center gap-2.5 min-w-0">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {p.name} {isMe && '(You)'}
                    </span>
                    {p.isHost && (
                      <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/80 px-1 rounded">
                        Host
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {p.networkQuality === 'excellent' ? 'HD Connection' : 'Low Bitrate'}
                  </div>
                </div>
              </div>

              {/* Right: Media States & Host Menu */}
              <div className="flex items-center gap-2">
                {p.isHandRaised && (
                  <Hand className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                )}

                {p.isMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                )}

                {p.isVideoOff ? (
                  <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                )}

                {isHost && !isMe && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setSelectedUserMenu(selectedUserMenu === p.id ? null : p.id)
                      }
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {selectedUserMenu === p.id && (
                      <div className="absolute right-0 top-7 w-44 bg-slate-950 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-50 text-xs space-y-1">
                        <button
                          onClick={() => {
                            muteParticipant(p.id);
                            setSelectedUserMenu(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          <span>Mute participant</span>
                        </button>
                        <button
                          onClick={() => {
                            removeParticipant(p.id);
                            setSelectedUserMenu(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 flex items-center gap-2"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Remove from meeting</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
