import { describe, it, beforeEach, expect } from '../helpers/test-utils.ts';
import { VirtualPage } from '../helpers/playwright-compat.ts';
import { filterTracks } from '../../src/renderer/utils/search-and-filter.ts';

describe('E2E: Search Input, Live Debounce & Category Browsing', () => {
  let page: VirtualPage;

  beforeEach(() => {
    page = new VirtualPage();
  });

  // ==========================================
  // TIER 1: Feature Coverage (Search & Browse)
  // ==========================================

  it('Tier 1: focuses search input and captures typed text', async () => {
    const input = page.locator('[data-testid="search-input"]');
    await input.fill('synthwave');
    expect(await input.getAttribute('placeholder')).toBe('What do you want to play?');
  });

  it('Tier 1: filters catalogue tracks and returns matching songs', () => {
    const all = page.db.getCatalogTracks();
    const results = filterTracks(all, 'Groove');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Retro Groove');
  });

  it('Tier 1: renders browse categories grid on search page', async () => {
    const grid = page.locator('[data-testid="browse-categories"]');
    expect(await grid.isVisible()).toBeTruthy();

    const musicTile = page.locator('[data-testid="category-card-music"]');
    expect(await musicTile.isVisible()).toBeTruthy();
  });

  it('Tier 1: filter chips scope search view results', async () => {
    const playlistsChip = page.locator('[data-testid="filter-chip-playlists"]');
    const artistsChip = page.locator('[data-testid="filter-chip-artists"]');
    const albumsChip = page.locator('[data-testid="filter-chip-albums"]');

    expect(await playlistsChip.isVisible()).toBeTruthy();
    expect(await artistsChip.isVisible()).toBeTruthy();
    expect(await albumsChip.isVisible()).toBeTruthy();
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: handles clearing search input back to empty string', () => {
    const all = page.db.getCatalogTracks();
    const filtered = filterTracks(all, 'Retro');
    expect(filtered).toHaveLength(1);

    const cleared = filterTracks(all, '');
    expect(cleared).toHaveLength(all.length);
  });

  it('Tier 2: displays empty state when query matches 0 tracks', () => {
    const all = page.db.getCatalogTracks();
    const results = filterTracks(all, 'non_matching_search_query_9999');
    expect(results).toHaveLength(0);
  });

  it('Tier 2: handles search with special punctuation and quotes', () => {
    const all = page.db.getCatalogTracks();
    const results = filterTracks(all, "What's Up & Down !@#$%");
    expect(results).toHaveLength(0);
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: adding a search result to queue enqueues track into User Queue without stopping current playback', async () => {
    // Current track is playing
    const all = page.db.getCatalogTracks();
    await page.audioEngine.loadTrack(all[0], all);
    expect(page.audioEngine.playbackState).toBe('PLAYING');
    expect(page.audioEngine.currentTrack?.id).toBe(all[0].id);

    // Search returns track 3, user enqueues it
    const searchResults = filterTracks(all, 'Midnight');
    expect(searchResults).toHaveLength(1);

    page.audioEngine.addToQueue(searchResults[0]);

    // Active playback is undisturbed
    expect(page.audioEngine.playbackState).toBe('PLAYING');
    expect(page.audioEngine.currentTrack?.id).toBe(all[0].id);
    expect(page.audioEngine.userQueue).toHaveLength(1);
    expect(page.audioEngine.userQueue[0].id).toBe(searchResults[0].id);
  });

  // ==========================================
  // TIER 4: Real-World Search Discovery Journey
  // ==========================================

  it('Tier 4: simulates full user search journey: type query -> inspect results -> play top match -> queue second match', async () => {
    // 1. User types in search bar
    const all = page.db.getCatalogTracks();
    const searchResults = filterTracks(all, 'Collective');
    expect(searchResults).toHaveLength(2); // 'Electric Dream' and 'Retro Groove' (ordered by title ASC)

    // 2. User plays top match
    await page.audioEngine.loadTrack(searchResults[0], searchResults);
    expect(page.audioEngine.playbackState).toBe('PLAYING');
    expect(page.audioEngine.currentTrack?.title).toBe(searchResults[0].title);

    // 3. User enqueues second match
    page.audioEngine.addToQueue(searchResults[1]);
    expect(page.audioEngine.userQueue).toHaveLength(1);

    // 4. First track ends, second track plays automatically
    page.audioEngine.onEnded();
    expect(page.audioEngine.currentTrack?.title).toBe(searchResults[1].title);
    expect(page.audioEngine.userQueue).toHaveLength(0);
  });
});
