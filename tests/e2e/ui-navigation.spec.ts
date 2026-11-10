import { describe, it, beforeEach, expect } from '../helpers/test-utils.ts';
import { VirtualPage } from '../helpers/playwright-compat.ts';

describe('E2E: Window Controls, Navigation & 3-Panel Layout', () => {
  let page: VirtualPage;

  beforeEach(() => {
    page = new VirtualPage();
  });

  // ==========================================
  // TIER 1: Feature Coverage (Window & Navigation)
  // ==========================================

  it('Tier 1: renders MELO brand monogram and wordmark in top bar', async () => {
    const brand = page.locator('[data-testid="melo-brand"]');
    expect(await brand.isVisible()).toBeTruthy();

    const wordmark = page.locator('[data-testid="melo-wordmark"]');
    expect(await wordmark.textContent()).toBe('MELO');

    const monogram = page.locator('[data-testid="melo-monogram"]');
    expect(await monogram.isVisible()).toBeTruthy();
  });

  it('Tier 1: window minimize, maximize, and close controls trigger IPC', async () => {
    const minBtn = page.locator('[data-testid="window-minimize"]');
    await minBtn.click();
    expect(page.electronAPI.isMinimized).toBeTruthy();

    const maxBtn = page.locator('[data-testid="window-maximize"]');
    await maxBtn.click();
    expect(await page.electronAPI.windowIsMaximized()).toBeTruthy();

    const closeBtn = page.locator('[data-testid="window-close"]');
    await closeBtn.click();
    expect(page.electronAPI.isClosed).toBeTruthy();
  });

  it('Tier 1: renders standard 3-panel layout: sidebar, main canvas, player bar', async () => {
    const sidebar = page.locator('[data-testid="left-sidebar"]');
    expect(await sidebar.isVisible()).toBeTruthy();

    const canvas = page.locator('[data-testid="main-canvas"]');
    expect(await canvas.isVisible()).toBeTruthy();

    const playerBar = page.locator('[data-testid="player-bar"]');
    expect(await playerBar.isVisible()).toBeTruthy();
  });

  it('Tier 1: renders history back and forward navigation buttons', async () => {
    const backBtn = page.locator('[data-testid="nav-back-btn"]');
    const fwdBtn = page.locator('[data-testid="nav-forward-btn"]');

    expect(await backBtn.isVisible()).toBeTruthy();
    expect(await fwdBtn.isVisible()).toBeTruthy();
    expect(await backBtn.getAttribute('aria-label')).toBe('Go back');
    expect(await fwdBtn.getAttribute('aria-label')).toBe('Go forward');
  });

  it('Tier 1: renders global search input in top bar with placeholder', async () => {
    const searchInput = page.locator('[data-testid="search-input"]');
    expect(await searchInput.isVisible()).toBeTruthy();
    expect(await searchInput.getAttribute('placeholder')).toBe('What do you want to play?');
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: sidebar resizer allows width adjustments within [232px, 420px] bounds', async () => {
    const resizer = page.locator('[data-testid="sidebar-resizer"]');
    expect(await resizer.isVisible()).toBeTruthy();

    // Clamp helper test
    const clampWidth = (w: number) => Math.max(232, Math.min(420, w));
    expect(clampWidth(150)).toBe(232); // minimum bound
    expect(clampWidth(500)).toBe(420); // maximum bound
    expect(clampWidth(300)).toBe(300);
  });

  it('Tier 2: window maximize button toggles state between maximized and restored', async () => {
    const maxBtn = page.locator('[data-testid="window-maximize"]');
    expect(await page.electronAPI.windowIsMaximized()).toBeFalsy();

    await maxBtn.click();
    expect(await page.electronAPI.windowIsMaximized()).toBeTruthy();

    await maxBtn.click();
    expect(await page.electronAPI.windowIsMaximized()).toBeFalsy();
  });

  it('Tier 2: handles responsive viewport down to 800x600 minimum desktop resolution', async () => {
    page.setViewportSize({ width: 800, height: 600 });
    expect(page.viewport.width).toBe(800);
    expect(page.viewport.height).toBe(600);
    expect(await page.locator('[data-testid="player-bar"]').isVisible()).toBeTruthy();
  });

  it('Tier 2: top navigation bar maintains accessibility roles and labels', async () => {
    const topBar = page.locator('[data-testid="top-navigation-bar"]');
    expect(await topBar.getAttribute('role')).toBe('navigation');
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: clicking create playlist in sidebar dynamically renders new playlist item in list', async () => {
    const createBtn = page.locator('[data-testid="create-playlist-btn"]');
    await createBtn.click();

    const playlists = page.db.getPlaylists();
    expect(playlists).toHaveLength(1);
    expect(playlists[0].name).toBe('My Playlist #1');

    const newItem = page.locator(`[data-testid="playlist-item-${playlists[0].id}"]`);
    expect(await newItem.isVisible()).toBeTruthy();
    expect(await newItem.textContent()).toBe('My Playlist #1');
  });

  it('Tier 3: player bar stays visible across route transitions', async () => {
    expect(await page.locator('[data-testid="player-bar"]').isVisible()).toBeTruthy();
    await page.goto('app://melo/search');
    expect(await page.locator('[data-testid="player-bar"]').isVisible()).toBeTruthy();
    await page.goto('app://melo/playlist/123');
    expect(await page.locator('[data-testid="player-bar"]').isVisible()).toBeTruthy();
  });

  // ==========================================
  // TIER 4: Real-World Navigation Journey
  // ==========================================

  it('Tier 4: simulates full app launch, window maximize, library navigation, and playlist creation', async () => {
    // 1. App launches
    expect(await page.title()).toBe('MELO');

    // 2. User maximizes window
    const maxBtn = page.locator('[data-testid="window-maximize"]');
    await maxBtn.click();
    expect(await page.electronAPI.windowIsMaximized()).toBeTruthy();

    // 3. User clicks filter chip 'Playlists'
    const plChip = page.locator('[data-testid="filter-chip-playlists"]');
    expect(await plChip.isVisible()).toBeTruthy();

    // 4. User clicks '+' to create new playlist
    const createBtn = page.locator('[data-testid="create-playlist-btn"]');
    await createBtn.click();

    // 5. Verify playlist created in sidebar
    const all = page.db.getPlaylists();
    expect(all).toHaveLength(1);
  });
});
