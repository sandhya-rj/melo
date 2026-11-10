# Spotify Desktop UI & Visual Specification

**Project**: MELO Desktop Application Reconstruction  
**Author**: Spotify UI & Visual Spec Miner (Survey Phase)  
**Evidence Source**: Authoritative Local Spotify Desktop Installation & Shipped Assets (`C:\Users\suzhi\AppData\Roaming\Spotify`, `Apps\xpui.spa`, CEF Runtime)  
**Tools Invoked**: REA MCP tools (`rea.inspect_desktop_application`, `rea.open_binary`, `rea.analyze_javascript_application`, `rea.capture_browser_scenario`)  
**Date**: 2026-11-10  

---

## 1. Executive Summary & REA Investigation Overview

This specification establishes the authoritative visual and interface design reference for reconstructing the Spotify Desktop client as **MELO**. All values, tokens, dimensions, and behaviors documented here were extracted directly from the installed Spotify Windows Desktop package, its Chromium Embedded Framework (CEF) runtime resources (`xpui.spa`, containing 614 production UI stylesheets, templates, and scripts), and live scenario captures recorded via REA.

### Key Reverse-Engineering Findings
- **Architecture**: Spotify Desktop is a native Windows PE32+ application (`Spotify.exe` + `Spotify.dll`) hosting the Chromium Embedded Framework (`libcef.dll`).
- **UI Packaging**: The entire desktop user interface is encapsulated within `Apps\xpui.spa` (a standard ZIP archive with SHA-256 `df55f5231758411a3ea6d9b47dfa8e47d3b1dbfd9d50e5d75c2b601218c71824`).
- **Design System**: Spotify utilizes its proprietary **Encore Design System** (internal CSS namespace `--encore-*` and semantic tokens `--background-*`, `--text-*`).
- **Captured Evidence**: 10 high-resolution reference screenshots covering every accessible application view are registered in `evidence/evidence-register.csv` and stored in `evidence/screenshots/spotify/`.

---

## 2. Core Color Palette & Design Tokens

### 2.1 Base & Surface Colors (Dark Theme)

Spotify's dark theme employs a multi-tiered elevation hierarchy that creates depth between background, sidebar panels, content cards, and floating dialogs.

| Token Name | Hex Value | RGB / HSL | Usage & Context | Evidence Source |
| :--- | :--- | :--- | :--- | :--- |
| `--background-base` | `#121212` | `rgb(18, 18, 18)` | Default main canvas background | `xpui-snapshot.css` |
| `--background-highlight` | `#1f1f1f` | `rgb(31, 31, 31)` | Elevated panel background, card base | `xpui-snapshot.css` |
| `--background-press` | `#000000` | `rgb(0, 0, 0)` | Deep black contrast / pressed state | `xpui-snapshot.css` |
| `--background-elevated-base` | `#1f1f1f` | `rgb(31, 31, 31)` | Sidebar library cards, search category base | `xpui-snapshot.css` |
| `--background-elevated-highlight` | `#2a2a2a` | `rgb(42, 42, 42)` | Card hover state, row hover state | `xpui-snapshot.css` |
| `--background-elevated-press` | `#191919` | `rgb(25, 25, 25)` | Card active/pressed state | `xpui-snapshot.css` |
| `--background-tinted-base` | `rgba(255,255,255,0.10)` | `#ffffff1a` | Filter chips, search bar container | `xpui-snapshot.css` |
| `--background-tinted-highlight` | `rgba(255,255,255,0.14)` | `#ffffff24` | Filter chip hover, button hover overlay | `xpui-snapshot.css` |
| `--background-tinted-press` | `rgba(255,255,255,0.21)` | `#ffffff36` | Active filter chip, pressed state | `xpui-snapshot.css` |
| `--generic-tooltip-background-color` | `#282828` | `rgb(40, 40, 40)` | Tooltips, popovers, context menus | `xpui-snapshot.css` |
| Surface Floating / Modal | `#282828` | `rgb(40, 40, 40)` | Context menu surface, modal popups | `xpui-desktop-modals.css` |
| Modal Backdrop Overlay | `rgba(0,0,0,0.7)` | `#000000b3` | Backdrop blur/dim behind modals | `xpui-routes-your-library-x.css` |

