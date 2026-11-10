# MELO Desktop Application — E2E Testing Infrastructure Specification

**Document Version**: 1.0.0  
**Target Application**: MELO Desktop Music Streaming Application  
**Author**: E2E Testing Track Specialist (`teamwork_test_writer_e2e_1`)  
**Scope**: Tiers 1–4 Test Framework, Methodology, Feature Mapping, and Scenarios  
**Reference Sources**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, `reference/spotify-package-analysis.md`, `reference/spotify-ui-spec.md`, `reference/spotify-workflows-and-boundaries.md`, `evidence/evidence-register.csv`

---

## 1. Test Philosophy & Core Principles

The MELO test infrastructure is engineered according to the following foundational principles:

1. **Opaque-Box & Requirement-Driven**:
   - Tests assert strictly against observable behavior, public interfaces, and documented specifications.
   - Tests do **not** depend on private internal component states, internal variable names, or transient implementation choices.
   - All assertions trace directly to empirical findings from the Spotify reverse-engineering survey (Spotify UI Spec, State Machines, SQLite Schema, and REA Evidence Register).

2. **Strict Contract Verification**:
   - IPC Interface: Every operation defined in `IElectronAPI` (window controls, database queries, settings) has deterministic input/output and error contract guarantees.
   - Audio Engine Interface: Every method in `IAudioEngine` (playback state transitions, queue mutations, shuffle math, volume clamping, 3.0s rewind threshold) is validated against mathematical invariants and empirical rules.
   - UI & DOM Invariants: Selectors and accessibility roles (`button`, `slider`, `navigation`, `table`, `dialog`, `menu`) conform to the Encore design tokens and layout geometry documented in `reference/spotify-ui-spec.md`.

3. **Progressive Testability & Isolation**:
   - Every test is self-contained: sets up its own isolated state (in-memory SQLite, fresh queue/audio instances, clean browser contexts) and cleans up afterwards.
   - Zero side-effects or inter-test ordering dependencies.
   - Fast execution: unit and integration tests run in milliseconds without external network calls.

4. **Adversarial & Edge-Case Integrity**:
   - Rigorous validation of boundary values (0s, 3s rewind threshold, 100% volume, mute state preservation).
   - Character escaping, special characters, and SQL injection safety for user input (playlist names, search queries).
   - Concurrent action handling (rapid toggling, double clicking, asynchronous race condition resistance).

---

## 2. Testing Methodology across Tiers 1–4

The testing architecture organizes verification into four distinct, cumulative tiers:

```
+-------------------------------------------------------------------------+
| Tier 4: Real-World Workflows (E2E Multi-step Journeys & Session Tests)  |
+-------------------------------------------------------------------------+
| Tier 3: Cross-Feature Combinations (Pairwise Combinatorial Matrix)       |
+-------------------------------------------------------------------------+
| Tier 2: Boundary & Corner Cases (BVA, Limits, Empty Inputs, Stress)    |
+-------------------------------------------------------------------------+
| Tier 1: Feature Coverage (Category-Partition Testing across all Core)    |
+-------------------------------------------------------------------------+
```

### 2.1 Tier 1: Feature Coverage (Category-Partition Testing)
- **Objective**: Systematic coverage of primary happy-path behavior for every functional component.
- **Criteria**: $\ge 5$ distinct test cases per feature across all core features.
- **Methodology**: The input and execution domain of each feature is partitioned into non-overlapping equivalence classes. For each class, at least one deterministic test case exercises expected behavior.
- **Scope**:
  - Window controls (minimize, maximize, close, isMaximized)
  - Layout structure (3-panel layout, resizable sidebar [232px–420px], sticky player bar)
  - Navigation (History back/forward, Top bar search pill, avatar)
  - Core views (Home shelves, Search/Browse categories, Library view, Playlist view, Album view, Artist view, Liked Songs, Settings)
  - Modal dialogs (Create/Edit playlist modal, context menus)
  - Audio engine state machine (`IDLE` -> `LOADING` -> `PLAYING` -> `PAUSED` -> `ENDED`)
  - Two-tier queue mechanics (User priority queue vs Context active queue)
  - Transport controls (Play/Pause, Next, Previous, Volume, Mute, Seek)
  - SQLite persistence (Playlists CRUD, playlist tracks order, liked songs, settings)

