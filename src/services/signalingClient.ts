/**
 * AuraMeet - Realtime WebSocket Signaling Client
 * Manages WebSocket connection, reconnects with exponential backoff & jitter,
 * dispatches signaling messages & media events.
 */

export type SignalingEventCallback = (payload: any) => void;

class SignalingClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SignalingEventCallback>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private currentRoomId: string | null = null;
  private currentUserData: any = null;

  connect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve();
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emitInternal('connection:state', { status: 'connected' });

          // Re-join if previously in a room
          if (this.currentRoomId && this.currentUserData) {
            this.send('join-room', {
              roomId: this.currentRoomId,
              ...this.currentUserData,
            });
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;
            if (type) {
              this.emitInternal(type, payload);
            }
          } catch (err) {
            console.warn('Failed to parse WebSocket message:', err);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('WebSocket error:', err);
          this.emitInternal('connection:state', { status: 'error', error: err });
          resolve();
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emitInternal('connection:state', { status: 'disconnected' });
          this.scheduleReconnect();
        };
      } catch (e) {
        console.warn('WebSocket initialization error:', e);
        resolve();
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max WebSocket reconnect attempts reached');
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000) + Math.random() * 500;
    this.reconnectAttempts++;
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  joinRoom(roomId: string, userData: any) {
    this.currentRoomId = roomId;
    this.currentUserData = userData;
    this.send('join-room', {
      roomId,
      ...userData,
    });
  }

  leaveRoom() {
    if (this.currentRoomId) {
      this.send('leave-room', { roomId: this.currentRoomId });
      this.currentRoomId = null;
      this.currentUserData = null;
    }
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      // If disconnected, try to connect and buffer
      this.connect().then(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type, payload }));
        }
      });
    }
  }

  on(type: string, callback: SignalingEventCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => this.off(type, callback);
  }

  off(type: string, callback: SignalingEventCallback) {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(callback);
    }
  }

  private emitInternal(type: string, payload: any) {
    const set = this.listeners.get(type);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in event listener for ${type}:`, e);
        }
      });
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.leaveRoom();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const signalingClient = new SignalingClient();
