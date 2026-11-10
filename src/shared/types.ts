/**
 * MELO Shared Interface Contracts and Types
 */

export interface PlaylistRecord {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  isPinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  trackCount?: number;
}

export interface TrackRecord {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  durationMs: number;
  coverUrl: string;
  audioUrl: string;
  genre?: string;
  releaseYear?: number;
  trackNumber?: number;
  addedAt?: string;
  isLiked?: boolean;
}

export interface IElectronAPI {
  // Window Controls
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;
  onMaximizeChange?: (callback: (isMaximized: boolean) => void) => () => void;

  // SQLite Database Operations
  dbGetPlaylists: () => Promise<PlaylistRecord[]>;
  dbCreatePlaylist: (name: string, description?: string, coverImage?: string) => Promise<PlaylistRecord>;
  dbUpdatePlaylist: (id: string, name: string, description?: string, coverImage?: string) => Promise<boolean>;
  dbDeletePlaylist: (id: string) => Promise<boolean>;
  dbGetPlaylistTracks: (playlistId: string) => Promise<TrackRecord[]>;
  dbAddTrackToPlaylist: (playlistId: string, trackId: string) => Promise<boolean>;
  dbRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<boolean>;

  // Liked Songs
  dbGetLikedSongs: () => Promise<TrackRecord[]>;
  dbToggleLikeSong: (trackId: string) => Promise<boolean>;
  dbIsSongLiked: (trackId: string) => Promise<boolean>;

  // Catalogue & Settings
  dbGetCatalogTracks: () => Promise<TrackRecord[]>;
  dbGetSettings: () => Promise<Record<string, any>>;
  dbSaveSetting: (key: string, value: any) => Promise<boolean>;
}

export type PlaybackState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ENDED' | 'ERROR';
export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

export interface IAudioEngine {
  loadTrack: (track: TrackRecord, contextQueue?: TrackRecord[]) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (level: number) => void; // 0.0 to 1.0
  toggleMute: () => void;
  setShuffle: (enabled: boolean) => void;
  setRepeat: (mode: RepeatMode) => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  addToQueue: (track: TrackRecord) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setVolumeNormalization?: (enabled: boolean, level?: 'Quiet' | 'Normal' | 'Loud') => void;
  setMonoAudio?: (enabled: boolean) => void;
  setCrossfade?: (seconds: number) => void;
  setEqualizer?: (enabled: boolean, preset?: string, bands?: Record<string, number>) => void;
  setAutoplay?: (enabled: boolean) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}
