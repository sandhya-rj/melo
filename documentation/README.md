# MELO — Reconstructed Windows Desktop Music Application

**MELO** is a high-fidelity, fully functional Windows desktop music player independently reconstructed from empirical reverse-engineering evidence gathered using the **Reverse Engineer Anything (REA)** platform against the locally installed Spotify Desktop client (Windows 11 x86_64, CEF Runtime v1.3.8.620).

MELO replicates Spotify's signature desktop aesthetic, design tokens, multi-panel layout, interactive workflows, and audio playback state machine while operating strictly clean-room, using local SQLite persistence and legally usable, royalty-free audio tracks.

---

## 1. System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 MELO Desktop Shell                                |
|                                (Electron Main Process)                            |
|  +------------------+  +--------------------+  +-------------------------------+  |
|  | Window Manager   |  | SQLite Storage     |  | IPC Handlers                  |  |
|  | (Frameless, DWM) |  | (sql.js / WASM)    |  | (Library, Window, Settings)   |  |
|  +------------------+  +--------------------+  +-------------------------------+  |
+-----------------------------------------|-----------------------------------------+
                                          | ContextBridge IPC (window.electronAPI)
+-----------------------------------------v-----------------------------------------+
|                               Renderer Process                                    |
|                       (React 18 + TypeScript + Vite 5)                            |
|  +-----------------------------------------------------------------------------+  |
|  | Top Navigation Bar (History Back/Forward, Search Bar, MELO Avatar)          |  |
|  +---------------------+-------------------------------+-----------------------+  |
|  | Left Sidebar        | Main Scrollable Canvas        | Right Details Panel   |  |
|  | - Library Nav       | - Home View (Shelves, Grids)  | - Now Playing Info    |  |
|  | - Playlist List     | - Search & Browse Categories  | - Live Queue List     |  |
|  | - Filter Pills      | - Playlist / Album Detail     |                       |  |
|  |                     | - Artist Page & Liked Songs   |                       |  |
|  |                     | - Settings Screen             |                       |  |
|  +---------------------+-------------------------------+-----------------------+  |
|  | Bottom Sticky Player Bar                                                    |  |
|  | - Current Track Info (Art, Title, Artist, Heart Toggle)                    |  |
|  | - Playback Controls (Shuffle, Prev, Play/Pause, Next, Repeat, Scrubber)     |  |
|  | - Volume Slider, Mute Toggle, Queue Toggle, Device Selector                |  |
|  +-----------------------------------------------------------------------------+  |
|  | Audio Engine Service (HTML5 Audio, Web Audio API, Dual-Tier Queue Manager)   |  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Key Features

- **High-Fidelity Visual Parity**: 96.6% visual fidelity score evaluated across 10 core views and 3 modals against empirical Spotify screenshots.
- **Encore Design System**: Pixel-precise dark palette (`#121212`, `#1f1f1f`, `#282828`, `#1ed760`), typographic scales, and responsive layout grids.
- **Audio Playback Engine**:
  * Play, pause, resume, seek scrubbing, duration calculations.
  * Logarithmic volume slider and mute toggle preserving prior volume level.
  * Fisher-Yates queue shuffle keeping current track at index 0 without duplicates.
  * Tri-state repeat (`OFF` $\to$ `ALL` $\to$ `ONE`).
  * Strict 3.0-second rewind rule on "Previous" button.
  * Two-tier queue model (prioritized User Queue over Context Playlist Queue).
- **Persistent SQLite Library**:
  * Playlist CRUD (create, rename, delete, add/remove tracks).
  * Instant Liked Songs toggle persisting across application restarts.
  * User settings persistence (audio quality, normalization, themes).
- **Independent Windows Packaging**: Standalone NSIS installer (`releases/MELO-Setup.exe`) that installs and runs completely offline without requiring a development server.

---

## 3. Quick Start & Development

### 3.1 Prerequisites
- Windows 10/11 x86_64
- Node.js $\ge$ 20.x (Recommended: v26.13.0 or v20.x)
- npm $\ge$ 10.x

### 3.2 Running Development Server
Start the Vite frontend development server and Electron desktop shell:
```bash
# In Windows PowerShell:
npm.cmd run dev
```
The live frontend is accessible in your browser at `http://localhost:5173/` and launches simultaneously inside the Electron desktop shell.

### 3.3 Running Automated Tests
```bash
# Run all unit and integration test suites:
npm.cmd test

# Run individual test suites:
npm.cmd run test:unit
npm.cmd run test:integration
```

### 3.4 Building the Standalone Windows Installer
```bash
# Build the production Vite bundle and Electron main bundle:
npm.cmd run build

# Package standalone NSIS installer:
npx.cmd electron-builder --win nsis --x64
```
The output installer will be created at `releases/MELO-Setup.exe`.

---

## 4. Directory Layout

```
melo/
├── .agents/teamwork/             # Teamwork orchestrator and worker metadata
├── documentation/                # Authoritative REA reports, guides, build status
│   ├── REA_INVESTIGATION_REPORT.md
│   ├── REA_INVESTIGATION_REPORT.pdf
│   ├── BUILD_STATUS.md
│   └── README.md
├── evidence/                     # REA evidence registers and Spotify reference captures
│   ├── evidence-register.csv
│   └── screenshots/spotify/      # 10 Reference Spotify screenshots
├── reference/                    # Reverse-engineering specifications
│   ├── spotify-package-analysis.md
│   ├── spotify-ui-spec.md
│   └── spotify-workflows-and-boundaries.md
├── testing/                      # QA test matrix, results log, limitations, MELO screenshots
│   ├── test-report.md            # Comprehensive visual comparison report (96.6% score)
│   ├── test-results.csv          # 24/24 automated & manual test log
│   ├── known-limitations.md      # Intentional service boundaries & offline scope
│   └── screenshots/melo/         # 10 Reconstructed MELO screenshots
├── releases/                     # Standalone packaged distribution
│   └── MELO-Setup.exe            # Standalone Windows NSIS installer
├── public/                       # Public assets & legally usable sample audio
│   └── audio/                    # Bundled royalty-free MP3 tracks
├── src/                          # Application source code
│   ├── main/                     # Electron main process & SQLite persistence
│   ├── renderer/                 # React 18 UI components, views, and styles
│   └── shared/                   # Shared TypeScript interfaces & IPC contracts
├── tests/                        # Vitest & Node test runner test suites
├── electron-builder.json         # Packaging configuration
├── package.json                  # Dependencies & scripts
└── vite.config.ts                # Vite build configuration
```

---

## 5. REA Investigation & Evidence Traceability

All features and UI designs trace directly to REA MCP tool outputs recorded in `evidence/evidence-register.csv`. For complete architectural documentation, consult:
- `documentation/REA_INVESTIGATION_REPORT.md` (and `REA_INVESTIGATION_REPORT.pdf`)
- `testing/test-report.md`
- `testing/known-limitations.md`
