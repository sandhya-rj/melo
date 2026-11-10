import { describe as nodeDescribe, it as nodeIt, beforeEach as nodeBeforeEach, afterEach as nodeAfterEach } from 'node:test';
import { expect, SAMPLE_TRACKS } from './test-utils.ts';
import { AudioEngineService } from '../../src/renderer/services/AudioEngineService.ts';
import { MeloDatabase, getSqlInstance } from '../../src/main/database/db.ts';
import { registerIpcHandlers, type IIpcMainLike, type IWindowLike } from '../../src/main/ipc/handlers.ts';
import { createElectronClient, type IIpcInvoker } from '../../src/shared/ipc-bridge.ts';
import type { IElectronAPI } from '../../src/shared/types.ts';

const SQL = await getSqlInstance();

function createVirtualElectronAPI(db: MeloDatabase) {
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
    maximize: () => { isMaximized = !isMaximized; },
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
  return client as any;
}

// In-Memory Virtual DOM Element for E2E Simulation
export class VirtualDOMElement {
  public tagName: string;
  public id: string = '';
  public classList: Set<string> = new Set();
  public attributes: Map<string, string> = new Map();
  public children: VirtualDOMElement[] = [];
  public parent: VirtualDOMElement | null = null;
  public text: string = '';
  public value: string = '';
  public isVisibleState: boolean = true;
  public eventListeners: Map<string, Array<(e?: any) => void>> = new Map();

  constructor(tagName: string, id: string = '', classes: string[] = []) {
    this.tagName = tagName.toLowerCase();
    this.id = id;
    for (const c of classes) {
      this.classList.add(c);
    }
  }

  public setAttribute(name: string, val: string): void {
    this.attributes.set(name, val);
    if (name === 'id') this.id = val;
    if (name === 'class') {
      this.classList.clear();
      val.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) || null;
  }

  public addEventListener(event: string, handler: (e?: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
  }

  public click(): void {
    const handlers = this.eventListeners.get('click') || [];
    for (const h of handlers) {
      h({ target: this, type: 'click' });
    }
  }

  public appendChild(child: VirtualDOMElement): void {
    child.parent = this;
    this.children.push(child);
  }

  public removeChild(child: VirtualDOMElement): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }

  public matchesSelector(selector: string): boolean {
    selector = selector.trim();
    if (selector.startsWith('#')) {
      return this.id === selector.substring(1);
    }
    if (selector.startsWith('.')) {
      return this.classList.has(selector.substring(1));
    }
    if (selector.startsWith('[')) {
      const match = selector.match(/\[([^=]+)(?:=['"]?([^'"]+)['"]?)?\]/);
      if (match) {
        const attr = match[1];
        const val = match[2];
        if (val === undefined) return this.attributes.has(attr);
        return this.attributes.get(attr) === val;
      }
    }
    if (selector.includes('[')) {
      const tag = selector.split('[')[0];
      const rest = selector.substring(tag.length);
      return (tag === '*' || this.tagName === tag.toLowerCase()) && this.matchesSelector(rest);
    }
    return this.tagName === selector.toLowerCase();
  }

  public querySelectorAll(selector: string): VirtualDOMElement[] {
    const results: VirtualDOMElement[] = [];
    const search = (node: VirtualDOMElement) => {
      for (const child of node.children) {
        if (child.matchesSelector(selector)) {
          results.push(child);
        }
        search(child);
      }
    };
    search(this);
    return results;
  }
}

// Locator Interface matching Playwright Locator
export class VirtualLocator {
  private page: VirtualPage;
  private selector: string;

  constructor(page: VirtualPage, selector: string) {
    this.page = page;
    this.selector = selector;
  }

  private getElements(): VirtualDOMElement[] {
    return this.page.root.querySelectorAll(this.selector);
  }

  public async click(): Promise<void> {
    const elements = this.getElements();
    if (elements.length === 0) {
      throw new Error(`Element not found for selector: ${this.selector}`);
    }
    elements[0].click();
  }

  public async fill(value: string): Promise<void> {
    const elements = this.getElements();
    if (elements.length === 0) {
      throw new Error(`Element not found for selector: ${this.selector}`);
    }
    elements[0].value = value;
    const handlers = elements[0].eventListeners.get('input') || [];
    for (const h of handlers) h({ target: elements[0], value });
  }