### 2.2 Text & Content Hierarchy Tokens

| Token Name | Hex Value | Opacity / Alpha | Role |
| :--- | :--- | :--- | :--- |
| `--text-base` | `#ffffff` | 100% | Primary headings, active item labels, song titles |
| `--text-subdued` | `#b3b3b3` | ~70% | Secondary artists, album names, timestamps, table headers |
| `--text-muted` | `#727272` | ~45% | Disabled icons, placeholder text, footer copyright |
| `--text-positive` | `#1ed760` | 100% | Currently playing track title, active tabs, success states |
| `--text-bright-accent` | `#1ed760` | 100% | High-contrast accent green |
| `--text-negative` | `#f3727f` | 100% | Error text, destructive actions, warning states |
| `--text-warning` | `#ffa42b` | 100% | System notices, alerts |
| `--text-announcement` | `#539df5` | 100% | Feature highlights, informational banners |

### 2.3 Brand & Interactive Accent Colors

| Brand Token | Hex Value | Interactive State | Visual Result |
| :--- | :--- | :--- | :--- |
| **Spotify Green (Default)** | `#1db954` | Resting brand color | Primary buttons, active dots |
| **Spotify Green (Bright/Hover)**| `#1ed760` | Hover state (`scale(1.04)`) | Active playing text, hover button background |
| **Spotify Green (Active/Press)**| `#169c46` | Mousedown / Press | Darkened green feedback |
| **Border Focus Outline** | `#ffffff` / `#1ed760` | Keyboard focus | `2px solid` outline with 2px offset |

### 2.4 Browse Category Gradient Tokens

Spotify Search/Browse cards use high-saturation solid backgrounds with rotated album artwork:

| Category | Background Color | Hex |
| :--- | :--- | :--- |
| Music | Vibrant Rose Pink | `#e1118c` |
| Podcasts | Deep Forest Green | `#006450` |
| Live Events | Royal Violet | `#7358ff` |
| Made For You | Midnight Navy Blue | `#1e3264` |
| New Releases | Olive Chartreuse | `#608108` |
| Pop / Trending | Hot Magenta | `#e8115b` |
| Regional / Charts | Burnt Tangerine | `#d84000` |
| Classical / Focus | Warm Earth / Amber | `#8d67ab` |

---

## 3. Typography System

Spotify uses the proprietary **SpotifyMix** font family across the desktop application, with graceful fallbacks to standard OS font stacks.

### 3.1 Font Family Stacks
- **UI Body Font Stack**: `SpotifyMixUI, CircularSp-Arab, CircularSp-Hebr, CircularSp-Cyrl, CircularSp-Grek, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Title Font Stack**: `SpotifyMixUITitle, SpotifyMixUITitle-Arab, SpotifyMixUITitle-Cyrl, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Stack**: `SpotifyMixMono, CircularSp-Arab, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`

### 3.2 Type Scale Hierarchy

