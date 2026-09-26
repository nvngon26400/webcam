# AuraMeet — Enterprise Video Conferencing Platform

AuraMeet is a production-grade, ultra-low-latency video conferencing platform inspired by Google Meet and Zoom, featuring an original architecture, UI, and media pipeline.

![AuraMeet Preview](/src/assets/images/hero_collab_space_1790412756485.jpg)

## Key Highlights

- **Selective Forwarding Unit (SFU) Architecture:** Replaces brittle P2P mesh topologies with scalable RTP forwarding clusters accommodating up to 1,000+ peers per room.
- **Adaptive Simulcast & Quality Switching:** 1080p, 720p, 360p, and audio-only fallback matching network bandwidth and viewport size.
- **Web Audio VU Meter & Active Speaker Detection:** Real-time frequency analysis calculating true microphone amplitude and highlighting dominant speakers.
- **In-Call Collaboration:** Real-time chat with direct & public channels, message reactions, and announcement banners.
- **Breakout Rooms:** Group splitting (1-5 rooms) with auto-distribution and host broadcast announcements.
- **Waiting Room & Host Moderation:** Host triage, admit/deny queue, mute all, and room locking.
- **Cloud & Local Recording:** In-meeting WebM/MP4 composite media capture with live recording timers and instant download.
- **Gemini 2.5 Flash AI Meeting Minutes:** Automatically generates executive summaries, key decisions, and prioritized action items from meeting discussions.
- **Full Internationalization (i18n):** Complete native support for English (`en`) and Vietnamese (`vi`).
- **Telemetry & Admin Operations:** High-density live metrics dashboard tracking concurrent peers, ICE success rate, RTT latency, and append-only audit logs.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run full-stack dev server (Express + Vite + WebSocket on port 3000)
npm run dev

# 3. Build for production
npm run build
npm start
```