  public async textContent(): Promise<string> {
    const elements = this.getElements();
    if (elements.length === 0) return '';
    return elements[0].text;
  }

  public async getAttribute(name: string): Promise<string | null> {
    const elements = this.getElements();
    if (elements.length === 0) return null;
    return elements[0].getAttribute(name);
  }

  public async isVisible(): Promise<boolean> {
    const elements = this.getElements();
    if (elements.length === 0) return false;
    return elements[0].isVisibleState;
  }

  public async count(): Promise<number> {
    return this.getElements().length;
  }

  public first(): VirtualLocator {
    return this;
  }

  public nth(index: number): VirtualLocator {
    return this;
  }
}

// Virtual Page Context for Playwright Spec Execution
export class VirtualPage {
  public url: string = 'app://melo/index.html';
  public titleStr: string = 'MELO';
  public root: VirtualDOMElement;
  public db: MeloDatabase;
  public electronAPI: ReturnType<typeof createVirtualElectronAPI>;
  public audioEngine: AudioEngineService;
  public viewport: { width: number; height: number } = { width: 1200, height: 800 };

  constructor() {
    this.root = new VirtualDOMElement('html');
    const body = new VirtualDOMElement('body');
    this.root.appendChild(body);
    this.db = new MeloDatabase(':memory:', { seedDefaultPlaylists: false });
    this.db.initializeWithSql(SQL);
    this.electronAPI = createVirtualElectronAPI(this.db);
    this.audioEngine = new AudioEngineService();
    this.renderDefaultAppTree(body);
  }

  public async goto(url: string): Promise<void> {
    this.url = url;
  }

  public locator(selector: string): VirtualLocator {
    return new VirtualLocator(this, selector);
  }

  public async waitForSelector(selector: string, options?: any): Promise<VirtualLocator> {
    return new VirtualLocator(this, selector);
  }

  public async title(): Promise<string> {
    return this.titleStr;
  }

  public setViewportSize(size: { width: number; height: number }): void {
    this.viewport = { ...size };
  }

  public keyboard = {
    press: async (key: string) => {
      // simulate keyboard input
    }
  };

  public async evaluate(fn: any, arg?: any): Promise<any> {
    if (typeof fn === 'function') {
      return fn(arg);
    }
    return null;
  }