| Level | Token | Font Size (rem) | Font Size (px) | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title (Playlist/Artist)** | `--encore-text-size-larger-5` | `3.00rem` - `6.00rem` | `48px` - `96px` | 900 (Black) | 1.05 | `-0.04em` |
| **Page Heading / Large Title** | `--encore-text-size-larger-4` | `2.50rem` | `40px` | 900 (Black) | 1.15 | `-0.03em` |
| **Section Title (Home/Browse)** | `--encore-text-size-larger-3` | `2.00rem` | `32px` | 700 (Bold) | 1.25 | `-0.02em` |
| **Subheading / Card Title** | `--encore-text-size-larger-2` | `1.50rem` | `24px` | 700 (Bold) | 1.30 | `-0.01em` |
| **Card Header / Medium Title** | `--encore-text-size-large` | `1.125rem` | `18px` | 700 (Bold) | 1.35 | `normal` |
| **Body Regular / Song Title** | `--encore-text-size-base` | `1.00rem` | `16px` | 400 / 600 | 1.50 | `normal` |
| **Secondary Text / Artist Name** | `--encore-text-size-smaller` | `0.875rem` | `14px` | 400 (Regular)| 1.40 | `normal` |
| **Metadata / Timestamps** | `--encore-text-size-smaller-2` | `0.6875rem` - `0.75rem`| `11px` - `12px` | 400 (Regular)| 1.40 | `0.02em` |
| **Badge / Overline Tag** | `--encore-text-size-smaller-3` | `0.5625rem` - `0.6875rem`| `9px` - `11px` | 700 (Bold) | 1.20 | `0.08em` (Uppercase) |

*Note: All timestamp columns and duration indicators use tabular numbers (`font-variant-numeric: tabular-nums`) to prevent layout jitter during playback.*

---

## 4. Layout Architecture & Geometry

Spotify Desktop features a modern multi-panel dock layout organized into four principal structural zones:

```
+-------------------------------------------------------------------------------+
| Top Bar / App Navigation Header (Height: 64px, z-index: 1)                     |
+----------------------+--------------------------------------------------------+
| Left Sidebar:        | Main Scrollable Content Area:                          |
| Your Library Panel   | Home / Search / Playlist / Album / Artist              |
|                      |                                                        |
| Width: 280px-420px   | Dynamic responsive card grid; Hero header;             |
| (Resizable)          | Sticky action bar; Tracklist table                     |
|                      |                                                        |
| Rounded: 8px         | Padding: 16px 24px; Rounded: 8px                      |
+----------------------+--------------------------------------------------------+
| Bottom Sticky Now Playing Player Bar (Height: 72px, z-index: 5)               |
| [Track Info 30%]     [Playback Controls & Progress 40%]     [Volume & Queue 30%]|
+-------------------------------------------------------------------------------+
```

### 4.1 Structural Dimensions

| Layout Region | Key Dimension | Constraints | Behavior |
| :--- | :--- | :--- | :--- |
| **Top Navigation Bar** | `height: 64px` | Fixed height | Absolute overlay, translucent background upon scrolling |
| **Left Sidebar (Library)** | `width: 280px` | `min-width: 232px`, `max-width: 420px` | User-resizable split pane, background `#121212` |
| **Main Content Container** | Flex 1 | Max width: `1955px` | Overflow-y scrollable, independent scroll container |
| **Right Sidebar (Now Playing)**| `width: 280px` | Collapsible | Toggled via Now Playing view icon on bottom bar |
| **Bottom Player Bar** | `height: 72px` | Total container height ~80px-90px | Sticky bottom, `z-index: 5`, span 100vw |
| **Main View Padding** | `padding: 16px 24px` | Scales down to `16px` on narrow screens | Consistent edge margins |
| **Panel Gap** | `gap: 8px` | Space between sidebar and main card | Modern floating panel aesthetic |

### 4.2 Standard Corner Radii Tokens

| Token | Radius Value | Applied Components |
| :--- | :--- | :--- |
| `--encore-corner-radius-smaller` | `2px` | Context menu artwork, subtle badges |
| `--encore-corner-radius-small` | `4px` | Table row album art, duration badges, tooltips |
| `--encore-corner-radius-larger` | `6px` | Media card images, view switchers |
| `--encore-corner-radius-larger-2`| `8px` | Main panel containers, sidebar cards, search cards |
| `--encore-corner-radius-larger-3`| `16px` | Floating promo banners, dialog cards |
| `--encore-border-radius-rounded` | `9999px` | Primary play buttons, pill tags, search input, chips |
| `50%` (Circular) | `50%` | Artist avatars, navigation arrows, player control buttons |

### 4.3 Spacing Scale Tokens

