# AuraMeet — System Architecture & Engineering Blueprint

## 1. Executive Summary

AuraMeet is an enterprise-grade, horizontally scalable video conferencing platform inspired by Google Meet and Zoom, engineered with an original architecture, branding, and implementation.

The platform is designed to accommodate:
- Over 1,000+ simultaneous participants per webinar/meeting.
- Sub-50ms glass-to-glass global latency.
- Strict control plane vs. media plane segregation.
- Dynamic simulcast and adaptive bitrate (ABR) allocation.
- Asynchronous AI meeting intelligence powered by Google Gemini.

---

## 2. High-Level Architecture Topology

```text
                                  CLIENT TIER
           [Desktop Web]           [Mobile PWA]           [SDK/Embed]
                 │                       │                      │
                 └───────────────────────┼──────────────────────┘
                                         ▼
                                   EDGE / INGRESS
                                 [Cloudflare / AWS ALB]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
          CONTROL PLANE                                     MEDIA PLANE
      [API Gateway / Auth]                             [SFU Media Cluster]
      [WebSocket Signaling]                            [Coturn TURN Mesh]
                 │                                               │
     ┌───────────┼───────────┐                         ┌─────────┴─────────┐
     ▼           ▼           ▼                         ▼                   ▼
[PostgreSQL]  [Redis]   [Worker]               [LiveKit / Mediasoup]  [Recording]
 (Supabase)   (PubSub)  (Gemini AI)             (Simulcast SFU)        (Composite)
```

---

## 3. Control Plane vs. Media Plane Segregation

A core failure mode of naive video applications is attempting to proxy media traffic through HTTP API servers. AuraMeet strictly enforces:

### Control Plane
- **Authentication & RBAC:** Supabase JWT tokens, granular role checks (`SUPER_ADMIN`, `ADMIN`, `ORGANIZER`, `HOST`, `CO_HOST`, `PARTICIPANT`, `GUEST`).
- **Meeting Scheduling & State:** Room lifecycles (`SCHEDULED`, `WAITING`, `LIVE`, `ENDING`, `ENDED`).
- **Signaling Hub:** Ephemeral WebSocket connections for SDP exchange, ICE candidate trickle, mute state propagation, hand raises, and breakout room orchestration.
- **Data Persistence:** Normalized PostgreSQL database with Row Level Security (RLS).

### Media Plane
- **SFU Clustered Forwarding:** Real-time RTP audio/video forwarding via LiveKit / Mediasoup.
- **Simulcast Allocation:** Ingests 1080p, 720p, and 360p from publishers, selectively forwarding appropriate spatial/temporal layers based on subscriber viewport geometry and network conditions.
- **TURN/STUN Relay:** Clustered Coturn instances resolving NAT traversal for enterprise symmetric firewalls.
- **Server-Side Recording:** Headless Chromium / GStreamer compositors producing multi-stream WebM/MP4 archives directly to object storage.
