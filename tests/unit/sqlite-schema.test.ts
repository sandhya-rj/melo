import { describe, it, beforeEach, afterEach, expect, SAMPLE_TRACKS } from '../helpers/test-utils.ts';
import { MeloDatabase } from '../../src/main/database/db.ts';
import path from 'node:path';
import fs from 'node:fs';

describe('Unit: SQLite Schema Constraints & Query Mechanics', () => {
  let db: MeloDatabase;
  const testDbPath = path.resolve(process.cwd(), 'temp-unit-schema.db');

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
  // TIER 1: Feature Coverage (Schema & Queries)
  // ==========================================

  it('Tier 1: creates and indexes default catalog tracks correctly', () => {
    const catalog = db.getCatalogTracks();
    expect(catalog).toHaveLength(SAMPLE_TRACKS.length);
    const track1 = catalog.find((t) => t.id === 'trk_01');
    expect(track1).toBeDefined();
    expect(track1?.title).toBe('Retro Groove');
    expect(track1?.artist).toBe('Synthwave Collective');
  });

  it('Tier 1: inserts playlist record with required columns and timestamps', () => {
    const pl = db.createPlaylist('Study Beats', 'Lofi hip hop for focus');
    expect(pl.id.startsWith('pl_')).toBeTruthy();
    expect(pl.name).toBe('Study Beats');
    expect(pl.description).toBe('Lofi hip hop for focus');
    expect(pl.createdAt).toBeDefined();
    expect(pl.updatedAt).toBeDefined();
  });

  it('Tier 1: associates tracks with playlist maintaining sequential order_index', () => {
    const pl = db.createPlaylist('My Mix');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');
    db.addTrackToPlaylist(pl.id, 'trk_03');

    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(3);
    expect(tracks[0].id).toBe('trk_01');
    expect(tracks[1].id).toBe('trk_02');
    expect(tracks[2].id).toBe('trk_03');
  });

  it('Tier 1: manages liked_songs table entries idempotently', () => {
    expect(db.isSongLiked('trk_01')).toBeFalsy();

    const liked = db.toggleLikeSong('trk_01');
    expect(liked).toBeTruthy();
    expect(db.isSongLiked('trk_01')).toBeTruthy();

    const unliked = db.toggleLikeSong('trk_01');
    expect(unliked).toBeFalsy();
    expect(db.isSongLiked('trk_01')).toBeFalsy();
  });

  it('Tier 1: saves and retrieves application settings key-value pairs', () => {
    db.saveSetting('audioQuality', 'very_high');
    db.saveSetting('normalizeVolume', true);
    db.saveSetting('crossfadeSeconds', 6);

    const settings = db.getSettings();
    expect(settings.audioQuality).toBe('very_high');
    expect(settings.normalizeVolume).toBe(true);
    expect(settings.crossfadeSeconds).toBe(6);
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: rejects empty or whitespace-only playlist names', () => {
    expect(() => db.createPlaylist('')).toThrow(/empty/i);
    expect(() => db.createPlaylist('   ')).toThrow(/empty/i);
  });

  it('Tier 2: truncates playlist name to 100 characters', () => {
    const longName = 'A'.repeat(150);
    const pl = db.createPlaylist(longName);
    expect(pl.name).toHaveLength(100);
    expect(pl.name).toBe('A'.repeat(100));
  });

  it('Tier 2: truncates playlist description to 300 characters', () => {
    const longDesc = 'D'.repeat(400);
    const pl = db.createPlaylist('Short Name', longDesc);
    expect(pl.description).toHaveLength(300);
  });

  it('Tier 2: handles special characters, unicode, and emojis without corruption', () => {
    const unicodeName = "🎧 Synthwave 2026 // 日本語ミックス & Rock'n'Roll ⚡";
    const pl = db.createPlaylist(unicodeName);
    expect(pl.name).toBe(unicodeName);

    const retrieved = db.getPlaylist(pl.id);
    expect(retrieved?.name).toBe(unicodeName);
  });

  it('Tier 2: SQL Injection resilience (parameterized safety)', () => {
    const maliciousName = "'; DROP TABLE playlists; --";
    const pl = db.createPlaylist(maliciousName);
    expect(pl.name).toBe(maliciousName);

    // Verify database tables still intact
    const all = db.getPlaylists();
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all.some((p) => p.name === maliciousName)).toBeTruthy();
  });

  it('Tier 2: rejects adding non-existent track to playlist', () => {
    const pl = db.createPlaylist('Valid PL');
    const result = db.addTrackToPlaylist(pl.id, 'non_existent_trk_999');
    expect(result).toBeFalsy();
    expect(db.getPlaylistTracks(pl.id)).toHaveLength(0);
  });

  it('Tier 2: rejects adding track to non-existent playlist', () => {
    const result = db.addTrackToPlaylist('non_existent_pl_999', 'trk_01');
    expect(result).toBeFalsy();
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations (Cascades)
  // ==========================================

  it('Tier 3: CASCADE deletion removes playlist_tracks when playlist is deleted', () => {
    const pl = db.createPlaylist('Temporary Mix');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');
    expect(db.getPlaylistTracks(pl.id)).toHaveLength(2);

    // Delete playlist
    const deleted = db.deletePlaylist(pl.id);
    expect(deleted).toBeTruthy();
    expect(db.getPlaylist(pl.id)).toBeNull();

    // Associated tracks must be cascade-deleted
    expect(db.getPlaylistTracks(pl.id)).toHaveLength(0);
  });

  it('Tier 3: removing track from playlist re-indexes remaining order_indexes without gaps', () => {
    const pl = db.createPlaylist('Ordering Mix');
    db.addTrackToPlaylist(pl.id, 'trk_01'); // order 0
    db.addTrackToPlaylist(pl.id, 'trk_02'); // order 1
    db.addTrackToPlaylist(pl.id, 'trk_03'); // order 2

    // Remove middle track (trk_02)
    const removed = db.removeTrackFromPlaylist(pl.id, 'trk_02');
    expect(removed).toBeTruthy();

    const remaining = db.getPlaylistTracks(pl.id);
    expect(remaining).toHaveLength(2);
    expect(remaining[0].id).toBe('trk_01');
    expect(remaining[1].id).toBe('trk_03');

    // Add a new track -> should receive order 2 (contiguous!)
    db.addTrackToPlaylist(pl.id, 'trk_04');
    const updated = db.getPlaylistTracks(pl.id);
    expect(updated).toHaveLength(3);
    expect(updated[2].id).toBe('trk_04');
  });

  it('Tier 3: multiple playlists can reference same track independently', () => {
    const pl1 = db.createPlaylist('Mix A');
    const pl2 = db.createPlaylist('Mix B');

    db.addTrackToPlaylist(pl1.id, 'trk_01');
    db.addTrackToPlaylist(pl2.id, 'trk_01');

    expect(db.getPlaylistTracks(pl1.id)).toHaveLength(1);
    expect(db.getPlaylistTracks(pl2.id)).toHaveLength(1);

    // Deleting Mix A does not affect Mix B
    db.deletePlaylist(pl1.id);
    expect(db.getPlaylistTracks(pl1.id)).toHaveLength(0);
    expect(db.getPlaylistTracks(pl2.id)).toHaveLength(1);
  });

  // ==========================================
  // TIER 4: Real-World Database Persistence Session
  // ==========================================

  it('Tier 4: simulates full user lifecycle across playlists, likes, and settings', () => {
    // 1. Create curated playlist
    const pl = db.createPlaylist('Electronic Focus', 'Best synth and ambient');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_03');
    db.addTrackToPlaylist(pl.id, 'trk_04');

    // 2. Like two tracks
    db.toggleLikeSong('trk_01');
    db.toggleLikeSong('trk_05');

    // 3. Configure audio settings
    db.saveSetting('playback.audioQuality', '320kbps');
    db.saveSetting('playback.gapless', true);
    db.saveSetting('theme.mode', 'dark');

    // 4. Update playlist metadata
    db.updatePlaylist(pl.id, 'Electronic Focus (2026 Edition)', 'Updated description');

    // 5. Verify all data integrity
    const savedPl = db.getPlaylist(pl.id);
    expect(savedPl?.name).toBe('Electronic Focus (2026 Edition)');
    expect(savedPl?.description).toBe('Updated description');

    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(3);

    const liked = db.getLikedSongs();
    expect(liked).toHaveLength(2);
    expect(liked.map((t) => t.id).sort()).toEqual(['trk_01', 'trk_05'].sort());

    const settings = db.getSettings();
    expect(settings['playback.audioQuality']).toBe('320kbps');
    expect(settings['playback.gapless']).toBe(true);
    expect(settings['theme.mode']).toBe('dark');
  });
});