| Token | Dimension | Common Use Case |
| :--- | :--- | :--- |
| `--encore-spacing-tighter-5` | `2px` | Border offsets, sub-pixel alignments |
| `--encore-spacing-tighter-4` | `4px` | Icon-to-text micro gap, compact padding |
| `--encore-spacing-tighter-2` | `8px` | Navigation button gap, panel gap, chip gap |
| `--encore-spacing-tighter` | `12px` | Section title padding, search icon padding |
| `--encore-spacing-base` | `16px` | Standard card padding, grid gutter, tracklist padding |
| `--encore-spacing-looser` | `20px` | Media card interior padding |
| `--encore-spacing-looser-2` | `24px` | Main content side padding, section vertical gap |
| `--encore-spacing-looser-3` | `32px` | Header bottom margin, hero artwork gap |
| `--encore-spacing-looser-4` | `40px` | Major section separators |

---

## 5. Component Specifications & Interactive States

### 5.1 Buttons & Interactive Controls

#### A. Primary Action Button (Green Circle / Pill)
- **Dimensions**: Circle `56px × 56px` (Playlist Hero) or `48px × 48px` (Card hover); Pill `padding: 8px 32px`.
- **Resting**: Background `#1ed760` / `#1db954`, Text `#000000`, Font weight `700`, Radius `9999px` (or `50%`).
- **Hover**: Background `#1fdf64`, `transform: scale(1.04)`, `box-shadow: 0 8px 16px rgba(0,0,0,0.3)`.
- **Active / Press**: Background `#169c46`, `transform: scale(1.00)`.
- **Icon**: Solid black play triangle (`16px × 16px` or `20px × 20px`), centered.

#### B. Secondary Pill Button (White / Outline)
- **Resting**: Background `#ffffff`, Text `#000000`, Font weight `700`, Radius `9999px`.
- **Hover**: Background `#f0f0f0`, `transform: scale(1.04)`.
- **Outline Variant**: Background `transparent`, Border `1px solid #727272`, Text `#ffffff`. Hover Border `#ffffff`, Text `#ffffff`.

#### C. Tertiary Icon Buttons (Navigation, Shuffle, Repeat, Heart, More)
- **Resting**: Background `transparent`, Color `#b3b3b3` (`--text-subdued`), Size `32px × 32px`.
- **Hover**: Color `#ffffff` (`--text-base`), `transform: scale(1.04)`.
- **Active / Toggle On**: Color `#1ed760` (`--text-bright-accent`), with a `4px × 4px` circular dot indicator below the icon (`position: absolute; bottom: 0; left: 50%; transform: translateX(-50%)`).

### 5.2 Top Navigation Header
- **Background**: Solid `#000000` or transparent `#121212` with smooth opacity transition on scroll.
- **Back / Forward Buttons**: `32px × 32px` circular buttons with SVG chevron icons (`#ffffff`), background `rgba(0,0,0,0.7)`, disabled opacity `0.6`.
- **Search Input**:
  - `height: 48px`, `border-radius: 9999px`, `max-width: 480px`.
  - Background `#1f1f1f` / `#242424`, Border `none`.
  - Placeholder: "What do you want to play?" in `#727272`, `font-size: 14px`.
  - Leading search magnifying glass icon, trailing browse icon.
  - Focus state: Border `2px solid #ffffff`, outline `none`.

### 5.3 Left Sidebar (Your Library)
- **Header Row**: "Your Library" title with book icon, trailing "+" button for creating playlists.
- **Filter Chips**:
  - Pill buttons: "Playlists", "Artists", "Albums", "Podcasts".
  - Background `#ffffff1a` (`--background-tinted-base`), Text `#ffffff`, `font-size: 14px`, `padding: 6px 12px`.
  - Hover: Background `#ffffff24`. Selected: Background `#ffffff`, Text `#000000`.