### 2.2 Tier 2: Boundary Value Analysis & Corner Cases (BVA)
- **Objective**: Exhaustive verification of boundary values, extreme inputs, limits, and stress conditions.
- **Criteria**: $\ge 5$ boundary/corner cases per feature.
- **Scope**:
  - **The 3.0-Second Rule**: If `currentPositionMs > 3000ms`, `previous()` rewinds current track to `0:00`. If `currentPositionMs <= 3000ms`, `previous()` navigates to the previous historical track (or restarts if at track 0).
  - **Volume & Mute Bounds**: Exact boundaries at `0.0`, `1.0`, `< 0.0` (clamped to 0.0), `> 1.0` (clamped to 1.0). Muting preserves exact pre-mute volume; unmuting restores prior non-zero volume; adjusting slider while muted restores unmuted state at new level.
  - **Input String Limits & Empty States**: Empty playlist name, whitespace-only names, maximum 100-character playlist name truncation, 300-character description limits, search with empty string, special unicode characters, emojis, and SQL injection strings (`'; DROP TABLE playlists; --`).
  - **Queue Boundaries**: Empty user queue, queue with 1 item, queue with 100+ items, advancing past end of context queue with repeat `OFF` vs repeat `ALL`.
  - **Sidebar Resizing Bounds**: Clamping strictly between minimum `232px` and maximum `420px`.
  - **Rapid Toggling / Concurrency**: Rapid consecutive clicks on play/pause (debouncing), rapid next/previous skips, fast shuffle toggling without track dropping.

### 2.3 Tier 3: Cross-Feature Combinations (Pairwise Combinatorial Testing)
- **Objective**: Verify that independent features interact harmoniously without race conditions or state corruption.
- **Methodology**: Orthogonal pairwise combinatorial testing covering critical multi-feature intersections:
  - **Combination A (Shuffle + Repeat + Two-Tier Queue)**:
    - User Queue tracks must take priority over context queue even when shuffle is active.
    - Shuffle randomizes only the context queue, never the user queue.
    - If Repeat is set to `ONE`, repeating the active track preserves pending user queue items.
    - If Repeat is set to `ALL`, advancing through the user queue empties it, then loops through the shuffled context queue.
  - **Combination B (Playlist Deletion During Active Playback)**:
    - When a user deletes a playlist while a track from that playlist is currently playing, playback continues smoothly from memory buffer without crashing.
    - Associated `playlist_tracks` are cascade-deleted in SQLite.
  - **Combination C (Search & Filter During Active Playback)**:
    - User types a search query with live 300ms debounce while audio is playing.
    - Adding a search result to the queue enqueues into User Queue without interrupting current audio stream.
  - **Combination D (Liked Songs Heart Sync Across Panels)**:
    - Clicking the heart icon in the bottom player bar immediately updates the corresponding track row heart in the main canvas and reflects in the Liked Songs view.
  - **Combination E (Queue Reorder During Playback Transition)**:
    - User drags/reorders User Queue items precisely when active track emits `ended`.

### 2.4 Tier 4: Real-World Workflows (End-to-End User Journeys)
- **Objective**: Simulate realistic, uninterrupted end-to-end user workflows from app launch to teardown.
- **Methodology**: Multi-step scenario scripts validating real-world session flows, state preservation, and data integrity.
- **Scenarios**:
  - **Scenario 1**: *The New Listener Discovery Journey*
  - **Scenario 2**: *The Playlist Curator & Library Builder Journey*
  - **Scenario 3**: *The Power Listener Workout & Queue Management Journey*
  - **Scenario 4**: *The Offline Session & Application State Persistence Journey*

---

## 3. Comprehensive Feature Inventory & Tier Mapping

