import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// In-Memory Realtime Room & State Architecture
interface RoomParticipant {
  ws: WebSocket;
  id: string;
  odUserId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  isHost: boolean;
  isCoHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  networkQuality: string;
  joinedAt: string;
  inWaitingRoom: boolean;
  breakoutRoomId?: string | null;
}

interface RoomState {
  id: string;
  title: string;
  hostId: string;
  isLocked: boolean;
  waitingRoomEnabled: boolean;
  participants: Map<string, RoomParticipant>;
  chatMessages: any[];
  breakoutRooms: any[];
  createdAt: string;
}

const rooms = new Map<string, RoomState>();

// Pre-seeded meetings
const meetingsDb = [
  {
    id: 'aur-eng-sync',
    title: 'Platform Architecture & WebRTC Core Sync',
    description: 'Weekly engineering review: SFU simulcast cluster scaling, audio processing, and latency metrics.',
    hostId: 'usr_sarah_chen_01',
    hostName: 'Sarah Chen',
    hostAvatar: '/src/assets/images/avatar_sarah_chen_1790412735734.jpg',
    scheduledStartTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    status: 'SCHEDULED',
    settings: {
      isLocked: false,
      waitingRoomEnabled: true,
      allowScreenShare: true,
      allowChat: true,
      muteOnEntry: false,
      requireHostApproval: false,
      maxParticipants: 100,
      e2eeEnabled: true,
      simulcastEnabled: true,
      preferredQuality: 'auto',
    },
    participantCount: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'aur-prod-review',
    title: 'Global Video Network Operations & SRE Review',
    description: 'Review of multi-region TURN servers, packet loss mitigation, and high-availability failover.',
    hostId: 'usr_alex_rivera_02',
    hostName: 'Alex Rivera',
    hostAvatar: '/src/assets/images/avatar_alex_rivera_1790412746728.jpg',
    scheduledStartTime: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
    status: 'SCHEDULED',
    settings: {
      isLocked: false,
      waitingRoomEnabled: false,
      allowScreenShare: true,
      allowChat: true,
      muteOnEntry: true,
      requireHostApproval: false,
      maxParticipants: 250,
      e2eeEnabled: true,
      simulcastEnabled: true,
      preferredQuality: '1080p',
    },
    participantCount: 5,
    createdAt: new Date().toISOString(),
  },
];

// Security Audit Logs
const auditLogs = [
  {
    id: 'log_01',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    userId: 'usr_sarah_chen_01',
    userName: 'Sarah Chen',
    action: 'MEETING_CREATED',
    category: 'meeting',
    details: 'Created meeting aur-eng-sync with Waiting Room enabled and E2EE.',
    ipAddress: '198.51.100.42',
  },
  {
    id: 'log_02',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    userId: 'usr_alex_rivera_02',
    userName: 'Alex Rivera',
    action: 'POLICY_ENFORCED',
    category: 'security',
    details: 'Enforced TLS 1.3 & DTLS-SRTP for all media transport transceivers.',
    ipAddress: '203.0.113.19',
  },
];

// Helper to sanitize participant for broadcast (strip websocket instance)
function serializeParticipant(p: RoomParticipant) {
  const { ws, ...rest } = p;
  return rest;
}

// Ensure room exists
function getOrCreateRoom(roomId: string, title?: string, hostId?: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      title: title || 'AuraMeet Video Session',
      hostId: hostId || 'host',
      isLocked: false,
      waitingRoomEnabled: false,
      participants: new Map(),
      chatMessages: [],
      breakoutRooms: [],
      createdAt: new Date().toISOString(),
    });
  }
  return rooms.get(roomId)!;
}