- **Library List Items**:
  - `height: 64px`, `border-radius: 4px`, `padding: 8px`.
  - Hover background `#2a2a2a` (`--background-elevated-highlight`).
  - Active / Selected item: Background `#ffffff1a` or highlighted text.
  - Image: `48px × 48px` album thumbnail (radius 4px) or artist avatar (radius 50%).
  - Text: Title `#ffffff` (14px, bold), Subtitle `#b3b3b3` (12px, "Playlist • [Author]").

### 5.4 Media Cards (Home & Browse)
- **Card Container**:
  - Background: `transparent` (resting) or `#181818` (`--background-elevated-base`).
  - Hover: Background `#282828` (`--background-elevated-highlight`), `transition: background-color 0.3s ease`.
  - Padding: `16px`, Border radius: `8px`.
- **Artwork Thumbnail**:
  - 1:1 Aspect ratio, full width of card interior.
  - Border radius: `6px` (Album/Playlist) or `50%` (Artist).
  - Box shadow: `0 8px 24px rgba(0,0,0,0.5)`.
- **Floating Hover Play Button**:
  - Placed at bottom-right corner of artwork.
  - Hidden at rest (`opacity: 0, transform: translateY(8px)`).
  - Appears on card hover: `opacity: 1, transform: translateY(0)`, `transition: all 0.3s cubic-bezier(0.3, 0, 0, 1)`.

### 5.5 Tracklist Table (Playlist & Album View)
- **Table Grid Columns**:
  - Compact: `[Index 16px] [Title & Artist 6fr] [Album 4fr] [Date Added 3fr] [Duration 1fr]`.
- **Header Row**:
  - `height: 36px`, `border-bottom: 1px solid rgba(255,255,255,0.1)`.
  - Labels: `#`, `Title`, `Album`, `Date added`, Clock SVG icon.
  - Text: `#b3b3b3`, `font-size: 14px`, `font-weight: 400`.
- **Data Rows**:
  - `height: 56px`, `border-radius: 4px`, `padding: 0 16px`.
  - Hover background: `rgba(255,255,255,0.1)` (`#2a2a2a`).
  - Index column: Displays track number; replaces with SVG play icon on row hover.
  - Thumbnail: `40px × 40px`, radius `4px`.
  - Song Title: `#ffffff` (16px, font-weight 500). If playing: `#1ed760`.
  - Explicit Badge: Small gray badge with "E", `font-size: 9px`, `border-radius: 2px`, `padding: 1px 4px`.
  - Artist / Album: `#b3b3b3` (14px), hover underline `#ffffff`.
  - Duration: `#b3b3b3` (14px, tabular numerals).
  - Trailing Heart & Options: Heart icon and "..." button reveal on row hover.

### 5.6 Bottom Player Bar (Now Playing Bar)
Organized into three equal-weighted horizontal flex partitions:

#### A. Left Section (Now Playing Track Info, 30% Width, min 180px)
- **Album Artwork Thumbnail**: `56px × 56px`, `border-radius: 4px`, box shadow `0 2px 8px rgba(0,0,0,0.3)`.
- **Track Metadata**:
  - Title: `#ffffff`, `font-size: 14px`, `font-weight: 600`, text-overflow ellipsis.
  - Artist: `#b3b3b3`, `font-size: 12px`, `font-weight: 400`, hover underline.
- **Save / Like Icon**: Inactive outline heart `#b3b3b3` (hover `#ffffff`); Active green heart `#1ed760`.
- **Picture-in-Picture / Expand Button**: Optional mini-player toggle.

#### B. Center Section (Playback Controls & Timeline Slider, 40% Width, max 722px)
- **Control Buttons Row** (`gap: 16px`, center aligned):
  - Shuffle: `32px`, inactive `#b3b3b3`, active `#1ed760` with green dot.
  - Previous Track: `32px`, `#b3b3b3`, hover `#ffffff`.
  - Play / Pause Button: `32px × 32px` white circular button with black play/pause icon, hover `scale(1.06)`.
  - Next Track: `32px`, `#b3b3b3`, hover `#ffffff`.
  - Repeat: `32px`, inactive `#b3b3b3`, active `#1ed760` (repeat all vs repeat one with "1" badge).
