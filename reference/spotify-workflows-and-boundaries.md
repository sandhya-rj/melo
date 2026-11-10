# Spotify Workflows & Service Boundaries Investigation

## 1. Executive Summary & REA Investigation Overview

This report provides an in-depth architectural and operational investigation of the Spotify Desktop client's observable workflows, state machines, and service boundaries. The analysis was conducted exclusively using the Reverse Engineer Anything (REA) framework against the locally installed Spotify Desktop application (`C:\Users\suzhi\AppData\Roaming\Spotify\Spotify.exe`, version `1.3.8.620.g39b276d5d7ac`).

All findings are anchored in verified REA Evidence IDs registered in `evidence/evidence-register.csv`:
- **`ev_202a40500f42970f07eaa29bdbbfcc67ac90f80831500689fc8d92b9e8c45332`**: Bounded inspection of the Spotify application root via `rea.inspect_desktop_application`.
- **`ev_86ac51c55b86aa2b5bf3ace7af59da4813d6ef326f6129e294715bb00ef724f9`**: Local database schema inspection via `rea.inspect_sqlite_database`.
- **`ev_be345c5f3b1232b7b1ab07a4523346cfbe16e00fdad76927b2e5cc25eaefbfdc`**: Executable binary imports analysis via `rea.inspect_pe_imports`.
- **`ev_61e6a21d2419b00e9f2fe89b7b2bfaf6d3bcf58c9ce89b6459ee799811ebbbea`**: Icon groups and resource hierarchy inspection via `rea.inspect_pe_resources`.
- **`ev_b84d62ad21c339de3a855f8c8b98a12df9a78037730ca01f9de6d8edb2fcfba4`**: AST syntax and data flow analysis of `xpui-routes-create-playlist.js` via `rea.analyze_javascript_application`.
- **`ev_7fef823bac6803863a50be9726b2dc1e93e362c6ef24544dc38fadc996f28d77`**: AST analysis of `xpui-routes-desktop-settings.js` via `rea.analyze_javascript_application`.
- **`ev_666b78589d6fca2d0c53819551b5e446a3832adf237e5685d9be6f411f44d6e0`**: AST analysis of application snapshot entrypoint `xpui-snapshot.js` via `rea.analyze_javascript_application`.
- **`ev_32c0e37d56fa6d0fca8fb3e97161fbb18e875ccb309b1de07e339c88cbb3b546`**: AST analysis of `xpui-routes-playlist.js` via `rea.analyze_javascript_application`.
- **`ev_0ecbe2e11e3e38ced216c0356f5948426069a66b16f74ffbb95ca716431b9591`**: AST analysis of `xpui-routes-search.js` via `rea.analyze_javascript_application`.
- **`ev_0d7686784ec4ed09c0c7734364f1bd6776c01c1b0bdbc7a39f839d06a343cdd0`**: AST analysis of `xpui-routes-collection-songs.js` via `rea.analyze_javascript_application`.

---

## 2. Playback Workflow & State Machine

The playback subsystem in Spotify coordinates the player bar, audio decoder, queue advancement, and UI progress indicators.

```
       +--------------+
       |     IDLE     |
       +-------+------+
               | play(track, context)
               v
       +--------------+
       |   LOADING    |<-----------------------+
       +-------+------+                        |
               | oncanplay / loadedmetadata    |
               v                               |
+----->+--------------+                        |
|      |   PLAYING    |                        |
|      +---+------+---+                        |
| pause()  |      | seek(pos)                  |
|          v      |                            |
|      +---+------+---+                        |
|      |    PAUSED    |                        |
|      +---+------+---+                        |
|          | resume()                          |
+----------+                                   |
                                               |
  track ended:                                 |
  - repeat == ONE  --> seek(0), play()         |
  - repeat != ONE  --> next() track -----------+
```

### 2.1 State Definitions
1. **`IDLE`**: No track loaded. Player bar displays blank/placeholder track info and disabled progress bar.
2. **`LOADING`**: Audio buffer is fetching metadata and decoding stream. Play/pause button indicates loading state.
3. **`PLAYING`**: Audio clock is advancing. Progress bar increments smoothly.
4. **`PAUSED`**: Audio playback is suspended at `currentTime`. Timer is frozen.
5. **`ENDED`**: Track playback reaches `duration`. Triggers repeat/next transition.
6. **`ERROR`**: Playback failure (unsupported codec, missing file). Emits user notification.

### 2.2 Core Playback Controls
- **Play / Pause / Resume**:
  - `play(track, context)`: Clears or populates context queue, sets current track, resets position to 0, transitions to `PLAYING`.
  - `pause()`: Suspends playback, captures `positionAsOfTimestamp`.
  - `resume()`: Restarts playback from current position.
