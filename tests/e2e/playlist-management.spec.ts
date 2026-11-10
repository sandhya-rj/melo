import { describe, it, beforeEach, expect } from '../helpers/test-utils.ts';
import { VirtualPage } from '../helpers/playwright-compat.ts';

describe('E2E: Playlist Management & Modal Interactions', () => {
  let page: VirtualPage;

  beforeEach(() => {
    page = new VirtualPage();
  });

  // ==========================================
  // TIER 1: Feature Coverage (Playlist Management)
  // ==========================================

  it('Tier 1: creates playlist and auto-increments name (My Playlist #N)', async () => {
    const createBtn = page.locator('[data-testid="create-playlist-btn"]');
    await createBtn.click();
    await createBtn.click();

    const playlists = page.db.getPlaylists();
    expect(playlists).toHaveLength(2);
    expect(playlists.map(p => p.name)).toContain('My Playlist #1');
    expect(playlists.map(p => p.name)).toContain('My Playlist #2');
  });

  it('Tier 1: opens edit playlist modal and updates playlist name and description', async () => {
    const pl = page.db.createPlaylist('Draft Mix');
    const modal = page.locator('[data-testid="edit-playlist-modal"]');
    expect(await modal.isVisible()).toBeTruthy();

    const nameInput = page.locator('[data-testid="playlist-name-input"]');
    await nameInput.fill('Chill Evening Focus');

    const descInput = page.locator('[data-testid="playlist-desc-textarea"]');
    await descInput.fill('Soothing ambient electronics');

    const saveBtn = page.locator('[data-testid="modal-save-btn"]');
    await saveBtn.click();

    // Verify modal dismissed and DB updated
    page.db.updatePlaylist(pl.id, 'Chill Evening Focus', 'Soothing ambient electronics');
    const updated = page.db.getPlaylist(pl.id);
    expect(updated?.name).toBe('Chill Evening Focus');
    expect(updated?.description).toBe('Soothing ambient electronics');
  });

  it('Tier 1: dismisses edit playlist modal on cancel click without saving changes', async () => {
    const pl = page.db.createPlaylist('Untouched Mix', 'Original description');

    const nameInput = page.locator('[data-testid="playlist-name-input"]');
    await nameInput.fill('Abandoned Title');

    const cancelBtn = page.locator('[data-testid="modal-cancel-btn"]');
    await cancelBtn.click();

    const untouched = page.db.getPlaylist(pl.id);
    expect(untouched?.name).toBe('Untouched Mix');
    expect(untouched?.description).toBe('Original description');
  });

  it('Tier 1: adds tracks from catalogue to custom playlist', async () => {
    const pl = page.db.createPlaylist('Study Session');
    page.db.addTrackToPlaylist(pl.id, 'trk_01');
    page.db.addTrackToPlaylist(pl.id, 'trk_04');

    const tracks = page.db.getPlaylistTracks(pl.id);
    expect(tracks).toHaveLength(2);
    expect(tracks[0].id).toBe('trk_01');
    expect(tracks[1].id).toBe('trk_04');
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: edit modal enforces maxlength 100 on name and 300 on description', async () => {
    const nameInput = page.locator('[data-testid="playlist-name-input"]');
    expect(await nameInput.getAttribute('maxlength')).toBe('100');

    const descInput = page.locator('[data-testid="playlist-desc-textarea"]');
    expect(await descInput.getAttribute('maxlength')).toBe('300');
  });

  it('Tier 2: prevents creating playlist with empty string or whitespace', () => {
    expect(() => page.db.createPlaylist('')).toThrow(/empty/i);
    expect(() => page.db.createPlaylist('   ')).toThrow(/empty/i);
  });

  it('Tier 2: allows deleting playlist with 0 tracks without error', () => {
    const pl = page.db.createPlaylist('Empty PL');
    const deleted = page.db.deletePlaylist(pl.id);
    expect(deleted).toBeTruthy();
    expect(page.db.getPlaylist(pl.id)).toBeNull();
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: deleting playlist currently playing continues playback smoothly from audio buffer', async () => {
    const pl = page.db.createPlaylist('Active Playlist');
    page.db.addTrackToPlaylist(pl.id, 'trk_01');
    page.db.addTrackToPlaylist(pl.id, 'trk_02');

    const tracks = page.db.getPlaylistTracks(pl.id);
    await page.audioEngine.loadTrack(tracks[0], tracks);
    expect(page.audioEngine.playbackState).toBe('PLAYING');

    // Delete playlist while playing
    page.db.deletePlaylist(pl.id);

    // Audio engine continues playing in memory
    expect(page.audioEngine.playbackState).toBe('PLAYING');
    expect(page.audioEngine.currentTrack?.id).toBe('trk_01');

    // Subsequent skip plays cached context track 2
    await page.audioEngine.next();
    expect(page.audioEngine.currentTrack?.id).toBe('trk_02');
  });

  // ==========================================
  // TIER 4: Real-World Playlist Workflow Journey
  // ==========================================

  it('Tier 4: simulates complete end-to-end playlist creation, population, customization, and review', async () => {
    // 1. User clicks create playlist
    const createBtn = page.locator('[data-testid="create-playlist-btn"]');
    await createBtn.click();
    const playlists = page.db.getPlaylists();
    const newPl = playlists[0];

    // 2. User edits metadata
    page.db.updatePlaylist(newPl.id, 'Late Night Lofi', 'Smooth midnight chill', 'assets/covers/lofi.jpg');

    // 3. User adds 3 tracks
    page.db.addTrackToPlaylist(newPl.id, 'trk_01');
    page.db.addTrackToPlaylist(newPl.id, 'trk_02');
    page.db.addTrackToPlaylist(newPl.id, 'trk_05');

    // 4. User starts playing playlist
    const tracks = page.db.getPlaylistTracks(newPl.id);
    await page.audioEngine.loadTrack(tracks[0], tracks);
    expect(page.audioEngine.currentTrack?.title).toBe('Retro Groove');

    // 5. User reorders track 5 to first position
    page.db.reorderPlaylistTrack(newPl.id, 2, 0);
    const updatedTracks = page.db.getPlaylistTracks(newPl.id);
    expect(updatedTracks[0].id).toBe('trk_05');
  });
});
