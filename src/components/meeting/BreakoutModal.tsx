import React, { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useI18n } from '../../context/I18nContext';
import { Layers, X, Megaphone, Users, Plus, ArrowRight, Play, Square } from 'lucide-react';

interface BreakoutModalProps {
  onClose: () => void;
}

export const BreakoutModal: React.FC<BreakoutModalProps> = ({ onClose }) => {
  const { t } = useI18n();
  const {
    breakoutRooms,
    createBreakoutRooms,
    broadcastBreakoutMessage,
    endBreakoutRooms,
    participants,
  } = useMeeting();

  const [roomCount, setRoomCount] = useState<number>(2);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleCreate = () => {
    createBreakoutRooms(roomCount);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    broadcastBreakoutMessage(broadcastText);
    setBroadcastText('');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 2500);
  };

  const isBreakoutActive = breakoutRooms.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.breakout.title}
              </h2>
              <p className="text-xs text-slate-400">
                Split attendees into focused small-group video rooms
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
        <div className="p-6 space-y-6">
          {!isBreakoutActive ? (
            /* Creation Form */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {t.breakout.roomCount}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRoomCount(num)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        roomCount === num
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {num} Rooms
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2 text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Total Participants:</span>
                  <span className="font-semibold text-white">{participants.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Assignment:</span>
                  <span className="text-indigo-400">Auto-distributed evenly</span>
                </div>
              </div>

              <button
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Breakout Sessions</span>
              </button>
            </div>
          ) : (
            /* Active Breakout Rooms Management */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Breakout Rooms are Live
                </span>
                <button
                  onClick={endBreakoutRooms}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>{t.breakout.endBreakout}</span>
                </button>
              </div>

              {/* Room Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto">
                {breakoutRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>{room.name}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {room.participantIds.length} members
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {room.participantIds.length > 0
                        ? room.participantIds
                            .map((id) => participants.find((p) => p.id === id)?.name || id)
                            .join(', ')
                        : 'No participants'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Broadcast Form */}
              <form onSubmit={handleBroadcast} className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300">
                  {t.breakout.broadcastMessage}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="e.g. 2 minutes remaining before regrouping..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!broadcastText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>{broadcastSent ? 'Sent!' : t.breakout.sendBroadcast}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
