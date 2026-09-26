/**
 * AuraMeet - Enterprise Video Conferencing Platform
 * Core Type Definitions
 */

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'ORGANIZER' 
  | 'HOST' 
  | 'CO_HOST' 
  | 'PARTICIPANT' 
  | 'GUEST';

export type MeetingStatus = 'SCHEDULED' | 'WAITING' | 'LIVE' | 'ENDING' | 'ENDED';

export type QualityLayer = 'auto' | '1080p' | '720p' | '360p' | 'audio_only';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

export interface MeetingSettings {
  isLocked: boolean;
  waitingRoomEnabled: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  muteOnEntry: boolean;
  requireHostApproval: boolean;
  maxParticipants: number;
  e2eeEnabled: boolean;
  simulcastEnabled: boolean;
  preferredQuality: QualityLayer;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  scheduledStartTime: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  status: MeetingStatus;
  passcode?: string;
  settings: MeetingSettings;
  participantCount: number;
  activeBreakoutRooms?: number;
  createdAt: string;
}

export interface Participant {
  id: string;
  odUserId: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isHost: boolean;
  isCoHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0 to 1
  networkQuality: 'excellent' | 'good' | 'poor' | 'reconnecting';
  joinedAt: string;
  inWaitingRoom: boolean;
  breakoutRoomId?: string | null;
  stream?: MediaStream;
}

export interface ChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId?: string; // undefined means public/to all
  text: string;
  timestamp: string;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  isAnnouncement?: boolean;
}

export interface BreakoutRoom {
  id: string;
  meetingId: string;
  name: string;
  participantIds: string[];
  createdAt: string;
}

export interface Recording {
  id: string;
  meetingId: string;
  meetingTitle: string;
  durationSeconds: number;
  fileSizeBytes: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface AISummary {
  id: string;
  meetingId: string;
  meetingTitle: string;
  executiveSummary: string;
  keyDecisions: string[];
  actionItems: Array<{
    task: string;
    assignee: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
  }>;
  keyTopics: string[];
  generatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: 'auth' | 'meeting' | 'moderation' | 'security' | 'recording';
  details: string;
  ipAddress: string;
}

export interface SystemMetrics {
  activeMeetings: number;
  concurrentParticipants: number;
  activeSignalingSockets: number;
  webrtcSuccessRate: number; // e.g. 99.8
  avgLatencyMs: number;
  turnBandwidthMbps: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  uptimeSeconds: number;
}
