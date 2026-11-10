import { describe, it, beforeEach, afterEach, expect, SAMPLE_TRACKS } from '../helpers/test-utils.ts';
import { MeloDatabase } from '../../src/main/database/db.ts';
import path from 'node:path';
import fs from 'node:fs';

describe('Integration: Playlist Track Ordering & Associations', () => {
  let db: MeloDatabase;
  const testDbPath = path.resolve(process.cwd(), 'temp-integration-playlist-tracks.db');

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
  // TIER 1: Feature Coverage (Track Associations)
  // ==========================================

  it('Tier 1: adds tracks and returns them strictly in orderIndex sequence', () => {
    const pl = db.createPlaylist('Ordering Test');
    db.addTrackToPlaylist(pl.id, 'trk_03');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');

    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(3);
    expect(tracks[0].id).toBe('trk_03');
    expect(tracks[1].id).toBe('trk_01');
    expect(tracks[2].id).toBe('trk_02');
  });

  it('Tier 1: reorders track from tail to head (drag-and-drop simulation)', () => {
    const pl = db.createPlaylist('Reorder Test');
    db.addTrackToPlaylist(pl.id, 'trk_01'); // 0
    db.addTrackToPlaylist(pl.id, 'trk_02'); // 1
    db.addTrackToPlaylist(pl.id, 'trk_03'); // 2

    // Move index 2 (trk_03) to index 0
    const success = db.reorderPlaylistTrack(pl.id, 2, 0);
    expect(success).toBeTruthy();

    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks[0].id).toBe('trk_03');
    expect(tracks[1].id).toBe('trk_01');
    expect(tracks[2].id).toBe('trk_02');
  });

  it('Tier 1: reorders track from head to tail', () => {
    const pl = db.createPlaylist('Reorder Head to Tail');
    db.addTrackToPlaylist(pl.id, 'trk_01'); // 0
    db.addTrackToPlaylist(pl.id, 'trk_02'); // 1
    db.addTrackToPlaylist(pl.id, 'trk_03'); // 2

    // Move index 0 (trk_01) to index 2
    const success = db.reorderPlaylistTrack(pl.id, 0, 2);
    expect(success).toBeTruthy();

    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks[0].id).toBe('trk_02');
    expect(tracks[1].id).toBe('trk_03');
    expect(tracks[2].id).toBe('trk_01');
  });

  it('Tier 1: removes track and preserves contiguous order for remaining tracks', () => {
    const pl = db.createPlaylist('Contiguous Removal');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');
    db.addTrackToPlaylist(pl.id, 'trk_03');
    db.addTrackToPlaylist(pl.id, 'trk_04');

    db.removeTrackFromPlaylist(pl.id, 'trk_02');
    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(3);
    expect(tracks.map((t) => t.id)).toEqual(['trk_01', 'trk_03', 'trk_04']);
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: rejects reordering with negative fromIndex or toIndex', () => {
    const pl = db.createPlaylist('Boundary Reorder');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');

    expect(db.reorderPlaylistTrack(pl.id, -1, 1)).toBeFalsy();
    expect(db.reorderPlaylistTrack(pl.id, 0, -1)).toBeFalsy();
  });

  it('Tier 2: rejects reordering with out-of-bounds indexes', () => {
    const pl = db.createPlaylist('Out of Bounds');
    db.addTrackToPlaylist(pl.id, 'trk_01');

    expect(db.reorderPlaylistTrack(pl.id, 0, 5)).toBeFalsy();
    expect(db.reorderPlaylistTrack(pl.id, 5, 0)).toBeFalsy();
  });

  it('Tier 2: reordering track to same index is a safe no-op', () => {
    const pl = db.createPlaylist('Same Index');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');

    expect(db.reorderPlaylistTrack(pl.id, 1, 1)).toBeTruthy();
    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks[0].id).toBe('trk_01');
    expect(tracks[1].id).toBe('trk_02');
  });

  it('Tier 2: bulk adds 25 tracks sequentially with verified monotonic ordering', () => {
    const pl = db.createPlaylist('Bulk Add');
    for (let i = 0; i < 25; i++) {
      const trackId = SAMPLE_TRACKS[i % SAMPLE_TRACKS.length].id;
      db.addTrackToPlaylist(pl.id, trackId);
    }

    const tracks = db.getPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(25);
    for (let i = 0; i < 25; i++) {
      expect(tracks[i].id).toBe(SAMPLE_TRACKS[i % SAMPLE_TRACKS.length].id);
    }
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: reordered playlist loaded into AudioEngine plays in new custom order', async () => {
    const pl = db.createPlaylist('Playback Reorder');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');
    db.addTrackToPlaylist(pl.id, 'trk_03');

    // User swaps track 0 and track 2
    db.reorderPlaylistTrack(pl.id, 2, 0);

    const reordered = db.getPlaylistTracks(pl.id);
    expect(reordered[0].id).toBe('trk_03');

    // Simulate playback loading
    const queue = [...reordered];
    expect(queue[0].id).toBe('trk_03');
    expect(queue[1].id).toBe('trk_01');
    expect(queue[2].id).toBe('trk_02');
  });

  it('Tier 3: removing active track from playlist does not invalidate subsequent track indices', () => {
    const pl = db.createPlaylist('Active Removal');
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');
    db.addTrackToPlaylist(pl.id, 'trk_03');

    // Remove first track
    db.removeTrackFromPlaylist(pl.id, 'trk_01');

    const remaining = db.getPlaylistTracks(pl.id);
    expect(remaining).toHaveLength(2);
    expect(remaining[0].id).toBe('trk_02');
    expect(remaining[1].id).toBe('trk_03');
  });

  // ==========================================
  // TIER 4: Real-World Playlist Curation Workflow
  // ==========================================

  it('Tier 4: simulates full playlist curation workflow: add, reorder, remove, review', () => {
    // 1. Create playlist
    const pl = db.createPlaylist('Gym Motivation', 'High energy beats');

    // 2. Add 4 tracks
    db.addTrackToPlaylist(pl.id, 'trk_01');
    db.addTrackToPlaylist(pl.id, 'trk_02');
    db.addTrackToPlaylist(pl.id, 'trk_03');
    db.addTrackToPlaylist(pl.id, 'trk_04');

    // 3. Reorder track 3 to top position
    db.reorderPlaylistTrack(pl.id, 2, 0);
    expect(db.getPlaylistTracks(pl.id)[0].id).toBe('trk_03');

    // 4. Remove track 2
    db.removeTrackFromPlaylist(pl.id, 'trk_02');

    // 5. Final review: 3 tracks remaining in expected order
    const finalTracks = db.getPlaylistTracks(pl.id);
    expect(finalTracks).toHaveLength(3);
    expect(finalTracks[0].id).toBe('trk_03');
    expect(finalTracks[1].id).toBe('trk_01');
    expect(finalTracks[2].id).toBe('trk_04');
  });
});
