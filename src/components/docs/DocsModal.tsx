import React, { useState } from 'react';
import { BookOpen, X, Server, Database, Radio, Shield, Cpu, Activity, Terminal } from 'lucide-react';

interface DocsModalProps {
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'webrtc' | 'database' | 'scaling' | 'security'>('architecture');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                AuraMeet Architecture & Engineering Specifications
              </h2>
              <p className="text-xs text-slate-400">
                Principal Software Architecture, Distributed WebRTC, and Systems Design
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

        {/* Tab Strip */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/30 gap-6 text-xs font-medium overflow-x-auto">
          {[
            { id: 'architecture', label: '1. Architecture & Control Plane', icon: Server },
            { id: 'webrtc', label: '2. SFU & WebRTC Pipeline', icon: Radio },
            { id: 'database', label: '3. Database & RLS Schema', icon: Database },
            { id: 'scaling', label: '4. Horizontal Scaling', icon: Cpu },
            { id: 'security', label: '5. Security & Tokens', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Documentation Content Area */}
        <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm text-slate-300 space-y-6 font-sans leading-relaxed">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">System Architecture & Control vs Media Plane Separation</h3>
              <p>
                AuraMeet strictly bifurcates <strong>Control Plane</strong> and <strong>Media Plane</strong> operations to prevent real-time video transport from choking application database queues.
              </p>
              <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800 overflow-x-auto">
                <pre>{`                    CLIENT BROWSERS (Desktop & Mobile)
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
        CONTROL PLANE (REST + WSS)    MEDIA PLANE (WebRTC)
                   │                           │
          ┌────────┴────────┐                  ▼
          ▼                 ▼             SFU CLUSTER
     API Gateway     WebSocket Signaling  (LiveKit / Mediasoup)
          │                 │                  │
          ▼                 ▼                  ▼
     PostgreSQL        Redis Pub/Sub      TURN Clustered Nodes
   (Supabase / RLS)  (Ephemeral State)   (Coturn Geo-DNS Relay)
          │
          ▼
    Python AI Worker (Gemini 2.5 Summarizer)`}</pre>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
                <li><strong>API Servers</strong> manage authentication, RBAC, meeting scheduling, user profiles, and audit logging. They never proxy raw RTP video/audio streams.</li>
                <li><strong>WebSocket Signaling</strong> distributes peer metadata, chat messages, breakout coordinates, and mute states via low-latency binary frames.</li>
                <li><strong>SFU Cluster</strong> receives 1 local uplink from each participant and forwards downlinks to other peers according to viewport bounds.</li>
              </ul>
            </div>
          )}

          {activeTab === 'webrtc' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">WebRTC & Selective Forwarding Unit (SFU) Technology Choice</h3>
              <p>
                We selected <strong>LiveKit / Mediasoup</strong> as our core SFU implementation over Janus and Jitsi because:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
                <li><strong>Sub-second Active Speaker Routing:</strong> LiveKit processes audio energy directly in the SFU RTP forwarder without client round-trips.</li>
                <li><strong>Simulcast Layers:</strong> Supports spatial and temporal layers (1080p, 720p, 360p) with seamless switching when client network conditions degrade.</li>
                <li><strong>ICE Restart with Jitter Compensation:</strong> Automatically triggers ICE restart when users switch between WiFi and mobile LTE connections.</li>
              </ul>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-white">Simulcast Layer Configuration:</div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2 bg-slate-900 rounded-lg">High: 1080p @ 30fps (2500 kbps)</div>
                  <div className="p-2 bg-slate-900 rounded-lg">Medium: 720p @ 30fps (1000 kbps)</div>
                  <div className="p-2 bg-slate-900 rounded-lg">Low: 360p @ 15fps (250 kbps)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">PostgreSQL & Supabase Row Level Security (RLS) Schema</h3>
              <p>
                The database schema is fully normalized and enforces tenant isolation at the database engine layer. Client apps cannot read unauthorized meetings even with forged IDs.
              </p>
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto">
                <pre>{`-- Row Level Security (RLS) Policy Example
CREATE POLICY "Users can only view meetings in their organization or invited"
ON public.meetings
FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = meetings.id AND user_id = auth.uid()
  )
);`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'scaling' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Horizontal Scaling Strategy</h3>
              <p>
                To handle 10,000+ concurrent meetings across global timezones:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
                <li><strong>Redis Pub/Sub mesh:</strong> Dispatches signaling events between horizontally scaled WebSocket pods with zero sticky-session reliance.</li>
                <li><strong>SFU Cascading:</strong> For massive webinars (500+ attendees), SFU nodes cascade video tracks in an internal tree distribution.</li>
                <li><strong>Virtualized Rendering:</strong> The React frontend uses an intersection observer so that only video tiles currently visible on the user’s monitor are decoded in hardware.</li>
              </ul>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Cryptographic Security & Join Tokens</h3>
              <p>
                AuraMeet ensures zero unauthenticated intrusion ("Zoom bombing") via 4 defense layers:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
                <li><strong>Cryptographic Join Tokens:</strong> Generated with short TTL (15 minutes), signed with HMAC-SHA256, carrying user role and room ID claims.</li>
                <li><strong>Waiting Room Triage:</strong> Uninvited guests are sequestered in an isolated holding state until explicitly admitted by the host.</li>
                <li><strong>DTLS-SRTP AES-GCM 256:</strong> Complete media encryption from client to SFU.</li>
                <li><strong>Append-Only Audit Logs:</strong> Every moderation action (mute, remove, admission) is recorded in immutable audit storage.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center text-xs text-slate-400">
          <span>AuraMeet Enterprise Technical Architecture v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