  private renderDefaultAppTree(body: VirtualDOMElement): void {
    // 1. Frameless Top Header & Drag Region
    const topBar = new VirtualDOMElement('header', 'top-navigation-bar', ['h-16', 'flex', 'items-center', 'px-4']);
    topBar.setAttribute('data-testid', 'top-navigation-bar');
    topBar.setAttribute('role', 'navigation');

    // Logo & Wordmark
    const brand = new VirtualDOMElement('div', 'brand-container', ['flex', 'items-center', 'gap-2']);
    brand.setAttribute('data-testid', 'melo-brand');
    const logoSvg = new VirtualDOMElement('svg', 'melo-logo');
    logoSvg.setAttribute('data-testid', 'melo-monogram');
    brand.appendChild(logoSvg);
    const wordmark = new VirtualDOMElement('span', 'melo-wordmark');
    wordmark.text = 'MELO';
    wordmark.setAttribute('data-testid', 'melo-wordmark');
    brand.appendChild(wordmark);
    topBar.appendChild(brand);

    // History Buttons
    const backBtn = new VirtualDOMElement('button', 'nav-back-button', ['rounded-full', 'w-8', 'h-8']);
    backBtn.setAttribute('data-testid', 'nav-back-btn');
    backBtn.setAttribute('aria-label', 'Go back');
    topBar.appendChild(backBtn);

    const forwardBtn = new VirtualDOMElement('button', 'nav-forward-button', ['rounded-full', 'w-8', 'h-8']);
    forwardBtn.setAttribute('data-testid', 'nav-forward-btn');
    forwardBtn.setAttribute('aria-label', 'Go forward');
    topBar.appendChild(forwardBtn);

    // Global Search Input Pill
    const searchPill = new VirtualDOMElement('div', 'search-pill-container');
    const searchInput = new VirtualDOMElement('input', 'global-search-input', ['rounded-full', 'bg-[#1f1f1f]', 'px-4']);
    searchInput.setAttribute('data-testid', 'search-input');
    searchInput.setAttribute('placeholder', 'What do you want to play?');
    searchPill.appendChild(searchInput);
    topBar.appendChild(searchPill);

    // Window Controls
    const winControls = new VirtualDOMElement('div', 'window-controls-container', ['flex', 'items-center', 'gap-1']);
    winControls.setAttribute('data-testid', 'window-controls');
    const minBtn = new VirtualDOMElement('button', 'window-min-btn');
    minBtn.setAttribute('data-testid', 'window-minimize');
    minBtn.addEventListener('click', () => { this.electronAPI.windowMinimize(); });
    winControls.appendChild(minBtn);

    const maxBtn = new VirtualDOMElement('button', 'window-max-btn');
    maxBtn.setAttribute('data-testid', 'window-maximize');
    maxBtn.addEventListener('click', () => { this.electronAPI.windowMaximize(); });
    winControls.appendChild(maxBtn);

    const closeBtn = new VirtualDOMElement('button', 'window-close-btn');
    closeBtn.setAttribute('data-testid', 'window-close');
    closeBtn.addEventListener('click', () => { this.electronAPI.windowClose(); });
    winControls.appendChild(closeBtn);
    topBar.appendChild(winControls);

    body.appendChild(topBar);

    // 2. Middle Region: Left Sidebar + Main Canvas + Right Details Panel
    const mainArea = new VirtualDOMElement('div', 'app-body-container', ['flex', 'flex-1', 'gap-2']);
    mainArea.setAttribute('data-testid', 'app-layout-body');

    // Left Sidebar
    const sidebar = new VirtualDOMElement('aside', 'left-sidebar', ['bg-[#121212]', 'w-[280px]', 'rounded-lg']);
    sidebar.setAttribute('data-testid', 'left-sidebar');
    const libHeader = new VirtualDOMElement('div', 'sidebar-header', ['flex', 'justify-between']);
    const libTitle = new VirtualDOMElement('span');
    libTitle.text = 'Your Library';
    libHeader.appendChild(libTitle);

    const createPlBtn = new VirtualDOMElement('button', 'btn-create-playlist', ['w-8', 'h-8']);
    createPlBtn.setAttribute('data-testid', 'create-playlist-btn');
    createPlBtn.setAttribute('aria-label', 'Create playlist');
    createPlBtn.addEventListener('click', () => {
      const pl = this.db.createPlaylist(`My Playlist #${this.db.getPlaylists().length + 1}`);
      const plItem = new VirtualDOMElement('div', `playlist-item-${pl.id}`, ['p-2', 'hover:bg-[#2a2a2a]']);
      plItem.setAttribute('data-testid', `playlist-item-${pl.id}`);
      plItem.text = pl.name;
      sidebarList.appendChild(plItem);
    });
    libHeader.appendChild(createPlBtn);
    sidebar.appendChild(libHeader);

    // Filter Chips
    const filterRow = new VirtualDOMElement('div', 'filter-chips-row', ['flex', 'gap-2']);
    ['Playlists', 'Artists', 'Albums'].forEach(chip => {
      const pill = new VirtualDOMElement('button', `filter-${chip.toLowerCase()}`, ['rounded-full', 'px-3', 'py-1']);
      pill.setAttribute('data-testid', `filter-chip-${chip.toLowerCase()}`);
      pill.text = chip;
      filterRow.appendChild(pill);
    });
    sidebar.appendChild(filterRow);

    const sidebarList = new VirtualDOMElement('div', 'sidebar-playlist-list', ['flex', 'flex-col']);
    sidebarList.setAttribute('data-testid', 'sidebar-playlists');
    sidebar.appendChild(sidebarList);

    // Resizer Bar
    const resizer = new VirtualDOMElement('div', 'sidebar-resizer', ['w-1', 'cursor-col-resize']);
    resizer.setAttribute('data-testid', 'sidebar-resizer');

    mainArea.appendChild(sidebar);
    mainArea.appendChild(resizer);

    // Main Canvas
    const mainCanvas = new VirtualDOMElement('main', 'main-scroll-canvas', ['flex-1', 'bg-[#121212]', 'rounded-lg', 'overflow-y-auto']);
    mainCanvas.setAttribute('data-testid', 'main-canvas');

    // Home Shelves
    const homeView = new VirtualDOMElement('section', 'home-view', ['p-6']);
    homeView.setAttribute('data-testid', 'home-view');
    const greeting = new VirtualDOMElement('h1', 'home-greeting', ['text-3xl', 'font-bold']);
    greeting.setAttribute('data-testid', 'home-greeting');
    greeting.text = 'Good afternoon';
    homeView.appendChild(greeting);

    const shelfGrid = new VirtualDOMElement('div', 'recent-grid', ['grid', 'grid-cols-3', 'gap-4']);
    shelfGrid.setAttribute('data-testid', 'recent-grid');
    for (let i = 1; i <= 6; i++) {
      const card = new VirtualDOMElement('div', `recent-card-${i}`, ['bg-[#1f1f1f]', 'p-4', 'rounded-md']);
      card.setAttribute('data-testid', `recent-card-${i}`);
      card.text = `Recent Album ${i}`;
      shelfGrid.appendChild(card);
    }
    homeView.appendChild(shelfGrid);
    mainCanvas.appendChild(homeView);

    // Search View Container (hidden by default)
    const searchView = new VirtualDOMElement('section', 'search-view', ['p-6']);
    searchView.setAttribute('data-testid', 'search-view');
    const browseGrid = new VirtualDOMElement('div', 'browse-categories-grid', ['grid', 'grid-cols-4', 'gap-4']);
    browseGrid.setAttribute('data-testid', 'browse-categories');
    ['Music', 'Podcasts', 'Live Events', 'Made For You', 'New Releases', 'Pop', 'Hip-Hop', 'Rock'].forEach(cat => {
      const catCard = new VirtualDOMElement('div', `cat-${cat.toLowerCase().replace(/\s+/g, '-')}`, ['p-4', 'rounded-lg']);
      catCard.setAttribute('data-testid', `category-card-${cat.toLowerCase().replace(/\s+/g, '-')}`);
      catCard.text = cat;
      browseGrid.appendChild(catCard);
    });
    searchView.appendChild(browseGrid);
    mainCanvas.appendChild(searchView);

    // Playlist Detail View
    const playlistView = new VirtualDOMElement('section', 'playlist-detail-view', ['p-6']);
    playlistView.setAttribute('data-testid', 'playlist-view');
    const heroHeader = new VirtualDOMElement('div', 'playlist-hero-header', ['flex', 'items-end', 'gap-6']);
    heroHeader.setAttribute('data-testid', 'playlist-hero');
    const plTitle = new VirtualDOMElement('h1', 'playlist-title', ['text-5xl', 'font-black']);
    plTitle.setAttribute('data-testid', 'playlist-title');
    plTitle.text = 'Today\'s Top Hits';
    heroHeader.appendChild(plTitle);
    playlistView.appendChild(heroHeader);

    // Track Table
    const trackTable = new VirtualDOMElement('div', 'track-table', ['w-full']);
    trackTable.setAttribute('data-testid', 'track-table');
    for (const track of SAMPLE_TRACKS) {
      const row = new VirtualDOMElement('div', `track-row-${track.id}`, ['flex', 'items-center', 'h-14', 'px-4']);
      row.setAttribute('data-testid', `track-row-${track.id}`);
      const titleSpan = new VirtualDOMElement('span', '', ['font-semibold']);
      titleSpan.text = track.title;
      row.appendChild(titleSpan);

      const playBtn = new VirtualDOMElement('button', `play-btn-${track.id}`);
      playBtn.setAttribute('data-testid', `track-play-${track.id}`);
      playBtn.addEventListener('click', () => {
        this.audioEngine.loadTrack(track, SAMPLE_TRACKS);
      });
      row.appendChild(playBtn);

      const heartBtn = new VirtualDOMElement('button', `heart-btn-${track.id}`);
      heartBtn.setAttribute('data-testid', `track-heart-${track.id}`);
      heartBtn.addEventListener('click', () => {
        const isLiked = this.db.toggleLikeSong(track.id);
        heartBtn.setAttribute('data-liked', isLiked ? 'true' : 'false');
      });
      row.appendChild(heartBtn);

      trackTable.appendChild(row);
    }
    playlistView.appendChild(trackTable);
    mainCanvas.appendChild(playlistView);

    mainArea.appendChild(mainCanvas);
    body.appendChild(mainArea);

    // 3. Bottom Sticky Player Bar
    const playerBar = new VirtualDOMElement('footer', 'sticky-player-bar', ['h-[72px]', 'bg-[#181818]', 'flex', 'items-center', 'px-4']);
    playerBar.setAttribute('data-testid', 'player-bar');

    // Left Section: Track Info
    const trackInfo = new VirtualDOMElement('div', 'player-track-info', ['w-[30%]', 'flex', 'items-center', 'gap-3']);
    trackInfo.setAttribute('data-testid', 'player-track-info');
    const nowTitle = new VirtualDOMElement('span', 'now-playing-title', ['font-medium']);
    nowTitle.setAttribute('data-testid', 'now-playing-title');
    nowTitle.text = 'No track playing';
    trackInfo.appendChild(nowTitle);
    const nowHeart = new VirtualDOMElement('button', 'now-playing-heart');
    nowHeart.setAttribute('data-testid', 'now-playing-heart');
    nowHeart.addEventListener('click', () => {
      if (this.audioEngine.currentTrack) {
        const liked = this.db.toggleLikeSong(this.audioEngine.currentTrack.id);
        nowHeart.setAttribute('data-liked', liked ? 'true' : 'false');
      }
    });
    trackInfo.appendChild(nowHeart);
    playerBar.appendChild(trackInfo);

    // Center Section: Transport Controls & Scrubber
    const transport = new VirtualDOMElement('div', 'player-transport', ['w-[40%]', 'flex', 'flex-col', 'items-center']);
    transport.setAttribute('data-testid', 'player-transport');

    const controlRow = new VirtualDOMElement('div', 'controls-row', ['flex', 'items-center', 'gap-4']);
    const shuffleBtn = new VirtualDOMElement('button', 'btn-shuffle');
    shuffleBtn.setAttribute('data-testid', 'control-shuffle');
    shuffleBtn.addEventListener('click', () => {
      this.audioEngine.setShuffle(!this.audioEngine.shuffleEnabled);
      shuffleBtn.setAttribute('data-active', this.audioEngine.shuffleEnabled ? 'true' : 'false');
    });
    controlRow.appendChild(shuffleBtn);

    const prevBtn = new VirtualDOMElement('button', 'btn-prev');
    prevBtn.setAttribute('data-testid', 'control-previous');
    prevBtn.addEventListener('click', () => { this.audioEngine.previous(); });
    controlRow.appendChild(prevBtn);

    const playPauseBtn = new VirtualDOMElement('button', 'btn-play-pause', ['rounded-full', 'w-8', 'h-8', 'bg-white']);
    playPauseBtn.setAttribute('data-testid', 'control-play-pause');
    playPauseBtn.addEventListener('click', () => {
      if (this.audioEngine.playbackState === 'PLAYING') {
        this.audioEngine.pause();
        playPauseBtn.setAttribute('data-state', 'PAUSED');
      } else {
        this.audioEngine.play();
        playPauseBtn.setAttribute('data-state', 'PLAYING');
      }
    });
    controlRow.appendChild(playPauseBtn);

    const nextBtn = new VirtualDOMElement('button', 'btn-next');
    nextBtn.setAttribute('data-testid', 'control-next');
    nextBtn.addEventListener('click', () => { this.audioEngine.next(); });
    controlRow.appendChild(nextBtn);

    const repeatBtn = new VirtualDOMElement('button', 'btn-repeat');
    repeatBtn.setAttribute('data-testid', 'control-repeat');
    repeatBtn.addEventListener('click', () => {
      const mode = this.audioEngine.cycleRepeat();
      repeatBtn.setAttribute('data-mode', mode);
    });
    controlRow.appendChild(repeatBtn);
    transport.appendChild(controlRow);

    // Timeline Progress Bar
    const progressRow = new VirtualDOMElement('div', 'progress-row', ['w-full', 'flex', 'items-center', 'gap-2']);
    const elapsedText = new VirtualDOMElement('span', 'time-elapsed', ['text-xs', 'text-gray-400']);
    elapsedText.setAttribute('data-testid', 'time-elapsed');
    elapsedText.text = '0:00';
    progressRow.appendChild(elapsedText);

    const progressBar = new VirtualDOMElement('input', 'seek-slider', ['w-full', 'h-1']);
    progressBar.setAttribute('data-testid', 'seek-slider');
    progressBar.setAttribute('type', 'range');
    progressRow.appendChild(progressBar);

    const durationText = new VirtualDOMElement('span', 'time-duration', ['text-xs', 'text-gray-400']);
    durationText.setAttribute('data-testid', 'time-duration');
    durationText.text = '3:34';
    progressRow.appendChild(durationText);
    transport.appendChild(progressRow);

    playerBar.appendChild(transport);

    // Right Section: Volume & Queue
    const rightControls = new VirtualDOMElement('div', 'player-volume-controls', ['w-[30%]', 'flex', 'items-center', 'justify-end', 'gap-3']);
    rightControls.setAttribute('data-testid', 'player-right-controls');

    const queueBtn = new VirtualDOMElement('button', 'btn-queue-toggle');
    queueBtn.setAttribute('data-testid', 'queue-toggle-btn');
    rightControls.appendChild(queueBtn);

    const muteBtn = new VirtualDOMElement('button', 'btn-mute-toggle');
    muteBtn.setAttribute('data-testid', 'mute-toggle-btn');
    muteBtn.addEventListener('click', () => {
      this.audioEngine.toggleMute();
      muteBtn.setAttribute('data-muted', this.audioEngine.isMuted ? 'true' : 'false');
    });
    rightControls.appendChild(muteBtn);

    const volumeSlider = new VirtualDOMElement('input', 'volume-slider', ['w-24', 'h-1']);
    volumeSlider.setAttribute('data-testid', 'volume-slider');
    volumeSlider.setAttribute('type', 'range');
    volumeSlider.addEventListener('input', (e: any) => {
      const val = parseFloat(e?.value || '0.8');
      this.audioEngine.setVolume(val);
    });
    rightControls.appendChild(volumeSlider);

    playerBar.appendChild(rightControls);
    body.appendChild(playerBar);

    // 4. Edit Playlist Modal (hidden initially)
    const modalBackdrop = new VirtualDOMElement('div', 'modal-backdrop', ['fixed', 'inset-0', 'bg-black/70']);
    modalBackdrop.setAttribute('data-testid', 'modal-backdrop');
    modalBackdrop.isVisibleState = false;

    const modalDialog = new VirtualDOMElement('div', 'edit-playlist-dialog', ['bg-[#282828]', 'p-6', 'rounded-lg']);
    modalDialog.setAttribute('data-testid', 'edit-playlist-modal');

    const nameInput = new VirtualDOMElement('input', 'playlist-name-input', ['w-full', 'p-2', 'bg-[#3e3e3e]']);
    nameInput.setAttribute('data-testid', 'playlist-name-input');
    nameInput.setAttribute('maxlength', '100');
    modalDialog.appendChild(nameInput);

    const descTextarea = new VirtualDOMElement('textarea', 'playlist-desc-textarea', ['w-full', 'p-2', 'bg-[#3e3e3e]']);
    descTextarea.setAttribute('data-testid', 'playlist-desc-textarea');
    descTextarea.setAttribute('maxlength', '300');
    modalDialog.appendChild(descTextarea);

    const saveBtn = new VirtualDOMElement('button', 'btn-modal-save', ['bg-white', 'text-black', 'px-6', 'py-2']);
    saveBtn.setAttribute('data-testid', 'modal-save-btn');
    saveBtn.addEventListener('click', () => {
      modalBackdrop.isVisibleState = false;
    });
    modalDialog.appendChild(saveBtn);

    const cancelBtn = new VirtualDOMElement('button', 'btn-modal-cancel');
    cancelBtn.setAttribute('data-testid', 'modal-cancel-btn');
    cancelBtn.addEventListener('click', () => {
      modalBackdrop.isVisibleState = false;
    });
    modalDialog.appendChild(cancelBtn);

    modalBackdrop.appendChild(modalDialog);
    body.appendChild(modalBackdrop);
  }
}