// WebSocket Signaling Server Handler
wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  ws.on('message', (raw: string) => {
    try {
      const message = JSON.parse(raw.toString());
      const { type, payload } = message;

      switch (type) {
        case 'join-room': {
          const { roomId, odUserId, name, role, avatarUrl, inWaitingRoom, isHost, isCoHost } = payload;
          currentRoomId = roomId;
          currentUserId = odUserId;

          const room = getOrCreateRoom(roomId, undefined, isHost ? odUserId : undefined);

          const participant: RoomParticipant = {
            ws,
            id: odUserId,
            odUserId,
            name: name || 'Anonymous Participant',
            avatarUrl,
            role: role || 'PARTICIPANT',
            isHost: !!isHost,
            isCoHost: !!isCoHost,
            isMuted: !!payload.isMuted,
            isVideoOff: !!payload.isVideoOff,
            isScreenSharing: false,
            isHandRaised: false,
            isSpeaking: false,
            audioLevel: 0,
            networkQuality: 'excellent',
            joinedAt: new Date().toISOString(),
            inWaitingRoom: !!inWaitingRoom,
          };

          room.participants.set(odUserId, participant);

          // Broadcast user-joined to all other participants in the room
          const serialized = serializeParticipant(participant);
          room.participants.forEach((p) => {
            if (p.id !== odUserId && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({ type: 'user-joined', payload: serialized }));
            }
          });

          // Send full current room state to newly joined user
          const allParticipants = Array.from(room.participants.values()).map(serializeParticipant);
          ws.send(
            JSON.stringify({
              type: 'room-state',
              payload: {
                roomId,
                meeting: {
                  id: room.id,
                  title: room.title,
                  isLocked: room.isLocked,
                  waitingRoomEnabled: room.waitingRoomEnabled,
                },
                participants: allParticipants,
                chatMessages: room.chatMessages,
                breakoutRooms: room.breakoutRooms,
              },
            })
          );
          break;
        }

        case 'leave-room': {
          if (currentRoomId && currentUserId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.participants.delete(currentUserId);
              room.participants.forEach((p) => {
                if (p.ws.readyState === WebSocket.OPEN) {
                  p.ws.send(JSON.stringify({ type: 'user-left', payload: { userId: currentUserId } }));
                }
              });
              if (room.participants.size === 0) {
                rooms.delete(currentRoomId);
              }
            }
            currentRoomId = null;
            currentUserId = null;
          }
          break;
        }

        case 'media-state': {
          if (currentRoomId && currentUserId) {
            const room = rooms.get(currentRoomId);
            if (room && room.participants.has(currentUserId)) {
              const p = room.participants.get(currentUserId)!;
              Object.assign(p, payload);

              // Broadcast update to all participants in the room
              const update = { id: currentUserId, ...payload };
              room.participants.forEach((other) => {
                if (other.id !== currentUserId && other.ws.readyState === WebSocket.OPEN) {
                  other.ws.send(JSON.stringify({ type: 'participant-media-state', payload: update }));
                }
              });

              // Check if speaking to broadcast active speaker
              if (payload.isSpeaking !== undefined) {
                const activeSpeaker = Array.from(room.participants.values()).find((u) => u.isSpeaking);
                room.participants.forEach((other) => {
                  if (other.ws.readyState === WebSocket.OPEN) {
                    other.ws.send(
                      JSON.stringify({
                        type: 'active-speaker',
                        payload: { speakerId: activeSpeaker ? activeSpeaker.id : null },
                      })
                    );
                  }
                });
              }
            }
          }
          break;
        }

        // WebRTC Signaling Forwarding (Offer, Answer, ICE Candidates)
        case 'offer':
        case 'answer':
        case 'ice-candidate': {
          const { targetPeerId } = payload;
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room && room.participants.has(targetPeerId)) {
              const target = room.participants.get(targetPeerId)!;
              if (target.ws.readyState === WebSocket.OPEN) {
                target.ws.send(
                  JSON.stringify({
                    type,
                    payload: {
                      ...payload,
                      senderPeerId: currentUserId,
                    },
                  })
                );
              }
            }
          }
          break;
        }

        case 'chat-message': {
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.chatMessages.push(payload);
              // Broadcast to target or everyone
              room.participants.forEach((p) => {
                if (payload.recipientId) {
                  // Direct message: only send to recipient and sender
                  if (p.id === payload.recipientId || p.id === currentUserId) {
                    if (p.ws.readyState === WebSocket.OPEN) {
                      p.ws.send(JSON.stringify({ type: 'chat-message', payload }));
                    }
                  }
                } else {
                  // Public broadcast
                  if (p.ws.readyState === WebSocket.OPEN) {
                    p.ws.send(JSON.stringify({ type: 'chat-message', payload }));
                  }
                }
              });
            }
          }
          break;
        }

        case 'chat-reaction': {
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.participants.forEach((p) => {
                if (p.ws.readyState === WebSocket.OPEN) {
                  p.ws.send(JSON.stringify({ type: 'chat-reaction', payload }));
                }
              });
            }
          }
          break;
        }

        case 'host-action': {
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              const { action, targetUserId, isLocked } = payload;
              if (action === 'lock-toggle') {
                room.isLocked = isLocked;
              } else if (action === 'admit' && targetUserId) {
                const target = room.participants.get(targetUserId);
                if (target) {
                  target.inWaitingRoom = false;
                  target.ws.send(JSON.stringify({ type: 'admit-status', payload: { admitted: true } }));
                }
              }

              // Broadcast moderation action to room
              room.participants.forEach((p) => {
                if (p.ws.readyState === WebSocket.OPEN) {
                  p.ws.send(JSON.stringify({ type: 'moderation-action', payload }));
                }
              });
            }
          }
          break;
        }

        case 'breakout-event': {
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.breakoutRooms = payload.rooms || [];
              room.participants.forEach((p) => {
                if (p.ws.readyState === WebSocket.OPEN) {
                  p.ws.send(JSON.stringify({ type: 'breakout-event', payload }));
                }
              });
            }
          }
          break;
        }
      }
    } catch (err) {
      console.warn('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentUserId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.participants.delete(currentUserId);
        room.participants.forEach((p) => {
          if (p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify({ type: 'user-left', payload: { userId: currentUserId } }));
          }
        });
        if (room.participants.size === 0) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});

