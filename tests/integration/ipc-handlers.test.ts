import { describe, it, beforeEach, afterEach, expect } from '../helpers/test-utils.ts';
import { SAMPLE_TRACKS } from '../helpers/test-utils.ts';
import { MeloDatabase } from '../../src/main/database/db.ts';
import { registerIpcHandlers, type IIpcMainLike, type IWindowLike } from '../../src/main/ipc/handlers.ts';
import { createElectronClient, type IIpcInvoker } from '../../src/shared/ipc-bridge.ts';
import type { IElectronAPI } from '../../src/shared/types.ts';
import path from 'node:path';
import fs from 'node:fs';

describe('Integration: Electron Main ↔ Renderer IPC Handlers', () => {
  let db: MeloDatabase;
  const testDbPath = path.resolve(process.cwd(), 'temp-integration-ipc.db');
  let api: IElectronAPI & { isMaximized: boolean; isMinimized: boolean; isClosed: boolean };

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
    db = new MeloDatabase(testDbPath, { seedDefaultPlaylists: false });
    await db.initialize();

    const handlers = new Map<string, (event: any, ...args: any[]) => any>();
    const mockIpcMain: IIpcMainLike = {
      handle: (channel, listener) => {
        handlers.set(channel, listener);
      },
    };

    const mockInvoker: IIpcInvoker = {
      invoke: async (channel, ...args) => {
        const handler = handlers.get(channel);
        if (!handler) throw new Error(`No IPC handler registered for channel: ${channel}`);
        return handler({}, ...args);
      },
    };

    let isMaximized = false;
    let isMinimized = false;
    let isClosed = false;

    const mockWindow: IWindowLike = {
      minimize: () => { isMinimized = true; },
      maximize: () => { isMaximized = true; },
      unmaximize: () => { isMaximized = false; },
      close: () => { isClosed = true; },
      isMaximized: () => isMaximized,
    };

    registerIpcHandlers(mockIpcMain, db, () => mockWindow);
    const client = createElectronClient(mockInvoker);

    Object.defineProperties(client, {
      isMaximized: { get() { return isMaximized; }, enumerable: true },
      isMinimized: { get() { return isMinimized; }, enumerable: true },
      isClosed: { get() { return isClosed; }, enumerable: true },
    });
    api = client as any;
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  // ==========================================
  // TIER 1: Feature Coverage (IPC Methods)
  // ==========================================

  it('Tier 1: window controls invoke minimize, maximize, and close handlers', async () => {
    expect(await api.windowIsMaximized()).toBeFalsy();
    await api.windowMaximize();
    expect(await api.windowIsMaximized()).toBeTruthy();
    await api.windowMaximize(); // toggles back
    expect(await api.windowIsMaximized()).toBeFalsy();

    await api.windowMinimize();
    expect(api.isMinimized).toBeTruthy();

    await api.windowClose();
    expect(api.isClosed).toBeTruthy();
  });

  it('Tier 1: dbGetPlaylists returns sorted playlist list via IPC', async () => {
    await api.dbCreatePlaylist('Playlist Alpha');
    await api.dbCreatePlaylist('Playlist Beta');

    const playlists = await api.dbGetPlaylists();
    expect(playlists).toHaveLength(2);
    expect(playlists.map(p => p.name)).toContain('Playlist Alpha');
    expect(playlists.map(p => p.name)).toContain('Playlist Beta');
  });

  it('Tier 1: dbCreatePlaylist creates and returns new playlist record', async () => {
    const pl = await api.dbCreatePlaylist('Chill Vibes', 'Relaxing ambient music', 'assets/covers/chill.jpg');
    expect(pl.id).toBeDefined();
    expect(pl.name).toBe('Chill Vibes');
    expect(pl.description).toBe('Relaxing ambient music');
    expect(pl.coverImage).toBe('assets/covers/chill.jpg');
  });

  it('Tier 1: dbUpdatePlaylist modifies name and description over IPC', async () => {
    const pl = await api.dbCreatePlaylist('Original Title');
    const success = await api.dbUpdatePlaylist(pl.id, 'Renamed Title', 'New description');
    expect(success).toBeTruthy();

    const playlists = await api.dbGetPlaylists();
    const updated = playlists.find(p => p.id === pl.id);
    expect(updated?.name).toBe('Renamed Title');
    expect(updated?.description).toBe('New description');
  });

  it('Tier 1: dbDeletePlaylist deletes playlist over IPC', async () => {
    const pl = await api.dbCreatePlaylist('To Delete');
    const success = await api.dbDeletePlaylist(pl.id);
    expect(success).toBeTruthy();

    const playlists = await api.dbGetPlaylists();
    expect(playlists.find(p => p.id === pl.id)).toBeUndefined();
  });

  it('Tier 1: dbAddTrackToPlaylist and dbGetPlaylistTracks manage track associations', async () => {
    const pl = await api.dbCreatePlaylist('Track Association PL');
    await api.dbAddTrackToPlaylist(pl.id, 'trk_01');
    await api.dbAddTrackToPlaylist(pl.id, 'trk_02');

    const tracks = await api.dbGetPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(2);
    expect(tracks[0].id).toBe('trk_01');
    expect(tracks[1].id).toBe('trk_02');
  });

  it('Tier 1: dbToggleLikeSong and dbIsSongLiked sync heart status over IPC', async () => {
    expect(await api.dbIsSongLiked('trk_01')).toBeFalsy();

    const isLiked = await api.dbToggleLikeSong('trk_01');
    expect(isLiked).toBeTruthy();
    expect(await api.dbIsSongLiked('trk_01')).toBeTruthy();

    const likedTracks = await api.dbGetLikedSongs();
    expect(likedTracks).toHaveLength(1);
    expect(likedTracks[0].id).toBe('trk_01');
  });

  it('Tier 1: dbSaveSetting and dbGetSettings store preferences over IPC', async () => {
    await api.dbSaveSetting('audio.crossfade', 8);
    await api.dbSaveSetting('audio.normalization', true);

    const settings = await api.dbGetSettings();
    expect(settings['audio.crossfade']).toBe(8);
    expect(settings['audio.normalization']).toBe(true);
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (IPC)
  // ==========================================

  it('Tier 2: dbCreatePlaylist with empty name throws validation error across IPC', async () => {
    let errorCaught = false;
    try {
      await api.dbCreatePlaylist('');
    } catch (e: any) {
      errorCaught = true;
      expect(e.message).toContain('empty');
    }
    expect(errorCaught).toBeTruthy();
  });

  it('Tier 2: dbUpdatePlaylist with non-existent ID returns false without error', async () => {
    const success = await api.dbUpdatePlaylist('non_existent_pl_id', 'New Title');
    expect(success).toBeFalsy();
  });

  it('Tier 2: dbDeletePlaylist with non-existent ID returns false without error', async () => {
    const success = await api.dbDeletePlaylist('non_existent_pl_id');
    expect(success).toBeFalsy();
  });

  it('Tier 2: dbRemoveTrackFromPlaylist with invalid track returns false', async () => {
    const pl = await api.dbCreatePlaylist('PL');
    const success = await api.dbRemoveTrackFromPlaylist(pl.id, 'invalid_track_id');
    expect(success).toBeFalsy();
  });

  it('Tier 2: dbGetCatalogTracks returns all seeded tracks without alteration', async () => {
    const tracks = await api.dbGetCatalogTracks();
    expect(tracks).toHaveLength(SAMPLE_TRACKS.length);
    expect(tracks.map(t => t.id).sort()).toEqual(SAMPLE_TRACKS.map(t => t.id).sort());
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: playlist deletion via IPC triggers cascading removal of playlist tracks', async () => {
    const pl = await api.dbCreatePlaylist('Cascade Test');
    await api.dbAddTrackToPlaylist(pl.id, 'trk_01');
    await api.dbAddTrackToPlaylist(pl.id, 'trk_02');

    // Delete playlist
    await api.dbDeletePlaylist(pl.id);

    // Get tracks must return empty list
    const tracks = await api.dbGetPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(0);
  });

  it('Tier 3: liking song that is in multiple playlists retains like status across queries', async () => {
    const pl1 = await api.dbCreatePlaylist('Playlist 1');
    const pl2 = await api.dbCreatePlaylist('Playlist 2');

    await api.dbAddTrackToPlaylist(pl1.id, 'trk_01');
    await api.dbAddTrackToPlaylist(pl2.id, 'trk_01');

    await api.dbToggleLikeSong('trk_01');

    expect(await api.dbIsSongLiked('trk_01')).toBeTruthy();
    const liked = await api.dbGetLikedSongs();
    expect(liked.some(t => t.id === 'trk_01')).toBeTruthy();
  });

  // ==========================================
  // TIER 4: Real-World IPC Session
  // ==========================================

  it('Tier 4: simulates full client app startup and IPC handshake workflow', async () => {
    // 1. App queries initial state
    const catalog = await api.dbGetCatalogTracks();
    expect(catalog.length).toBeGreaterThan(0);

    const initialPlaylists = await api.dbGetPlaylists();
    expect(initialPlaylists).toHaveLength(0);

    // 2. User creates a favorite playlist
    const newPl = await api.dbCreatePlaylist('Favorites 2026', 'My top rotation');
    for (const track of catalog.slice(0, 3)) {
      await api.dbAddTrackToPlaylist(newPl.id, track.id);
      await api.dbToggleLikeSong(track.id);
    }

    // 3. User verifies playlist tracks
    const plTracks = await api.dbGetPlaylistTracks(newPl.id);
    expect(plTracks).toHaveLength(3);

    // 4. User verifies liked songs
    const likedSongs = await api.dbGetLikedSongs();
    expect(likedSongs).toHaveLength(3);

    // 5. User changes volume normalization setting
    await api.dbSaveSetting('volumeNormalization', true);
    const settings = await api.dbGetSettings();
    expect(settings.volumeNormalization).toBe(true);
  });
});
