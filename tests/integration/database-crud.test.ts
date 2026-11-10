import { describe, it, beforeEach, afterEach, expect, SAMPLE_TRACKS } from '../helpers/test-utils.ts';
import { MeloDatabase } from '../../src/main/database/db.ts';
import path from 'node:path';
import fs from 'node:fs';

describe('Integration: Database CRUD Operations & Persistence', () => {
  let db: MeloDatabase;
  const testDbPath = path.resolve(process.cwd(), 'temp-integration-crud.db');

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
    db = new MeloDatabase(testDbPath);
    await db.initialize();
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
  // TIER 1: Feature Coverage (Database CRUD)
  // ==========================================

  it('Tier 1: creates and persists multiple playlists with unique IDs', () => {
    const pl1 = db.createPlaylist('Morning Acoustic', 'Soft morning songs');
    const pl2 = db.createPlaylist('Late Night Coding', 'Lofi beats to study to');

    expect(pl1.id).not.toBe(pl2.id);
    const all = db.getPlaylists();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.map((p) => p.id)).toContain(pl1.id);
    expect(all.map((p) => p.id)).toContain(pl2.id);
  });

  it('Tier 1: updates playlist cover image URL in SQLite', () => {
    const pl = db.createPlaylist('Visual Mix', 'With custom cover');
    db.updatePlaylist(pl.id, 'Visual Mix', 'With custom cover', 'assets/covers/custom.png');

    const updated = db.getPlaylist(pl.id);
    expect(updated?.coverImage).toBe('assets/covers/custom.png');
  });

  it('Tier 1: adds multiple tracks to playlist and preserves sequential order', () => {
    const pl = db.createPlaylist('Synth Highlights');
    for (const track of SAMPLE_TRACKS) {
      db.addTrackToPlaylist(pl.id, track.id);
    }

    const playlistTracks = db.getPlaylistTracks(pl.id);
    expect(playlistTracks).toHaveLength(SAMPLE_TRACKS.length);
    expect(playlistTracks[0].id).toBe(SAMPLE_TRACKS[0].id);
    expect(playlistTracks[4].id).toBe(SAMPLE_TRACKS[4].id);
  });

  it('Tier 1: toggling like status updates liked_songs collection immediately', () => {
    db.toggleLikeSong('trk_02');
    db.toggleLikeSong('trk_04');

    const liked = db.getLikedSongs();
    expect(liked).toHaveLength(2);
    expect(liked.map((t) => t.id).sort()).toEqual(['trk_02', 'trk_04'].sort());
  });

  it('Tier 1: records playback history entries with timestamps and durations', () => {
    db.recordHistory('trk_01', 214000, true);
    db.recordHistory('trk_02', 120000, false);

    expect(db.history).toHaveLength(2);
    expect(db.history[0].trackId).toBe('trk_01');
    expect(db.history[0].completed).toBe(1);
    expect(db.history[1].trackId).toBe('trk_02');
    expect(db.history[1].completed).toBe(0);
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: handles empty description when creating playlist', () => {
    const pl = db.createPlaylist('No Desc Playlist');
    expect(pl.description).toBe('');
    expect(db.getPlaylist(pl.id)?.description).toBe('');
  });

  it('Tier 2: ignores updating non-existent playlist ID', () => {
    const success = db.updatePlaylist('pl_non_existent', 'New Title');
    expect(success).toBeFalsy();
  });

  it('Tier 2: ignores deleting non-existent playlist ID', () => {
    const success = db.deletePlaylist('pl_non_existent');
    expect(success).toBeFalsy();
  });

  it('Tier 2: adding duplicate track to same playlist creates distinct entry with new order', () => {
    const pl = db.createPlaylist('Repetitive Mix');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_01'); // duplicate track in playlist

    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(2);
    expect(tracks[0].id).toBe('trk_01');
    expect(tracks[1].id).toBe('trk_01');
  });

  it('Tier 2: saving complex nested setting values serializes accurately', () => {
    const complexConfig = {
      eq: { bass: 3, mid: 0, treble: -2 },
      outputDevice: 'Realtek High Definition Audio',
      crossfade: { enabled: true, durationSec: 5 },
    };
    db.saveSetting('audioPreferences', complexConfig);

    const retrieved = db.getSettings();
    expect(retrieved.audioPreferences).toEqual(complexConfig);
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: deleting playlist containing tracks removes both playlist and tracks associations', () => {
    const pl = db.createPlaylist('Ephemeral Playlist');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');
    db.addTrackToPlaylist(pl.id, 'trk_03');

    db.deletePlaylist(pl.id);

    expect(db.getPlaylist(pl.id)).toBeNull();
    expect(db.getPlaylistTracks(pl.id)).toHaveLength(0);
    // Catalog tracks themselves remain untouched
    expect(db.getCatalogTracks()).toHaveLength(SAMPLE_TRACKS.length);
  });

  it('Tier 3: liking all tracks from a playlist synchronizes with Liked Songs collection', () => {
    const pl = db.createPlaylist('All Liked Mix');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');

    const plTracks = db.getPlaylistTracks(pl.id);
    for (const track of plTracks) {
      db.toggleLikeSong(track.id);
    }

    const liked = db.getLikedSongs();
    expect(liked).toHaveLength(2);
    expect(liked.map((t) => t.id).sort()).toEqual(['trk_01', 'trk_02'].sort());
  });

  // ==========================================
  // TIER 4: Real-World Persistence Session
  // ==========================================

  it('Tier 4: simulates full application restart and validates data persistence', async () => {
    // 1. Initial user activity: create playlist, like songs, set options
    const pl = db.createPlaylist('Roadtrip Anthems', 'For cross-country driving');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_03');
    db.toggleLikeSong('trk_01');
    db.saveSetting('volumeLevel', 0.85);

    // 2. Physical database close
    db.close();

    // 3. Re-open genuine database from disk
    const restartedDb = new MeloDatabase(testDbPath);
    await restartedDb.initialize();

    // 4. Verify all states survive restart intact
    const restoredPl = restartedDb.getPlaylist(pl.id);
    expect(restoredPl?.name).toBe('Roadtrip Anthems');
    expect(restartedDb.getPlaylistTracks(pl.id)).toHaveLength(2);
    expect(restartedDb.isSongLiked('trk_01')).toBeTruthy();
    expect(restartedDb.getSettings().volumeLevel).toBe(0.85);
    restartedDb.close();
  });
});