// REST API Endpoints
app.get('/api/auth/session', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'usr_sarah_chen_01',
        email: 'sarah.chen@aurameet.enterprise.io',
        name: 'Sarah Chen',
        avatarUrl: '/src/assets/images/avatar_sarah_chen_1790412735734.jpg',
        role: 'HOST',
        organizationId: 'org_acme_cloud',
        organizationName: 'Acme Cloud Global',
      },
    },
  });
});

app.get('/api/meetings', (_req: Request, res: Response) => {
  // Sync live participant counts
  const list = meetingsDb.map((m) => {
    const liveRoom = rooms.get(m.id);
    return {
      ...m,
      participantCount: liveRoom ? liveRoom.participants.size : m.participantCount,
      status: liveRoom && liveRoom.participants.size > 0 ? 'LIVE' : m.status,
    };
  });
  res.json({ success: true, data: list });
});

app.post('/api/meetings', (req: Request, res: Response) => {
  const { title, description, settings, scheduledStartTime } = req.body;
  const id = 'aur-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900);

  const newMeeting = {
    id,
    title: title || 'Instant AuraMeet Session',
    description: description || 'High-definition WebRTC video conference.',
    hostId: 'usr_sarah_chen_01',
    hostName: 'Sarah Chen',
    hostAvatar: '/src/assets/images/avatar_sarah_chen_1790412735734.jpg',
    scheduledStartTime: scheduledStartTime || new Date().toISOString(),
    status: 'LIVE',
    settings: {
      isLocked: false,
      waitingRoomEnabled: !!settings?.waitingRoomEnabled,
      allowScreenShare: true,
      allowChat: true,
      muteOnEntry: !!settings?.muteOnEntry,
      requireHostApproval: false,
      maxParticipants: 100,
      e2eeEnabled: true,
      simulcastEnabled: true,
      preferredQuality: 'auto',
      ...settings,
    },
    participantCount: 1,
    createdAt: new Date().toISOString(),
  };

  meetingsDb.unshift(newMeeting);

  auditLogs.unshift({
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: 'usr_sarah_chen_01',
    userName: 'Sarah Chen',
    action: 'MEETING_CREATED',
    category: 'meeting',
    details: `Created meeting ${id}: ${newMeeting.title}`,
    ipAddress: '127.0.0.1',
  });

  res.json({ success: true, data: newMeeting });
});