| # | Feature Name | Component / Domain | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Combinations) | Tier 4 (Scenarios) | Test File Location |
|---|---|---|:---:|:---:|:---:|:---:|---|
| F1 | Electron Shell & Window Controls | Main / IPC | 5 cases | 5 cases | 2 cases | S1, S4 | `tests/integration/ipc-handlers.test.ts` |
| F2 | Encore Tokens & Theming | Renderer / CSS | 5 cases | 5 cases | 2 cases | S1, S2 | `tests/e2e/ui-navigation.spec.ts` |
| F3 | MELO Branding & Visual Identity | Layout / Header | 5 cases | 5 cases | 1 case | S1 | `tests/e2e/ui-navigation.spec.ts` |
| F4 | 3-Panel Layout & Resizing | Layout / Sidebar | 5 cases | 5 cases | 2 cases | S1, S2 | `tests/e2e/ui-navigation.spec.ts` |
| F5 | Top Navigation & History | Navigation | 5 cases | 5 cases | 3 cases | S1, S2, S4 | `tests/e2e/ui-navigation.spec.ts` |
| F6 | Home View Shelves & Grids | Views / Home | 5 cases | 5 cases | 2 cases | S1 | `tests/e2e/views-rendering.spec.ts` |
| F7 | Search View & Live Debounce | Views / Search | 6 cases | 6 cases | 3 cases | S1, S2 | `tests/e2e/search-and-filter.spec.ts` |
| F8 | Library View & Filter Chips | Views / Library | 5 cases | 5 cases | 2 cases | S2, S4 | `tests/integration/library-filtering.test.ts` |
| F9 | Playlist Detail & Track Table | Views / Playlist | 6 cases | 6 cases | 3 cases | S2, S3 | `tests/e2e/playlist-management.spec.ts` |
| F10 | Album & Artist Views | Views / Detail | 5 cases | 5 cases | 2 cases | S1 | `tests/e2e/views-rendering.spec.ts` |
| F11 | Liked Songs View & Persistence | Views / SQLite | 5 cases | 5 cases | 3 cases | S2, S4 | `tests/integration/database-crud.test.ts` |
| F12 | Settings View & Preferences | Views / Settings | 5 cases | 5 cases | 2 cases | S4 | `tests/e2e/settings-and-modals.spec.ts` |
| F13 | Create / Edit Playlist Modal | Modals | 5 cases | 6 cases | 3 cases | S2, S4 | `tests/e2e/settings-and-modals.spec.ts` |
| F14 | Track Context Menus | Context Menu | 5 cases | 5 cases | 3 cases | S2, S3 | `tests/e2e/settings-and-modals.spec.ts` |
| F15 | HTML5 Audio Engine States | Audio Engine | 6 cases | 6 cases | 4 cases | S3 | `tests/unit/audio-engine.test.ts` |
| F16 | Volume Slider & Mute Memory | Player Bar | 5 cases | 6 cases | 2 cases | S3 | `tests/unit/audio-engine.test.ts` |
| F17 | Shuffle & Repeat Math | Audio Engine | 6 cases | 6 cases | 4 cases | S3 | `tests/unit/shuffle-repeat.test.ts` |
| F18 | Two-Tier Queue Logic | Queue Manager | 6 cases | 6 cases | 4 cases | S3 | `tests/unit/queue-manager.test.ts` |
| F19 | Previous / Next 3.0s Logic | Transport | 6 cases | 6 cases | 3 cases | S3 | `tests/unit/audio-engine.test.ts` |
| F20 | SQLite Schema & Constraints | SQLite DB | 6 cases | 6 cases | 3 cases | S2, S4 | `tests/unit/sqlite-schema.test.ts` |
| F21 | SQLite CRUD & Cascading | SQLite DB | 6 cases | 6 cases | 3 cases | S2, S4 | `tests/integration/database-crud.test.ts` |
| F22 | Playlist Track Ordering & DnD | SQLite / Queue | 5 cases | 5 cases | 3 cases | S2 | `tests/integration/playlist-tracks.test.ts` |
| **TOTAL** | **22 Core Functional Features** | **All Modules** | **118** | **122** | **58** | **4 Journeys** | **All 9 Test Files** |

---

## 4. Test Runner Invocation Commands

### 4.1 Vitest Unit & Integration Suites
Vitest executes unit tests and integration tests with fast in-memory execution and TypeScript support.

