import { describe as nodeDescribe, it as nodeIt, beforeEach as nodeBeforeEach, afterEach as nodeAfterEach } from 'node:test';
import assert from 'node:assert';

// Unified test functions compatible with Vitest and Node:test
export const describe = nodeDescribe;
export const it = nodeIt;
export const test = nodeIt;
export const beforeEach = nodeBeforeEach;
export const afterEach = nodeAfterEach;

// Rich assertion interface mimicking Vitest / Jest / Chai expect()
export function expect(actual: any) {
  return {
    toBe(expected: any) {
      assert.strictEqual(actual, expected, `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
    },
    toEqual(expected: any) {
      assert.deepStrictEqual(actual, expected, `Expected deep equality for ${JSON.stringify(actual)}`);
    },
    toBeTruthy() {
      assert.ok(Boolean(actual), `Expected truthy value but got ${actual}`);
    },
    toBeFalsy() {
      assert.ok(!actual, `Expected falsy value but got ${actual}`);
    },
    toBeNull() {
      assert.strictEqual(actual, null, `Expected null but got ${actual}`);
    },
    toBeUndefined() {
      assert.strictEqual(actual, undefined, `Expected undefined but got ${actual}`);
    },
    toBeDefined() {
      assert.notStrictEqual(actual, undefined, `Expected defined value but got undefined`);
    },
    toBeGreaterThan(val: number) {
      assert.ok(actual > val, `Expected ${actual} > ${val}`);
    },
    toBeGreaterThanOrEqual(val: number) {
      assert.ok(actual >= val, `Expected ${actual} >= ${val}`);
    },
    toBeLessThan(val: number) {
      assert.ok(actual < val, `Expected ${actual} < ${val}`);
    },
    toBeLessThanOrEqual(val: number) {
      assert.ok(actual <= val, `Expected ${actual} <= ${val}`);
    },
    toContain(item: any) {
      if (typeof actual === 'string') {
        assert.ok(actual.includes(item), `Expected "${actual}" to contain substring "${item}"`);
      } else if (Array.isArray(actual)) {
        const found = actual.some(elem => JSON.stringify(elem) === JSON.stringify(item) || elem === item);
        assert.ok(found, `Expected array to contain ${JSON.stringify(item)}`);
      } else if (actual && typeof actual === 'object') {
        assert.ok(item in actual, `Expected object to contain key "${item}"`);
      } else {
        assert.fail(`Cannot check toContain on ${typeof actual}`);
      }
    },
    toHaveLength(len: number) {
      assert.ok(actual && typeof actual.length === 'number', `Expected object to have length property`);
      assert.strictEqual(actual.length, len, `Expected length ${len} but got ${actual.length}`);
    },
    toBeCloseTo(expected: number, delta: number = 0.01) {
      assert.ok(Math.abs(actual - expected) <= delta, `Expected ${actual} to be close to ${expected} (within ${delta})`);
    },
    toThrow(regexOrMsg?: string | RegExp) {
      assert.throws(actual, regexOrMsg);
    },
    not: {
      toBe(expected: any) {
        assert.notStrictEqual(actual, expected, `Expected ${actual} NOT to be ${expected}`);
      },
      toEqual(expected: any) {
        assert.notDeepStrictEqual(actual, expected, `Expected ${JSON.stringify(actual)} NOT to deep-equal ${JSON.stringify(expected)}`);
      },
      toContain(item: any) {
        if (typeof actual === 'string') {
          assert.ok(!actual.includes(item), `Expected "${actual}" NOT to contain "${item}"`);
        } else if (Array.isArray(actual)) {
          const found = actual.some(elem => JSON.stringify(elem) === JSON.stringify(item) || elem === item);
          assert.ok(!found, `Expected array NOT to contain ${JSON.stringify(item)}`);
        }
      },
      toBeNull() {
        assert.notStrictEqual(actual, null, `Expected NOT null`);
      },
      toBeUndefined() {
        assert.notStrictEqual(actual, undefined, `Expected NOT undefined`);
      }
    }
  };
}

// Data Models per PROJECT.md and Reference Specifications
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
}

export interface PlaylistRecord {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PlaybackState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ENDED' | 'ERROR';
export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

export interface IElectronAPI {
  // Window Controls
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;

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

export interface IAudioEngine {
  loadTrack: (track: TrackRecord, contextQueue?: TrackRecord[]) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  setShuffle: (enabled: boolean) => void;
  setRepeat: (mode: RepeatMode) => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  addToQueue: (track: TrackRecord) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

// Sample Seed Tracks for Testing (including The Weeknd Premier Tracks)
export const SAMPLE_TRACKS: TrackRecord[] = [
  {
    id: 'trk_weeknd_blinding_lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    artistId: 'art_weeknd',
    album: 'After Hours (2026 Deluxe Remaster)',
    albumId: 'alb_after_hours',
    durationMs: 200000,
    coverUrl: 'assets/covers/after-hours.jpg',
    audioUrl: 'audio/the-weeknd-blinding-lights.wav',
    genre: 'Synthwave',
    releaseYear: 2026,
    trackNumber: 1
  },
  {
    id: 'trk_weeknd_starboy',
    title: 'Starboy',
    artist: 'The Weeknd',
    artistId: 'art_weeknd',
    album: 'Starboy (2026 Anniversary Edition)',
    albumId: 'alb_starboy',
    durationMs: 230000,
    coverUrl: 'assets/covers/starboy.jpg',
    audioUrl: 'audio/the-weeknd-starboy.wav',
    genre: 'R&B',
    releaseYear: 2026,
    trackNumber: 1
  },
  {
    id: 'trk_weeknd_save_your_tears',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    artistId: 'art_weeknd',
    album: 'After Hours (2026 Deluxe Remaster)',
    albumId: 'alb_after_hours',
    durationMs: 215000,
    coverUrl: 'assets/covers/after-hours.jpg',
    audioUrl: 'audio/the-weeknd-save-your-tears.wav',
    genre: 'Pop',
    releaseYear: 2026,
    trackNumber: 2
  },
  {
    id: 'trk_weeknd_after_hours',
    title: 'After Hours',
    artist: 'The Weeknd',
    artistId: 'art_weeknd',
    album: 'After Hours (2026 Deluxe Remaster)',
    albumId: 'alb_after_hours',
    durationMs: 225000,
    coverUrl: 'assets/covers/after-hours.jpg',
    audioUrl: 'audio/the-weeknd-after-hours.wav',
    genre: 'R&B',
    releaseYear: 2026,
    trackNumber: 3
  },
  {
    id: 'trk_weeknd_dancing_in_the_flames',
    title: 'Dancing In The Flames',
    artist: 'The Weeknd',
    artistId: 'art_weeknd',
    album: 'Hurry Up Tomorrow (2026 Edition)',
    albumId: 'alb_hurry_up',
    durationMs: 210000,
    coverUrl: 'assets/covers/hurry-up.jpg',
    audioUrl: 'audio/the-weeknd-dancing-in-the-flames.wav',
    genre: 'Synthwave',
    releaseYear: 2026,
    trackNumber: 1
  },
  {
    id: 'trk_01',
    title: 'Retro Groove',
    artist: 'Synthwave Collective',
    album: 'Neon Nights',
    durationMs: 214000,
    coverUrl: 'assets/covers/neon-nights.jpg',
    audioUrl: 'assets/audio/retro-groove.mp3',
    genre: 'Electronic',
    releaseYear: 2026,
    trackNumber: 1
  },
  {
    id: 'trk_02',
    title: 'Cyber Sunset',
    artist: 'Vector Pulse',
    album: 'Digital Horizons',
    durationMs: 185000,
    coverUrl: 'assets/covers/digital-horizons.jpg',
    audioUrl: 'assets/audio/cyber-sunset.mp3',
    genre: 'Electronic',
    releaseYear: 2026,
    trackNumber: 2
  },
  {
    id: 'trk_03',
    title: 'Midnight Drive',
    artist: 'Echo Shift',
    album: 'Neon Nights',
    durationMs: 242000,
    coverUrl: 'assets/covers/neon-nights.jpg',
    audioUrl: 'assets/audio/midnight-drive.mp3',
    genre: 'Synthwave',
    releaseYear: 2026,
    trackNumber: 3
  },
  {
    id: 'trk_04',
    title: 'Solar Flare',
    artist: 'Cosmic Ray',
    album: 'Astrosphere',
    durationMs: 198000,
    coverUrl: 'assets/covers/astrosphere.jpg',
    audioUrl: 'assets/audio/solar-flare.mp3',
    genre: 'Ambient',
    releaseYear: 2026,
    trackNumber: 1
  },
  {
    id: 'trk_05',
    title: 'Electric Dream',
    artist: 'Synthwave Collective',
    album: 'Neon Nights',
    durationMs: 220000,
    coverUrl: 'assets/covers/neon-nights.jpg',
    audioUrl: 'assets/audio/electric-dream.mp3',
    genre: 'Electronic',
    releaseYear: 2026,
    trackNumber: 4
  }
];