- **Seek (`seekTo(positionMs)`)**:
  - Directly updates the audio engine's `currentTime`.
  - Emits instantaneous position updates to progress listeners.
  - While user is actively dragging the seek slider thumb, audio updates can be debounced or clamped until `mouseup`.
- **Volume & Mute**:
  - Normalized range `[0.0, 1.0]`.
  - Stored in persistent settings.
  - Mute toggles between 0 volume and the cached pre-mute volume level.
  - Volume icon dynamically changes states:
    - `0%` or Muted: `VolumeMuteIcon`
    - `1% - 33%`: `VolumeLowIcon`
    - `34% - 66%`: `VolumeMediumIcon`
    - `67% - 100%`: `VolumeHighIcon`
- **Shuffle Algorithm**:
  - Mode: `Boolean` (`true` / `false`).
  - When enabled, the context track list is randomized using the **Fisher-Yates (Knuth) shuffle algorithm**.
  - **Critical Invariant**: The currently playing track remains at index 0 and does not repeat.
  - When disabled, tracks return to their original deterministic order (e.g., album track numbering or playlist custom order).
- **Repeat Modes**:
  - Tri-state cycle: `OFF` (0) -> `ALL` / Context (1) -> `ONE` / Track (2) -> `OFF` (0).
  - UI visual states:
    - `OFF`: Dimmed/standard icon, no indicator dot.
    - `ALL`: Accent green icon (`#1DB954`) with indicator dot.
    - `ONE`: Accent green icon with indicator dot and badge numeral `1`.
- **Previous / Next Track Logic**:
  - **Next (`skipToNext()`)**:
    1. If manual User Queue (`userQueue`) has items: pop the head item and play immediately.
    2. Else if Context Queue (`contextQueue`) has a subsequent track: advance index by 1.
    3. Else (at end of Context Queue):
       - If `repeatMode === ALL`: wrap to index 0.
       - If `repeatMode === OFF`: stop playback, transition to `IDLE` or `PAUSED` at track end.
  - **Previous (`skipToPrevious()`) — The 3.0-Second Rule**:
    - **Observed Behavior**: If `currentPositionMs > 3000` (3 seconds), previous **rewinds the current track to 0:00**.
    - If `currentPositionMs <= 3000`:
      - If historical track exists in `playbackHistory`: pop and play previous track.
      - If at track 0 without history: rewind current track to 0:00.
- **Progress Timer Synchronization**:
  - HTML5 Audio `timeupdate` events fire at erratic intervals (approximately every 250ms), causing noticeable stuttering on UI sliders.
  - Spotify's desktop architecture synchronizes UI clocks using:
    $$\text{currentPositionMs} = \text{positionAsOfTimestamp} + (\text{performance.now}() - \text{timestamp})$$
  - Smooth animation is achieved using `requestAnimationFrame` or a 100ms ticker interval, clamped between `0` and `durationMs`.

---

## 3. Queue Management Workflow

The Spotify queue follows a strict **two-tier priority model**:

```
+-----------------------------------------------------------+
| NOW PLAYING                                               |
| [Cover] Title - Artist (02:14 / 03:45)                    |
+-----------------------------------------------------------+
| NEXT IN QUEUE (Manual User Queue - Priority 1)            |
| 1. User Track A  [Drag Handle] [Delete]                   |
| 2. User Track B  [Drag Handle] [Delete]                   |
+-----------------------------------------------------------+
| NEXT FROM: [Context - Album/Playlist - Priority 2]        |
| 3. Context Track C                                        |
| 4. Context Track D                                        |
| 5. Context Track E                                        |
+-----------------------------------------------------------+
```

### 3.1 Two-Tier Queue Operations
1. **User Queue (`userQueue`)**:
   - Populated when the user clicks **"Add to Queue"** from track context menus or drags tracks into the Queue view.
   - User Queue items **always play first**, before any remaining tracks in the current context.
   - User Queue supports reordering (via drag & drop) and individual item deletion (`remove_items_from_queue`).
   - "Clear Queue" button flushes only the `userQueue`, leaving context playback intact.
2. **Context Queue (`contextQueue`)**:
   - Represents the active container (Album, Playlist, Artist Top Tracks, Liked Songs).
   - If shuffle is enabled, context tracks are presented in their shuffled sequence.
   - Tracks advance linearly unless looped via repeat mode.