```bash
# Run all unit and integration tests
npm test

# Run Vitest in single-run mode
npx vitest run

# Run only unit test suites
npx vitest run tests/unit

# Run only integration test suites
npx vitest run tests/integration

# Run a specific test suite with verbose output
npx vitest run tests/unit/audio-engine.test.ts --reporter=verbose

# Run tests with code coverage report
npx vitest run --coverage
```

### 4.2 Playwright End-to-End (E2E) Suites
Playwright executes full desktop browser/electron scenario tests.

```bash
# Run all Playwright E2E tests in headless mode
npx playwright test

# Run a specific E2E spec
npx playwright test tests/e2e/ui-navigation.spec.ts

# Run tests with headed browser UI for visual inspection
npx playwright test --headed

# Run tests with trace recording enabled for post-mortem analysis
npx playwright test --trace on

# View interactive HTML test report
npx playwright show-report
```

---

## 5. Detailed Real-World Application Scenarios (Tier 4)

### 5.1 Scenario 1: The New Listener Discovery Journey
1. **Launch**: Application launches in desktop window (`1200x800`). Top bar shows MELO monogram and wordmark.
2. **Home Exploration**: User views Home screen. Context greeting displays according to local time. Recent 6-card grid and curated shelves render with album art.
3. **Category Browse**: User clicks "Search" in top bar. 8 category gradient tiles render. User clicks "Music" category.
4. **Live Search**: User types `"synth"` into the top search bar. Wait 300ms for debounce. Instant results display top result, matching songs, and albums.
5. **Playback Initiation**: User clicks Play on top matching song `"Retro Groove"`.
6. **Verification**: Bottom player bar transitions to `PLAYING`. Artwork, title `"Retro Groove"`, and artist `"Synthwave Collective"` display. Green play button toggles to pause icon. Elapsed time increments.

### 5.2 Scenario 2: The Playlist Curator & Library Builder Journey
1. **Create Playlist**: User clicks `+` icon in sidebar. New playlist `"My Playlist #1"` is created and opened.
2. **Edit Details**: User opens Edit Playlist modal. Enters name `"Synthwave Chill 2026"`, description `"Deep focus electronic sounds"`, and clicks "Save".
3. **Search & Add Tracks**: User navigates to Search, searches for `"Neon"`, right-clicks song row -> `"Add to playlist"` -> selects `"Synthwave Chill 2026"`.
4. **Add More Tracks**: User adds 2 additional tracks via context menu.
5. **Reorder Tracks**: User changes sort order to Custom, drags track 3 to position 1. Order indexes update in SQLite.
6. **Like Tracks**: User clicks Heart icon on track 2. Heart turns filled green `#1ED760`.
7. **Verification**: Liked Songs counter increments to 1. Tracklist displays 3 tracks with correct durations. Navigating to Liked Songs reveals the newly liked track.

### 5.3 Scenario 3: The Power Listener Workout & Queue Management Journey
1. **Queue Population**: From an album view, user right-clicks 3 different tracks and selects `"Add to Queue"`.
2. **Inspect Queue**: User clicks Queue icon in player bar. Right details panel opens showing:
   - "Now Playing": Current track.
   - "Next in Queue": The 3 user-enqueued tracks (Priority 1).
   - "Next from [Album]": Subsequent album tracks (Priority 2).
3. **Shuffle & Repeat**: User enables Shuffle (`true`). Context tracks are randomized using Fisher-Yates, but User Queue remains strictly in priority order. User cycles Repeat button to `ALL`.
4. **Audio Scrubbing**: User seeks to `50%` of track duration. Elapsed time updates instantly.
5. **Test 3.0s Rule**:
   - Current position is at `120s` (>3.0s). User clicks "Previous". Track rewinds to `0:00` without skipping back.
   - User clicks "Previous" again at `0:01` (<=3.0s). Previous historical track starts playing.
6. **Next Skip**: User clicks "Next". User Queue head track plays and is removed from User Queue.
7. **Clear Queue**: User clicks "Clear Queue". Remaining user queue items are flushed; playback seamlessly falls back to the shuffled context queue.