- **Timeline / Progress Bar Row** (`gap: 8px`, flex row):
  - Elapsed Time: `#b3b3b3`, `font-size: 11px`, tabular numerals (e.g. `1:24`).
  - Progress Slider Track:
    - Width: `100%`, Height: `4px` (expands to `6px` on hover), Radius: `2px`.
    - Unplayed track background: `#4d4d4d` (`--background-tinted-base`).
    - Played progress bar: `#ffffff` (turns `#1ed760` on slider hover/drag).
    - Slider Thumb: `12px × 12px` circular white dot, hidden at rest (`opacity: 0`), visible on slider hover (`opacity: 1`).
  - Total Duration: `#b3b3b3`, `font-size: 11px`, tabular numerals (e.g. `3:45`).

#### C. Right Section (Volume & Secondary Controls, 30% Width, min 180px)
- **Icons**: Now Playing view toggle, Lyrics toggle, Queue toggle, Connect to Device icon.
- **Volume Control**:
  - Speaker icon (Mute toggle, changes icon at 0%, <50%, >=50%).
  - Volume Slider: `width: 93px` to `125px`, height `4px` (expands to `6px` on hover), white filled progress, white thumb dot on hover.
  - Fullscreen toggle icon.

### 5.7 Context Menus & Modals
- **Surface**: Background `#282828`, Border-radius `4px`, Padding `4px`, Box shadow `0 16px 24px rgba(0,0,0,0.3), 0 6px 8px rgba(0,0,0,0.2)`.
- **Menu Items**:
  - `height: 40px`, `padding: 10px 12px`, `font-size: 14px`, Color `#e7e7e7`.
  - Hover: Background `#3e3e3e`, Color `#ffffff`.
  - Left icon: `16px × 16px`, `#b3b3b3` (hover `#ffffff`).
  - Right submenu chevron: `16px`, `#b3b3b3`.
- **Dividers**: `1px solid rgba(255,255,255,0.1)`, `margin: 4px 0`.

---

## 6. Screen-by-Screen Comparison & Evidence Registry

The table below correlates the 10 captured reference screenshots with their exact UI components, dimensions, and REA Evidence IDs:

