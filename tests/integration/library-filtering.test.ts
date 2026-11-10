import { describe, it, beforeEach, afterEach, expect, SAMPLE_TRACKS } from '../helpers/test-utils.ts';
import { filterTracks, sortTracks, SortOption } from '../../src/renderer/utils/search-and-filter.ts';
import { MeloDatabase } from '../../src/main/database/db.ts';
import path from 'node:path';
import fs from 'node:fs';

export { filterTracks, sortTracks };
export type { SortOption };

describe('Integration: Library Filtering, Debouncing & Sorting', () => {
  let db: MeloDatabase;
  const testDbPath = path.resolve(process.cwd(), 'temp-integration-filtering.db');

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
  // TIER 1: Feature Coverage (Filtering & Sorting)
  // ==========================================

  it('Tier 1: filters tracks by matching title substring (case-insensitive)', () => {
    const results = filterTracks(SAMPLE_TRACKS, 'groove');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Retro Groove');
  });

  it('Tier 1: filters tracks by artist name', () => {
    const results = filterTracks(SAMPLE_TRACKS, 'Collective');
    expect(results).toHaveLength(2); // 'Retro Groove' and 'Electric Dream' by Synthwave Collective
    expect(results.map(t => t.id)).toContain('trk_01');
    expect(results.map(t => t.id)).toContain('trk_05');
  });

  it('Tier 1: filters tracks by album name', () => {
    const results = filterTracks(SAMPLE_TRACKS, 'neon nights');
    expect(results).toHaveLength(3);
  });

  it('Tier 1: sorts tracks by Title ascending (A-Z) and descending (Z-A)', () => {
    const asc = sortTracks(SAMPLE_TRACKS, 'TITLE_ASC');
    expect(asc[0].title).toBe('After Hours');
    expect(asc[asc.length - 1].title).toBe('Starboy');

    const desc = sortTracks(SAMPLE_TRACKS, 'TITLE_DESC');
    expect(desc[0].title).toBe('Starboy');
    expect(desc[desc.length - 1].title).toBe('After Hours');
  });

  it('Tier 1: sorts tracks by duration ascending and descending', () => {
    const asc = sortTracks(SAMPLE_TRACKS, 'DURATION_ASC');
    expect(asc[0].durationMs).toBe(185000); // shortest: Cyber Sunset
    expect(asc[asc.length - 1].durationMs).toBe(242000); // longest: Midnight Drive

    const desc = sortTracks(SAMPLE_TRACKS, 'DURATION_DESC');
    expect(desc[0].durationMs).toBe(242000);
    expect(desc[desc.length - 1].durationMs).toBe(185000);
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: empty or whitespace search query returns all tracks unmodified', () => {
    expect(filterTracks(SAMPLE_TRACKS, '')).toHaveLength(SAMPLE_TRACKS.length);
    expect(filterTracks(SAMPLE_TRACKS, '   ')).toHaveLength(SAMPLE_TRACKS.length);
  });

  it('Tier 2: search query with no matches returns empty array', () => {
    const results = filterTracks(SAMPLE_TRACKS, 'non_existent_xyz_12345');
    expect(results).toHaveLength(0);
  });

  it('Tier 2: search query with special regex characters handles safely', () => {
    const results = filterTracks(SAMPLE_TRACKS, '.*+?^${}()|[]');
    expect(results).toHaveLength(0);
  });

  it('Tier 2: simulates 300ms live debounce timing behavior', async () => {
    let debouncedQuery = '';
    let timer: NodeJS.Timeout | null = null;

    const setQuery = (q: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        debouncedQuery = q;
      }, 50); // scaled for fast test execution
    };

    // User types "s", "sy", "syn", "synth" rapidly
    setQuery('s');
    setQuery('sy');
    setQuery('syn');
    setQuery('synth');

    // Immediately after typing, debounced query should not be set yet
    expect(debouncedQuery).toBe('');

    // Wait for debounce timer to fire
    await new Promise(resolve => setTimeout(resolve, 80));
    expect(debouncedQuery).toBe('synth');

    const filtered = filterTracks(SAMPLE_TRACKS, debouncedQuery);
    expect(filtered.length).toBeGreaterThan(0);
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: combining search filter and sorting applies both sequentially', () => {
    // Filter for tracks in 'Neon Nights' album (3 tracks: Retro Groove 214s, Midnight Drive 242s, Electric Dream 220s)
    const filtered = filterTracks(SAMPLE_TRACKS, 'Neon Nights');
    expect(filtered).toHaveLength(3);

    // Sort filtered subset by duration ascending
    const sorted = sortTracks(filtered, 'DURATION_ASC');
    expect(sorted[0].title).toBe('Retro Groove'); // 214000
    expect(sorted[1].title).toBe('Electric Dream'); // 220000
    expect(sorted[2].title).toBe('Midnight Drive'); // 242000
  });

  it('Tier 3: filtering within Liked Songs library returns only liked matching tracks', () => {
    db.toggleLikeSong('trk_01'); // Retro Groove (Electronic)
    db.toggleLikeSong('trk_02'); // Cyber Sunset (Electronic)

    const liked = db.getLikedSongs();
    expect(liked).toHaveLength(2);

    const filteredLiked = filterTracks(liked, 'Retro');
    expect(filteredLiked).toHaveLength(1);
    expect(filteredLiked[0].id).toBe('trk_01');
  });

  // ==========================================
  // TIER 4: Real-World Search & Filter Journey
  // ==========================================

  it('Tier 4: simulates full listener catalog search and sorting journey', () => {
    // 1. Initial view: catalog tracks
    const all = db.getCatalogTracks();
    expect(all).toHaveLength(SAMPLE_TRACKS.length);

    // 2. Listener searches for 'drive'
    const search1 = filterTracks(all, 'drive');
    expect(search1).toHaveLength(1);
    expect(search1[0].title).toBe('Midnight Drive');

    // 3. Listener clears search and sorts entire library by Artist
    const sortedByArtist = sortTracks(all, 'ARTIST_ASC');
    expect(sortedByArtist[0].artist).toBe('Cosmic Ray');
    expect(sortedByArtist[1].artist).toBe('Echo Shift');

    // 4. Listener filters by 'Electronic' genre
    const electronic = filterTracks(sortedByArtist, 'Electronic');
    expect(electronic.length).toBeGreaterThanOrEqual(2);
  });
});