### 5.4 Scenario 4: The Offline Session & Application State Persistence Journey
1. **Settings Configuration**: User navigates to Settings screen (`/settings`).
   - Normalization toggle set to `true`.
   - Audio quality dropdown set to `"Very High"`.
   - Dark theme preference verified.
2. **Library Customization**: User creates 2 custom playlists, likes 5 songs, and adjusts volume to `0.42`.
3. **Simulate Application Restart**: Database connection is closed and re-opened. State stores reload from SQLite.
4. **Persistence Assertions**:
   - `dbGetPlaylists()` returns both custom playlists with identical metadata.
   - `dbGetLikedSongs()` returns all 5 tracks.
   - `dbGetSettings()` returns normalization: true, quality: "Very High".
   - Mute memory retains prior volume `0.42`.
   - No data loss or schema corruption detected.

---

## 6. Verification & Traceability Matrix

| Test Suite File | Test Count | Target Contract / Module | REA Evidence Link |
|---|:---:|---|---|
| `tests/unit/audio-engine.test.ts` | 24 | `IAudioEngine`, HTML5 Audio, 3.0s rule, volume/mute | `ev_32c0e37d56fa6d0fca8fb3e97161fbb18e875ccb309b1de07e339c88cbb3b546` |
| `tests/unit/queue-manager.test.ts` | 20 | Two-tier priority queue (User vs Context) | `ev_fb2027753126a31c5df67b7e7dc2120e6781d77779004fe67a62c22979035c75` |
| `tests/unit/shuffle-repeat.test.ts` | 20 | Fisher-Yates shuffle math, Tri-state repeat cycle | `ev_fb2027753126a31c5df67b7e7dc2120e6781d77779004fe67a62c22979035c75` |
| `tests/unit/sqlite-schema.test.ts` | 22 | SQLite tables, indexes, constraints, cascades | `ev_86ac51c55b86aa2b5bf3ace7af59da4813d6ef326f6129e294715bb00ef724f9` |
| `tests/integration/ipc-handlers.test.ts` | 22 | `IElectronAPI` main-renderer IPC contract | `ev_2b0304c8582794427b60479cde6adfe6bb8e2d8a24d7e8f6a186e045f7363b26` |
| `tests/integration/database-crud.test.ts` | 24 | SQLite CRUD, liked songs, cascades, settings | `ev_86ac51c55b86aa2b5bf3ace7af59da4813d6ef326f6129e294715bb00ef724f9` |
| `tests/integration/playlist-tracks.test.ts` | 18 | Playlist track ordering, reordering, custom sort | `ev_b84d62ad21c339de3a855f8c8b98a12df9a78037730ca01f9de6d8edb2fcfba4` |
| `tests/integration/library-filtering.test.ts` | 18 | Sidebar filters, sorting modes, live debounce | `ev_0ecbe2e11e3e38ced216c0356f5948426069a66b16f74ffbb95ca716431b9591` |
| `tests/e2e/ui-navigation.spec.ts` | 20 | Window controls, 3-panel layout, history, branding | `ev_a3e909458780d919463a9da69b879c201f7bef8fbdb2a411323e785e7734cbf5` |
| `tests/e2e/views-rendering.spec.ts` | 20 | Home, Search, Browse, Album, Artist views | `ev_67591f962707fc667ad9bb4ca3ec7044f78c25fe65b584f548efce6e7ab8c8af` |
| `tests/e2e/playlist-management.spec.ts` | 20 | Playlist creation, track table, heart toggle, delete | `ev_3b1abb1762791595e8188a190e401826705f8c0c8b6ae166966b382a82aa92d1` |
| `tests/e2e/search-and-filter.spec.ts` | 20 | Search input, debounce 300ms, filter chips, results | `ev_0ecbe2e11e3e38ced216c0356f5948426069a66b16f74ffbb95ca716431b9591` |
| `tests/e2e/settings-and-modals.spec.ts` | 20 | Settings toggles, modal dialogs, context menus | `ev_3e9b6550baceed786862396f756f86da01f9396e4facaebc2932427d2aa85bd8` |
| **TOTAL** | **254** | **Full Verification Across Tiers 1–4** | **All 18 REA Evidence Citations** |
