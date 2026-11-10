/**
 * Project MELO - Design System Tokens
 * Source: Spotify Desktop Encore Design System (xpui-snapshot.css)
 */

export const COLORS = {
  // Surfaces
  backgroundBase: '#121212',
  backgroundHighlight: '#1f1f1f',
  backgroundPress: '#000000',
  backgroundElevatedBase: '#1f1f1f',
  backgroundElevatedHighlight: '#2a2a2a',
  backgroundElevatedPress: '#191919',
  surfaceFloating: '#282828',

  // Translucent Overlays
  backgroundTintedBase: 'rgba(255, 255, 255, 0.10)',
  backgroundTintedHighlight: 'rgba(255, 255, 255, 0.14)',
  backgroundTintedPress: 'rgba(255, 255, 255, 0.21)',
  modalBackdrop: 'rgba(0, 0, 0, 0.70)',

  // Brand & Accents
  accentGreen: '#1ed760',
  accentHover: '#1fdf64',
  accentPress: '#169c46',
  brandGreen: '#1db954',

  // Typography
  textBase: '#ffffff',
  textSubdued: '#b3b3b3',
  textMuted: '#727272',
  textPositive: '#1ed760',
  textNegative: '#f3727f',
  textWarning: '#ffa42b',
  textAnnouncement: '#539df5',

  // Sliders
  sliderTrack: '#4d4d4d',
  sliderThumb: '#ffffff',

  // Browse Genre Palette
  genres: {
    music: '#e1118c',
    podcasts: '#006450',
    live: '#7358ff',
    madeForYou: '#1e3264',
    newReleases: '#608108',
    pop: '#e8115b',
    charts: '#d84000',
    chill: '#8d67ab',
  },
} as const;

export const RADII = {
  subtle: '2px',
  thumb: '4px',
  image: '6px',
  card: '8px',
  banner: '16px',
  pill: '9999px',
} as const;

export const DIMENSIONS = {
  topbarHeight: 64,
  playerbarHeight: 72,
  sidebarMinWidth: 232,
  sidebarDefaultWidth: 280,
  sidebarMaxWidth: 420,
  panelGap: 8,
  cardPadding: 16,
  windowMinWidth: 800,
  windowMinHeight: 600,
  windowDefaultWidth: 1200,
  windowDefaultHeight: 800,
} as const;

export const TIMING = {
  productive: 'cubic-bezier(0.3, 0, 0, 1)',
  expressive: 'cubic-bezier(0.2, 0, 0, 1)',
  buttonHoverScale: 1.04,
  playButtonHoverScale: 1.06,
  shortDurationMs: 200,
  mediumDurationMs: 300,
} as const;