### 3.2 Progression Mechanics
When the active track finishes (`ended` event):
```typescript
function advanceQueue(state: PlaybackState): PlaybackState {
  if (state.repeatMode === RepeatMode.ONE) {
    return { ...state, positionMs: 0 };
  }
  if (state.userQueue.length > 0) {
    const [nextTrack, ...remainingUserQueue] = state.userQueue;
    return {
      ...state,
      currentTrack: nextTrack,
      userQueue: remainingUserQueue,
      positionMs: 0,
      isPlaying: true
    };
  }
  if (state.contextIndex + 1 < state.contextQueue.length) {
    const nextIndex = state.contextIndex + 1;
    return {
      ...state,
      currentTrack: state.contextQueue[nextIndex],
      contextIndex: nextIndex,
      positionMs: 0,
      isPlaying: true
    };
  }
  if (state.repeatMode === RepeatMode.ALL && state.contextQueue.length > 0) {
    return {
      ...state,
      currentTrack: state.contextQueue[0],
      contextIndex: 0,
      positionMs: 0,
      isPlaying: true
    };
  }
  return { ...state, isPlaying: false, positionMs: 0 };
}
```

---

## 4. Playlist Management Workflow

Playlist management in Spotify involves synchronous UI feedback backed by persistent operations.

### 4.1 Create Playlist
- **Trigger**: Click `+` button in sidebar or header navigation (`xpui-routes-create-playlist.js`).
- **Initial State**:
  - Name defaults to `"My Playlist #N"` (incremented based on user's existing playlist count).
  - Description is empty.
  - Cover image defaults to standard 4-quadrant mosaic or musical note icon placeholder.
  - Automatically redirects view to the newly created playlist page.

### 4.2 Edit Playlist Metadata
- **Trigger**: Click playlist title/cover header or select "Edit details" from context menu.
- **Modal Component**:
  - **Cover Image Selector**: Click cover to upload local image (`.jpg`, `.png`).
  - **Name Input**: Text field, max length 100 characters.
  - **Description Input**: Textarea, optional notes up to 300 characters.
  - **Actions**: "Save" (persists to database) and "Cancel" (discards edits).

### 4.3 Add / Remove Tracks
- **Add Track**:
  - Context menu on any track item -> "Add to playlist" -> list of user playlists.
  - Dragging a track or multiple selected tracks onto a playlist in the left sidebar.
  - Track is appended with `order_index = max(order_index) + 1`.
- **Remove Track**:
  - Right-click track in playlist -> "Remove from this playlist".
  - Subsequent tracks' `order_index` values are decremented or compacted.

### 4.4 Track Reordering
- In "Custom Order" sort mode, users can drag and drop track rows.
- Keyboard shortcuts or context menu items ("Move to top", "Move to bottom").
- Mutates `order_index` in the underlying database.

### 4.5 Delete Playlist
- Right-click playlist in sidebar or header -> "Delete".
- Confirmation dialog: *"Are you sure you want to delete [Playlist Name]? This action cannot be undone."*
- Deleting a playlist executes cascade deletion of associated `playlist_tracks`.

---

## 5. Library & Navigation Workflows

### 5.1 Liked Songs Toggle
- Heart button (`isLiked` / `isDisliked`) appears in:
  - Sticky bottom player bar (next to track info).
  - Track table rows.
  - Full-screen / Now Playing view.
- Click action toggles status:
  - Liked: Filled green heart (`#1DB954`). Adds entry to `liked_songs`.
  - Unliked: Empty outline heart (`#B3B3B3` / `#FFFFFF` on hover). Removes entry from `liked_songs`.
  - Optimistic UI update: Icon toggles instantly; background persistence writes asynchronously.

### 5.2 Search with Live Debounce
- **Input Field**: Top navigation bar / Search screen (`xpui-routes-search.js`).
- **Debounce Strategy**:
  - Debounce threshold: **300ms**.
  - Avoids re-filtering on every keystroke.
  - User typing triggers cancel of previous scheduled timer:
    ```typescript
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedQuery(query.trim());
      }, 300);
      return () => clearTimeout(handler);
    }, [query]);
    ```
- **Filter Chips**:
  - Horizontal pill buttons below search bar: `All`, `Songs`, `Artists`, `Albums`, `Playlists`.
  - Selecting a chip scopes the search results list.
- **Search Result Segmentation**:
  1. **Top Result**: Prominent highlighted card with direct play button.
  2. **Songs**: Top matching track rows with album art, artist, and duration.
  3. **Artists**: Round avatar cards.
  4. **Albums**: Square cards with album art and release year.
  5. **Playlists**: Square cards with playlist artwork and creator attribution.

### 5.3 Browse Categories & Genres
- Grid layout with cards styled in vibrant background color accents (`#E13300`, `#1E3264`, `#8D67AB`, `#E8115B`, etc.).
- Diagonal cropped category artwork in the bottom-right corner of each card.
- Clicking a category card navigates to curated category playlists and albums.

### 5.4 Sorting Modes
Available in Playlists, Liked Songs, and Library views:
| Sort Option | Description | Secondary Tie-breaker |
|---|---|---|
| **Custom Order** | Manual user order (`order_index`) | None |
| **Title** | Alphabetical by track title (`A-Z` / `Z-A`) | Artist name |
| **Artist** | Alphabetical by artist name (`A-Z` / `Z-A`) | Album name |
| **Album** | Alphabetical by album name (`A-Z` / `Z-A`) | Track number |
| **Date Added** | Chronological by `added_at` timestamp | `order_index` |
| **Duration** | Track duration in ascending/descending order | Title |

---

## 6. Settings Workflow

Observed from `xpui-routes-desktop-settings.js` (`ev_7fef823bac6803863a50be9726b2dc1e93e362c6ef24544dc38fadc996f28d77`):

### 6.1 Audio Playback Settings
1. **Audio Normalization (`i.NORMALIZE_QUALITY`)**:
   - Toggle switch: Set the same volume level for all songs.
   - Prevents sudden jarring volume spikes between different mastering volumes.
2. **Audio Crossfade (`s.playback.audioCrossfade`)**:
   - Toggle switch + Slider: `0` to `12` seconds.
   - Smoothly fades out the ending track while fading in the next track.
3. **Gapless Playback (`t.playback.gapless`)**:
   - Toggle switch: Eliminates silence between consecutive tracks (crucial for continuous concept albums and live concerts).
4. **Automix / Autoplay (`desktop.settings.autoplay`)**:
   - Toggle switch: Automatically continue playing similar recommended tracks when your current queue finishes.
5. **Mono Audio Downmixing (`i.playback.monoAudio`)**:
   - Toggle switch: Combines left and right audio channels into a single mono output.

### 6.2 Display & Storage Options
1. **Compact Library**:
   - Toggle switch to display library sidebar items with condensed padding and smaller thumbnails.
2. **Friend Activity (`settings.showFriendActivity`)**:
   - Toggle right-hand sidebar displaying friend listening status.
3. **Storage & Cache (`desktop.settings.cache`)**:
   - Display cache size in MB/GB and "Clear cache" action button.

---

## 7. Service Boundaries: Spotify Proprietary vs. MELO Local Reconstructed

To achieve complete functional fidelity without unauthorized access to proprietary infrastructure, MELO establishes clear service boundaries:

```
+--------------------------------------------------------------------------+
| SPOTIFY PROPRIETARY DOMAIN                 MELO LOCAL EQUIVALENT         |
+------------------------------------------+-------------------------------+
| * PlayReady / Widevine Modular DRM       | * HTML5 Audio API (Unencrypted)|
| * Encrypted Ogg/AAC audio streams via    | * Royalty-free local sample   |
|   spclient.wg.spotify.com                |   tracks (.mp3 / .ogg / .wav) |
| * Spotify OAuth / Account Auth           | * Local offline profile       |
| * Cloud Hermod / SpClient Queue Sync     | * In-memory state machine     |
| * Cloud Playlist4 Protobuf Storage       | * Local persistent SQLite     |
| * Remote Elasticsearch Search API        | * Client-side tokenized search|
| * Dynamic remote algorithmic mixes       | * Curated local genre catalog |
+------------------------------------------+-------------------------------+
```

### Detailed Boundary Matrix

| Feature | Spotify Proprietary Behavior | MELO Local Implementation | Difference / Boundary Justification |
|---|---|---|---|
| **Audio Stream** | Encrypted chunks served via `spclient.wg.spotify.com`, decoded via EME KeySystems (`com.widevine.alpha`, `com.microsoft.playready`). | Native HTML5 `<audio>` / Web Audio API playing local audio files or bundled assets. | Prevents DRM bypass; ensures 100% legal, DRM-free playback of bundled sample music. |
| **Audio Quality** | Bitrate switching (96/160/320 kbps Vorbis/AAC) tied to Premium subscriptions. | Fixed high-quality sample playback (320kbps MP3 / lossless WAV/FLAC). | No backend subscription validation required. |
| **Catalog & Metadata** | Millions of cloud tracks indexed via Spotify Web API (`api.spotify.com/v1`). | Local catalog bundled in SQLite / `catalog.json` with sample tracks, covers, artists, and albums. | Self-contained offline catalogue; does not misrepresent itself as live Spotify catalog. |
| **User Authentication** | OAuth2 token exchange with `login.spa` and secure cookie credential blobs. | Default offline user profile (`"Local Listener"`). | No personal credential extraction or external account requirement. |
| **Playlist Storage** | Cloud sync across mobile/desktop via Spotify Playlist4 service. | SQLite database (`melo.db`) stored locally in `app.getPath('userData')`. | Complete persistence across restarts without network dependency. |
| **Liked Songs** | Syncs to cloud user collection library. | Stored in SQLite `liked_songs` table. | Fully persistent locally. |
| **Queue Management** | Synchronized across devices via Spotify Connect protocol. | Managed by Electron/React state machine. | Fast, responsive local queue with zero latency. |
| **Search Engine** | Cloud search cluster with typo tolerance and personalization. | In-memory client-side search with 300ms debounce across title, artist, album, and genre. | Instantaneous offline search without network roundtrips. |

---

## 8. Architecture of MELO Local Functional Equivalent

### 8.1 HTML5 Audio Playback Engine
MELO implements an original TypeScript audio engine wrapping standard Web Audio APIs:

```typescript
export class MeloAudioEngine {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private stateListeners: Array<(state: PlaybackState) => void> = [];

  constructor() {
    this.audio = new Audio();
    this.setupListeners();
  }

  public loadTrack(url: string, autoplay: boolean = true): void {
    this.audio.src = url;
    this.audio.load();
    if (autoplay) {
      this.audio.play().catch(console.error);
    }
  }

  public play(): void {
    this.audio.play().catch(console.error);
  }

  public pause(): void {
    this.audio.pause();
  }

  public seek(positionSeconds: number): void {
    this.audio.currentTime = positionSeconds;
  }

  public setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  public setMute(muted: boolean): void {
    this.audio.muted = muted;
  }

  private setupListeners(): void {
    this.audio.addEventListener('timeupdate', () => this.emitUpdate());
    this.audio.addEventListener('ended', () => this.emitEnded());
    this.audio.addEventListener('error', (e) => this.emitError(e));
  }
}
```

### 8.2 Local Catalogue & Metadata Format
Local tracks are structured with full metadata in JSON/SQLite:
```json
{
  "id": "trk_01_retro_groove",
  "title": "Retro Groove",
  "artist": "Synthwave Collective",
  "artistId": "art_synthwave",
  "album": "Neon Nights",
  "albumId": "alb_neon_nights",
  "durationMs": 214000,
  "coverUrl": "assets/covers/neon-nights.jpg",
  "audioUrl": "assets/audio/retro-groove.mp3",
  "genre": "Electronic / Synthwave",
  "releaseYear": 2024,
  "trackNumber": 1
}
```

### 8.3 Persistent SQLite Database Schema
The local database `melo.db` stores all user-modified library state:

```sql
-- 1. Application and Playback Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Playlists Metadata
CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    cover_url TEXT DEFAULT NULL,
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Playlist Tracks (Association & Ordering)
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_order ON playlist_tracks(playlist_id, order_index);

-- 4. Liked Songs Collection
CREATE TABLE IF NOT EXISTS liked_songs (
    track_id TEXT PRIMARY KEY NOT NULL,
    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Playback History
CREATE TABLE IF NOT EXISTS track_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id TEXT NOT NULL,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_played_ms INTEGER NOT NULL,
    completed INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_track_history_time ON track_history(played_at DESC);

-- 6. Offline Local Catalog Index (Pre-seeded tracks)
CREATE TABLE IF NOT EXISTS catalog_tracks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    genre TEXT DEFAULT 'General',
    cover_url TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    release_year INTEGER,
    track_number INTEGER DEFAULT 1
);
```

---

## 9. Conclusion & Implementation Recommendations for MELO

1. **Strict Service Boundary**: MELO will not attempt network connections to Spotify backend servers (`spclient.wg.spotify.com`, `apresolve.spotify.com`) or decode DRM-protected audio. It runs as a self-contained, offline-first desktop music player.
2. **HTML5 Audio Engine**: Must use a dual-tier progress tracker (`requestAnimationFrame` + `performance.now()`) to eliminate slider jitter, and implement the 3-second rewind rule on `previous()`.
3. **Two-Tier Queue**: Maintain separate `userQueue` (manual priority items) and `contextQueue` (active album/playlist), popping from `userQueue` first.
4. **SQLite Persistence**: Electron's main process manages `melo.db` via `better-sqlite3` or Node SQLite, exposed to the renderer via IPC (`contextBridge.exposeInMainWorld`).
5. **UI Fidelity**: Match dark theme tokens (`#121212` background, `#181818` card surfaces, `#282828` hover, `#1DB954` accent green) and typography defined in the Spotify UI specification.
