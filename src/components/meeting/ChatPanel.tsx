import React, { useState, useEffect, useRef } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { X, Send, Smile, Lock, Bell } from 'lucide-react';

interface ChatPanelProps {
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onClose }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { chatMessages, sendChatMessage, addChatReaction, participants, markChatRead } = useMeeting();

  const [inputText, setInputText] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(''); // empty string = Everyone
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markChatRead();
  }, [chatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText, selectedRecipientId || undefined);
    setInputText('');
  };

  const emojis = ['👍', '❤️', '👏', '🎉', '🚀', '💡'];

  return (
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white tracking-tight">
          {t.chat.title}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Recipient Dropdown (Public or Direct Message) */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">To:</span>
        <select
          value={selectedRecipientId}
          onChange={(e) => setSelectedRecipientId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-indigo-300 focus:outline-none cursor-pointer"
        >
          <option value="">{t.chat.sendToAll}</option>
          {participants
            .filter((p) => p.id !== user.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Direct Message)
              </option>
            ))}
        </select>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 space-y-2">
            <Lock className="w-5 h-5 text-slate-600" />
            <p>Messages are encrypted and visible only to people in the call.</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === user.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 ${
                  msg.isAnnouncement ? 'bg-indigo-950/40 border border-indigo-800/60 p-2.5 rounded-xl' : ''
                }`}
              >
                {/* Sender info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className={`font-semibold ${isMe ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {msg.senderName} {isMe && '(You)'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={`text-xs px-3 py-2 rounded-xl text-slate-100 break-words ${
                    msg.recipientId
                      ? 'bg-amber-950/40 border border-amber-800/50'
                      : isMe
                      ? 'bg-indigo-600/90'
                      : 'bg-slate-800'
                  }`}
                >
                  {msg.recipientId && (
                    <div className="text-[10px] text-amber-300 font-semibold mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Direct Message</span>
                    </div>
                  )}
                  {msg.text}
                </div>

                {/* Message Reactions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {Object.entries(msg.reactions || {}).map(([emoji, userIds]) => {
                    if (userIds.length === 0) return null;
                    const hasReacted = userIds.includes(user.id);
                    return (
                      <button
                        key={emoji}
                        onClick={() => addChatReaction(msg.id, emoji)}
                        className={`text-[11px] px-1.5 py-0.5 rounded-md flex items-center gap-1 border transition-colors ${
                          hasReacted
                            ? 'bg-indigo-950 border-indigo-700 text-indigo-200'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="font-mono">{userIds.length}</span>
                      </button>
                    );
                  })}

                  {/* Reaction Adder */}
                  <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                    {emojis.slice(0, 3).map((e) => (
                      <button
                        key={e}
                        onClick={() => addChatReaction(msg.id, e)}
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={selectedRecipientId ? 'Send direct message...' : t.chat.typePlaceholder}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-40 disabled:bg-slate-800 transition-all hover:bg-indigo-500"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
