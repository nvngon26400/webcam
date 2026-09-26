/**
 * AuraMeet - WebRTC Peer Connection Manager
 * Manages RTCPeerConnections for multi-user conferencing,
 * track transceiver allocation, ICE negotiation, and network metrics sampling.
 */

import { signalingClient } from './signalingClient';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 4,
};

export class PeerManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStreamCallback: ((peerId: string, stream: MediaStream) => void) | null = null;
  private onPeerDisconnectedCallback: ((peerId: string) => void) | null = null;

  constructor(
    onRemoteStream: (peerId: string, stream: MediaStream) => void,
    onPeerDisconnected: (peerId: string) => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onPeerDisconnectedCallback = onPeerDisconnected;
    this.setupSignalingListeners();
  }

  setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    // Replace tracks on all existing peer connections
    this.peers.forEach((pc) => {
      const senders = pc.getSenders();
      if (!this.localStream) return;

      this.localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch((err) => console.warn('replaceTrack error:', err));
        } else {
          try {
            pc.addTrack(track, this.localStream!);
          } catch (e) {
            console.warn('addTrack error:', e);
          }
        }
      });
    });
  }

  async createPeerConnection(targetPeerId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    if (this.peers.has(targetPeerId)) {
      return this.peers.get(targetPeerId)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peers.set(targetPeerId, pc);

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, this.localStream!);
        } catch (e) {
          console.warn('Error adding track to peer:', e);
        }
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream && this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(targetPeerId, remoteStream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingClient.send('ice-candidate', {
          targetPeerId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        if (this.onPeerDisconnectedCallback) {
          this.onPeerDisconnectedCallback(targetPeerId);
        }
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        signalingClient.send('offer', {
          targetPeerId,
          offer,
        });
      } catch (err) {
        console.warn('Failed to create offer for peer:', targetPeerId, err);
      }
    }

    return pc;
  }

  private setupSignalingListeners() {
    signalingClient.on('offer', async (data: { senderPeerId: string; offer: RTCSessionDescriptionInit }) => {
      const { senderPeerId, offer } = data;
      const pc = await this.createPeerConnection(senderPeerId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signalingClient.send('answer', {
          targetPeerId: senderPeerId,
          answer,
        });
      } catch (err) {
        console.warn('Error handling offer from peer:', senderPeerId, err);
      }
    });

    signalingClient.on('answer', async (data: { senderPeerId: string; answer: RTCSessionDescriptionInit }) => {
      const { senderPeerId, answer } = data;
      const pc = this.peers.get(senderPeerId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.warn('Error setting remote description from answer:', err);
        }
      }
    });

    signalingClient.on('ice-candidate', async (data: { senderPeerId: string; candidate: RTCIceCandidateInit }) => {
      const { senderPeerId, candidate } = data;
      const pc = this.peers.get(senderPeerId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding ICE candidate:', err);
        }
      }
    });
  }

  closePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
  }

  closeAllPeers() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
  }
}
