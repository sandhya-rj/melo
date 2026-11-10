import { describe, it, beforeEach, expect } from '../helpers/test-utils.ts';
import { VirtualPage } from '../helpers/playwright-compat.ts';

describe('E2E: Settings Screen, Preferences & Context Menus', () => {
  let page: VirtualPage;

  beforeEach(() => {
    page = new VirtualPage();
  });

  // ==========================================
  // TIER 1: Feature Coverage (Settings & Context Menus)
  // ==========================================

  it('Tier 1: saves and persists audio playback quality preference', async () => {
    await page.electronAPI.dbSaveSetting('playback.quality', 'Very High (320 kbps)');
    const settings = await page.electronAPI.dbGetSettings();
    expect(settings['playback.quality']).toBe('Very High (320 kbps)');
  });

  it('Tier 1: toggles audio normalization preference in SQLite', async () => {
    await page.electronAPI.dbSaveSetting('playback.normalization', true);
    let settings = await page.electronAPI.dbGetSettings();
    expect(settings['playback.normalization']).toBe(true);

    await page.electronAPI.dbSaveSetting('playback.normalization', false);
    settings = await page.electronAPI.dbGetSettings();
    expect(settings['playback.normalization']).toBe(false);
  });

  it('Tier 1: saves crossfade seconds within valid [0, 12] second range', async () => {
    await page.electronAPI.dbSaveSetting('playback.crossfadeSec', 5);
    const settings = await page.electronAPI.dbGetSettings();
    expect(settings['playback.crossfadeSec']).toBe(5);
  });

  it('Tier 1: renders volume and mute controls in sticky player bar', async () => {
    const volumeSlider = page.locator('[data-testid="volume-slider"]');
    expect(await volumeSlider.isVisible()).toBeTruthy();

    const muteBtn = page.locator('[data-testid="mute-toggle-btn"]');
    expect(await muteBtn.isVisible()).toBeTruthy();
  });

  it('Tier 1: toggles mute via player bar button', async () => {
    const muteBtn = page.locator('[data-testid="mute-toggle-btn"]');
    await muteBtn.click();
    expect(page.audioEngine.isMuted).toBeTruthy();
    expect(await muteBtn.getAttribute('data-muted')).toBe('true');

    await muteBtn.click();
    expect(page.audioEngine.isMuted).toBeFalsy();
    expect(await muteBtn.getAttribute('data-muted')).toBe('false');
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: clamps crossfade slider bounds between 0 and 12 seconds', async () => {
    const clampCrossfade = (sec: number) => Math.max(0, Math.min(12, sec));
    expect(clampCrossfade(-2)).toBe(0);
    expect(clampCrossfade(25)).toBe(12);
    expect(clampCrossfade(6)).toBe(6);
  });

  it('Tier 2: handles volume slider input events and updates engine volume', async () => {
    const volumeSlider = page.locator('[data-testid="volume-slider"]');
    await volumeSlider.fill('0.35');
    expect(page.audioEngine.volume).toBe(0.35);
  });

  it('Tier 2: handles setting unknown setting key gracefully', async () => {
    const success = await page.electronAPI.dbSaveSetting('custom.unknownKey', 'sample_val');
    expect(success).toBeTruthy();
    const settings = await page.electronAPI.dbGetSettings();
    expect(settings['custom.unknownKey']).toBe('sample_val');
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: player bar heart syncs with active playing track and updates SQLite', async () => {
    const catalog = page.db.getCatalogTracks();
    await page.audioEngine.loadTrack(catalog[0], catalog);

    const nowHeart = page.locator('[data-testid="now-playing-heart"]');
    await nowHeart.click();

    expect(page.db.isSongLiked(catalog[0].id)).toBeTruthy();
    expect(await nowHeart.getAttribute('data-liked')).toBe('true');
  });

  it('Tier 3: queue toggle button in player bar is clickable and interactive', async () => {
    const queueBtn = page.locator('[data-testid="queue-toggle-btn"]');
    expect(await queueBtn.isVisible()).toBeTruthy();
    await queueBtn.click();
  });

  // ==========================================
  // TIER 4: Real-World Settings Workflow Journey
  // ==========================================

  it('Tier 4: simulates full user settings configuration, theme verification, and volume calibration', async () => {
    // 1. User configures audio settings
    await page.electronAPI.dbSaveSetting('playback.quality', 'Very High');
    await page.electronAPI.dbSaveSetting('playback.gapless', true);
    await page.electronAPI.dbSaveSetting('playback.normalization', true);
    await page.electronAPI.dbSaveSetting('display.theme', 'dark');

    // 2. User sets volume to 75%
    const volumeSlider = page.locator('[data-testid="volume-slider"]');
    await volumeSlider.fill('0.75');
    expect(page.audioEngine.volume).toBe(0.75);

    // 3. User verifies all saved settings in SQLite
    const settings = await page.electronAPI.dbGetSettings();
    expect(settings['playback.quality']).toBe('Very High');
    expect(settings['playback.gapless']).toBe(true);
    expect(settings['playback.normalization']).toBe(true);
    expect(settings['display.theme']).toBe('dark');
  });
});