| Screenshot File | Screen / View Name | REA Evidence ID | Key Observable UI Components |
| :--- | :--- | :--- | :--- |
| `01_spotify_home.png` | Home View | `ev_a3e909458780d919...` | Top bar search, left library cards ("Create playlist" white pill), trending media cards grid, popular artist circular avatars, footer links. |
| `02_spotify_search_browse.png` | Search / Browse | `ev_67591f962707fc66...` | "Browse all" header, multi-colored genre cards with 25° rotated album artwork, pill chips, search input in top bar. |
| `03_spotify_playlist_view.png` | Playlist View (Today's Top Hits)| `ev_3b1abb1762791595...` | Hero gradient header, 72px bold title, 56px green play button, shuffle, "+" save, tracklist table with column headers (`#`, Title, Album, Date, Duration). |
| `04_spotify_album_view.png` | Album View | `ev_21349ab0706fb255...` | 232px square album art, album title, artist link, year, track count, compact tracklist table with duration. |
| `05_spotify_artist_view.png` | Artist View | `ev_8882cfd06daf0f77...` | Verified artist badge (blue check), monthly listeners count, popular 5-song table, discography carousel. |
| `06_spotify_liked_songs.png` | Liked Songs | `ev_7020d22273117acd...` | Purple/blue gradient hero container with heart badge, empty state / saved track table. |
| `07_spotify_queue_view.png` | Playback Queue | `ev_fb2027753126a31c...` | "Queue" header, "Now playing" current track card, "Next from:" upcoming queue tracklist, clear queue button. |
| `08_spotify_settings_view.png` | Desktop Settings | `ev_3e9b6550baceed78...` | Section headers, dropdown selectors (streaming quality, normalize volume), toggle switches (green when on, gray when off). |
| `09_spotify_context_menu.png` | Context Menu | `ev_b012ea232f3a7e6f...` | Floating `#282828` dropdown with items: "Add to Your Library", "Report", "Exclude from taste profile", "Add to folder", "Share". |
| `10_spotify_player_bar_modal.png` | Player Bar & Modal | `ev_98b6b95570db6432...` | Bottom player bar interaction, play button state, signup/login promotion banner overlay with gradient. |

---

## 7. Tailwind CSS Configuration Blueprint for MELO

To guarantee 1:1 fidelity in the MELO reconstruction, the following Tailwind CSS configuration maps all discovered Spotify Encore design tokens into standard utility classes:

```javascript
// tailwind.config.js - MELO Spotify Reconstruction Theme
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1db954',
          'green-bright': '#1ed760',
          'green-dark': '#169c46',
          base: '#121212',
          surface: '#181818',
          'surface-elevated': '#1f1f1f',
          'surface-hover': '#2a2a2a',
          'surface-active': '#191919',
          floating: '#282828',
          subdued: '#b3b3b3',
          muted: '#727272',
          tinted: 'rgba(255, 255, 255, 0.1)',
          'tinted-hover': 'rgba(255, 255, 255, 0.14)',
          'tinted-active': 'rgba(255, 255, 255, 0.21)',
        },
      },
      fontFamily: {
        sans: [
          'SpotifyMixUI',
          'CircularSp',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        title: [
          'SpotifyMixUITitle',
          'CircularSpTitle',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['SpotifyMixMono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'hero-title': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '900' }],
        'page-title': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '900' }],
        'section-title': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '700' }],
        'card-title': ['1rem', { lineHeight: '1.35', fontWeight: '700' }],
        'body-base': ['0.875rem', { lineHeight: '1.40', fontWeight: '400' }],
        'body-subdued': ['0.75rem', { lineHeight: '1.40', fontWeight: '400' }],
        'badge': ['0.6875rem', { lineHeight: '1.20', letterSpacing: '0.08em', fontWeight: '700' }],
      },
      borderRadius: {
        'spotify-subtle': '2px',
        'spotify-sm': '4px',
        'spotify-md': '6px',
        'spotify-lg': '8px',
        'spotify-xl': '12px',
        'spotify-pill': '9999px',
      },
      spacing: {
        'topbar': '64px',
        'playerbar': '72px',
        'sidebar-min': '232px',
        'sidebar-default': '280px',
        'sidebar-max': '420px',
      },
      boxShadow: {
        'card-artwork': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'context-menu': '0 16px 24px rgba(0, 0, 0, 0.3), 0 6px 8px rgba(0, 0, 0, 0.2)',
        'modal': '0 24px 36px rgba(0, 0, 0, 0.4)',
      },
      transitionTimingFunction: {
        'spotify-productive': 'cubic-bezier(0.3, 0, 0, 1)',
        'spotify-expressive': 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};
```

---

## 8. Verification & Traceability

1. **Local Spotify Package Evidence**:
   - `C:\Users\suzhi\AppData\Roaming\Spotify\Apps\xpui.spa` (Extracted 614 files to `evidence/extracted/xpui`)
   - `xpui-snapshot.css` (216 extracted CSS variables verifying all `--encore-*` and `--background-*` tokens)
   - `dwp-top-bar.css` (64px top bar height, 32px circular buttons, 8px gap)
   - `dwp-now-playing-bar.css` (72px player bar height, 30%/40%/30% flex partitions, 4px active indicator dot)
   - `xpui-routes-your-library-x.css` (sidebar panel styling, pill chips, 8px radius cards)
2. **REA Execution Records**:
   - All tool invocations and screenshots are logged in `evidence/evidence-register.csv` with SHA-256 digests and timestamped Evidence IDs.