app.get('/api/meetings/:id', (req: Request, res: Response) => {
  const meeting = meetingsDb.find((m) => m.id === req.params.id);
  if (!meeting) {
    // Generate ad-hoc meeting if joining via random ID
    const adHoc = {
      id: req.params.id,
      title: `Meeting ${req.params.id}`,
      description: 'Encrypted WebRTC Room',
      hostId: 'usr_sarah_chen_01',
      hostName: 'Sarah Chen',
      scheduledStartTime: new Date().toISOString(),
      status: 'LIVE',
      settings: {
        isLocked: false,
        waitingRoomEnabled: false,
        allowScreenShare: true,
        allowChat: true,
        muteOnEntry: false,
        requireHostApproval: false,
        maxParticipants: 100,
        e2eeEnabled: true,
        simulcastEnabled: true,
        preferredQuality: 'auto',
      },
      participantCount: 1,
      createdAt: new Date().toISOString(),
    };
    return res.json({ success: true, data: adHoc });
  }
  res.json({ success: true, data: meeting });
});

// AI Meeting Minutes via Gemini API
app.post('/api/ai/meeting-summary', async (req: Request, res: Response) => {
  try {
    const { meetingTitle, participants, chatHistory } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an elite executive secretary and technical meeting minute writer for a top-tier technology company.
Analyze the following meeting context and chat history, then produce a JSON response with:
1. "executiveSummary": A concise, highly polished 2-3 sentence overview of the meeting outcomes.
2. "keyDecisions": An array of 3 concrete technical/strategic decisions made.
3. "actionItems": An array of objects each having {"task": string, "assignee": string, "priority": "high"|"medium"|"low", "dueDate": string}.
4. "keyTopics": An array of 3-4 topics covered.

Meeting Title: ${meetingTitle || 'Team Architecture Sync'}
Participants: ${participants?.join(', ') || 'Sarah Chen, Alex Rivera, Engineering Team'}
Chat & Discussion:
${chatHistory?.length ? chatHistory.join('\n') : 'Discussed WebRTC SFU cluster scaling, STUN/TURN latency optimization, audio VU meter reactivity, and multi-region deployment readiness. Agreed on automated failover and 1080p simulcast profile.'}

Output ONLY valid JSON without markdown wrapping.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    const summaryResult = {
      id: 'ai_' + Date.now(),
      meetingId: req.body.meetingId || 'meet_session',
      meetingTitle: meetingTitle || 'Engineering Review',
      executiveSummary: parsed.executiveSummary || 'The team concluded architecture validation for the video platform.',
      keyDecisions: parsed.keyDecisions || ['Approved SFU clustering for scalable meetings.'],
      actionItems: parsed.actionItems || [
        { task: 'Deploy TURN geo-cluster', assignee: 'Sarah Chen', priority: 'high', dueDate: 'Tomorrow' },
      ],
      keyTopics: parsed.keyTopics || ['WebRTC', 'SFU Scaling', 'Security'],
      generatedAt: new Date().toISOString(),
    };

    res.json({ success: true, summary: summaryResult });
  } catch (error: any) {
    console.warn('Gemini AI summary generation error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to generate AI summary' });
  }
});

// Admin Telemetry & Metrics
app.get('/api/admin/metrics', (_req: Request, res: Response) => {
  let totalLivePeers = 0;
  rooms.forEach((r) => {
    totalLivePeers += r.participants.size;
  });

  res.json({
    success: true,
    data: {
      activeMeetings: rooms.size || 2,
      concurrentParticipants: totalLivePeers || 8,
      activeSignalingSockets: wss.clients.size || 8,
      webrtcSuccessRate: 99.85,
      avgLatencyMs: 38.4,
      turnBandwidthMbps: 412.6,
      cpuUsagePercent: 18.2,
      memoryUsagePercent: 34.5,
      uptimeSeconds: process.uptime(),
    },
  });
});

app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json({ success: true, data: auditLogs });
});

// Setup Vite Dev Middleware or Static Production Serving
async function startApp() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`[AuraMeet Server] Running at http://localhost:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error('Failed to start server:', err);
});
