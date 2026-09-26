# AuraMeet — WebRTC, SFU & Media Pipeline Specifications

## 1. SFU Selection Rationale

We selected **LiveKit / Mediasoup** as the core media server layer rather than Janus or pure P2P mesh:

| Metric | P2P Mesh | Janus Gateway | LiveKit / Mediasoup |
| :--- | :--- | :--- | :--- |
| **Max Room Size** | 4-6 peers | ~50 peers | **1,000+ peers** |
| **Publisher Bandwidth** | $O(N)$ (High) | 1 uplink | **1 uplink (Low)** |
| **Client CPU Load** | Crashes at 8 peers | Moderate | **Minimal (Hardware Dec)** |
| **Simulcast & SVC** | None | Partial | **Native VP8/VP9/AV1** |
| **Active Speaker Detection** | Client-side audio processing | Heavy plugin | **Zero-roundtrip RTP Energy** |

---

## 2. Simulcast Layer Bitrate Allocation

Publishers transmit 3 spatial video streams inside a single RTCPeerConnection:

```text
┌───────────┬──────────────┬──────────────┬────────────┐
│ Layer     │ Resolution   │ Target FPS   │ Bitrate    │
├───────────┼──────────────┼──────────────┼────────────┤
│ High      │ 1920x1080    │ 30 / 60 fps  │ 2,500 kbps │
│ Medium    │ 1280x720     │ 30 fps       │ 1,000 kbps │
│ Low       │ 640x360      │ 15 fps       │   250 kbps │
└───────────┴──────────────┴──────────────┴────────────┘
```

The SFU forwards:
- **High Layer** to the pinned or active dominant speaker tile.
- **Medium Layer** to participants visible in the active 4-tile grid.
- **Low Layer** to background thumbnail filmstrip tiles.
- **Paused Stream** (0 kbps) for off-screen pages or minimized tabs.

---

## 3. Audio Processing Specifications

- **Echo Cancellation (AEC):** Enforced via `echoCancellation: true` in `MediaTrackConstraints`.
- **Noise Suppression (NS):** Real-time spectral subtraction filtering background ambient fan/keyboard clicks.
- **Automatic Gain Control (AGC):** Equalizes vocal amplitude across whisperers and loud speakers.
- **Web Audio Analyser VU Meter:** Client uses `AudioContext` and `AnalyserNode` with Fast Fourier Transform (FFT) analysis to render true decibel volumes and trigger luminous speaker halos.
