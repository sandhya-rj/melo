import { describe, it, beforeEach, expect } from '../helpers/test-utils.ts';
import { VirtualPage } from '../helpers/playwright-compat.ts';

describe('E2E: Screen Views Rendering & Presentation', () => {
  let page: VirtualPage;

  beforeEach(() => {
    page = new VirtualPage();
  });

  // ==========================================
  // TIER 1: Feature Coverage (Views Rendering)
  // ==========================================

  it('Tier 1: renders Home View with greeting and 6-card recent grid', async () => {
    const homeView = page.locator('[data-testid="home-view"]');
    expect(await homeView.isVisible()).toBeTruthy();

    const greeting = page.locator('[data-testid="home-greeting"]');
    expect(await greeting.textContent()).toContain('Good');

    const recentGrid = page.locator('[data-testid="recent-grid"]');
    expect(await recentGrid.isVisible()).toBeTruthy();

    // Verify 6 recent cards
    for (let i = 1; i <= 6; i++) {
      const card = page.locator(`[data-testid="recent-card-${i}"]`);
      expect(await card.isVisible()).toBeTruthy();
    }
  });

  it('Tier 1: renders Search & Browse View with category gradient tiles', async () => {
    const browseGrid = page.locator('[data-testid="browse-categories"]');
    expect(await browseGrid.isVisible()).toBeTruthy();

    const musicCard = page.locator('[data-testid="category-card-music"]');
    expect(await musicCard.isVisible()).toBeTruthy();
    expect(await musicCard.textContent()).toBe('Music');

    const podcastCard = page.locator('[data-testid="category-card-podcasts"]');
    expect(await podcastCard.isVisible()).toBeTruthy();
    expect(await podcastCard.textContent()).toBe('Podcasts');
  });

  it('Tier 1: renders Playlist View with hero header and track table', async () => {
    const plHero = page.locator('[data-testid="playlist-hero"]');
    expect(await plHero.isVisible()).toBeTruthy();

    const plTitle = page.locator('[data-testid="playlist-title"]');
    expect(await plTitle.textContent()).toBe("Today's Top Hits");

    const trackTable = page.locator('[data-testid="track-table"]');
    expect(await trackTable.isVisible()).toBeTruthy();
  });

  it('Tier 1: renders all sample tracks in track table', async () => {
    const track1 = page.locator('[data-testid="track-row-trk_01"]');
    const track2 = page.locator('[data-testid="track-row-trk_02"]');
    const track3 = page.locator('[data-testid="track-row-trk_03"]');

    expect(await track1.isVisible()).toBeTruthy();
    expect(await track2.isVisible()).toBeTruthy();
    expect(await track3.isVisible()).toBeTruthy();
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: renders all 8 standard category cards without clipping', async () => {
    const categories = ['music', 'podcasts', 'live-events', 'made-for-you', 'new-releases', 'pop', 'hip-hop', 'rock'];
    for (const cat of categories) {
      const card = page.locator(`[data-testid="category-card-${cat}"]`);
      expect(await card.isVisible()).toBeTruthy();
    }
  });

  it('Tier 2: handles empty search category click safely', async () => {
    const rockCard = page.locator('[data-testid="category-card-rock"]');
    await rockCard.click();
    // Remains on page or navigates cleanly
    expect(await page.locator('[data-testid="main-canvas"]').isVisible()).toBeTruthy();
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: clicking play button on track row loads track into AudioEngine and updates PlayerBar', async () => {
    const playBtn = page.locator('[data-testid="track-play-trk_01"]');
    await playBtn.click();

    expect(page.audioEngine.playbackState).toBe('PLAYING');
    expect(page.audioEngine.currentTrack?.id).toBe('trk_01');
    expect(page.audioEngine.currentTrack?.title).toBe('Retro Groove');
  });

  it('Tier 3: clicking heart on track row toggles SQLite liked status and data-liked attribute', async () => {
    const heartBtn = page.locator('[data-testid="track-heart-trk_01"]');
    expect(await heartBtn.getAttribute('data-liked')).toBeNull();

    await heartBtn.click();
    expect(await heartBtn.getAttribute('data-liked')).toBe('true');
    expect(page.db.isSongLiked('trk_01')).toBeTruthy();

    await heartBtn.click();
    expect(await heartBtn.getAttribute('data-liked')).toBe('false');
    expect(page.db.isSongLiked('trk_01')).toBeFalsy();
  });

  // ==========================================
  // TIER 4: Real-World View Browsing Journey
  // ==========================================

  it('Tier 4: simulates full browsing flow: Home -> Search -> Play track -> Like track', async () => {
    // 1. User arrives on Home view
    expect(await page.locator('[data-testid="home-view"]').isVisible()).toBeTruthy();

    // 2. User checks out recent music
    const card1 = page.locator('[data-testid="recent-card-1"]');
    expect(await card1.isVisible()).toBeTruthy();

    // 3. User navigates to playlist view and plays track 2
    const playTrack2 = page.locator('[data-testid="track-play-trk_02"]');
    await playTrack2.click();
    expect(page.audioEngine.currentTrack?.id).toBe('trk_02');

    // 4. User likes track 2
    const heartTrack2 = page.locator('[data-testid="track-heart-trk_02"]');
    await heartTrack2.click();
    expect(page.db.isSongLiked('trk_02')).toBeTruthy();
  });
});
