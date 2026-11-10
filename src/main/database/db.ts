import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import type { PlaylistRecord, TrackRecord } from '../../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface HistoryRecord {
  id: number;
  trackId: string;
  playedAt: string;
  durationPlayedMs: number;
  completed: number;
}

export interface MeloDatabaseOptions {
  seedDefaultPlaylists?: boolean;
}

let cachedSQLInstance: any = null;

export async function getSqlInstance(): Promise<any> {
  if (!cachedSQLInstance) {
    cachedSQLInstance = await initSqlJs({
      locateFile: (file) => {
        try {
          const candidates = [
            path.join(__dirname, file),
            path.join(__dirname, '../../node_modules/sql.js/dist', file),
            path.resolve(process.cwd(), 'node_modules/sql.js/dist', file),
            path.resolve(process.cwd(), 'dist-electron/main', file),
            path.resolve(process.cwd(), 'public', file),
            path.resolve(process.cwd(), file),
          ];
          for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
              return candidate;
            }
          }
        } catch {}
        return file;
      },
    });
  }
  return cachedSQLInstance;
}

export class MeloDatabase {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private options: MeloDatabaseOptions;

  constructor(customPath?: string, options: MeloDatabaseOptions = {}) {
    this.dbPath = customPath || path.resolve(process.cwd(), 'melo.db');
    this.options = options;
  }

  public initializeWithSql(SQL: any): void {
    let buffer: Buffer | null = null;
    if (this.dbPath !== ':memory:' && fs.existsSync(this.dbPath)) {
      try {
        buffer = fs.readFileSync(this.dbPath);
      } catch (err) {
        console.error('Failed to read existing melo.db file:', err);
      }
    }

    if (buffer && buffer.length > 0) {
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.initSchema();
    this.seedDefaultData();
    this.persist();
  }

  public async initialize(): Promise<void> {
    const SQL = await getSqlInstance();
    this.initializeWithSql(SQL);
  }

  public persist(): void {
    if (!this.db || this.dbPath === ':memory:') return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('Failed to persist melo.db:', err);
    }
  }

  private initSchema(): void {
    if (!this.db) return;
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS playlists (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          cover_image TEXT DEFAULT NULL,
          is_pinned INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS playlist_tracks (
          playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
          track_id TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (playlist_id, track_id, order_index)
      );

      CREATE TABLE IF NOT EXISTS liked_songs (
          track_id TEXT PRIMARY KEY NOT NULL,
          liked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS catalog_tracks (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          artist_id TEXT,
          album TEXT NOT NULL,
          album_id TEXT,
          duration_ms INTEGER NOT NULL,
          cover_url TEXT NOT NULL,
          audio_url TEXT NOT NULL,
          genre TEXT DEFAULT 'Pop',
          release_year INTEGER,
          track_number INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS playback_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          track_id TEXT NOT NULL,
          played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          duration_played_ms INTEGER NOT NULL,
          completed INTEGER DEFAULT 1
      );
    `;
    this.db.run(schemaSql);
  }

  private seedDefaultData(): void {
    if (!this.db) return;

    // Seed default playlists if empty
    const playlistCountRes = this.db.exec('SELECT COUNT(*) as count FROM playlists');
    const playlistCount = playlistCountRes.length > 0 ? (playlistCountRes[0].values[0][0] as number) : 0;

    if (this.options.seedDefaultPlaylists !== false && playlistCount === 0) {
      const stmt = this.db.prepare(
        'INSERT INTO playlists (id, name, description, cover_image, is_pinned) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(['pl_top_hits', "Today's Top Hits", 'The hottest tracks right now.', null, 1]);
      stmt.run(['pl_discover', 'Discover Weekly', 'Your weekly mixtape of fresh music.', null, 0]);
      stmt.run(['pl_chill', 'Chill Hits', 'Kick back to the best new and recent chill hits.', null, 0]);
      stmt.free();
    }

    // Seed default settings if empty
    const settingsCountRes = this.db.exec('SELECT COUNT(*) as count FROM settings');
    const settingsCount = settingsCountRes.length > 0 ? (settingsCountRes[0].values[0][0] as number) : 0;

    if (settingsCount === 0) {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      stmt.run(['audioQuality', JSON.stringify('high')]);
      stmt.run(['normalizeVolume', JSON.stringify(true)]);
      stmt.run(['crossfadeSeconds', JSON.stringify(0)]);
      stmt.run(['theme', JSON.stringify('dark')]);
      stmt.free();
    }

    // Seed / Ensure default catalog tracks including The Weeknd
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO catalog_tracks (id, title, artist, artist_id, album, album_id, duration_ms, cover_url, audio_url, genre, release_year, track_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    // The Weeknd 5 Iconic Tracks
    stmt.run([
      'trk_weeknd_blinding_lights',
      'Blinding Lights',
      'The Weeknd',
      'art_weeknd',
      'After Hours (2026 Deluxe Remaster)',
      'alb_after_hours',
      200000,
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
      'audio/the-weeknd-blinding-lights.wav',
      'Synthwave',
      2026,
      1,
    ]);
    stmt.run([
      'trk_weeknd_starboy',
      'Starboy',
      'The Weeknd',
      'art_weeknd',
      'Starboy (2026 Anniversary Edition)',
      'alb_starboy',
      230000,
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
      'audio/the-weeknd-starboy.wav',
      'R&B',
      2026,
      1,
    ]);
    stmt.run([
      'trk_weeknd_save_your_tears',
      'Save Your Tears',
      'The Weeknd',
      'art_weeknd',
      'After Hours (2026 Deluxe Remaster)',
      'alb_after_hours',
      215000,
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
      'audio/the-weeknd-save-your-tears.wav',
      'Pop',
      2026,
      2,
    ]);
    stmt.run([
      'trk_weeknd_after_hours',
      'After Hours',
      'The Weeknd',
      'art_weeknd',
      'After Hours (2026 Deluxe Remaster)',
      'alb_after_hours',
      225000,
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
      'audio/the-weeknd-after-hours.wav',
      'R&B',
      2026,
      3,
    ]);
    stmt.run([
      'trk_weeknd_dancing_in_the_flames',
      'Dancing In The Flames',
      'The Weeknd',
      'art_weeknd',
      'Hurry Up Tomorrow (2026 Edition)',
      'alb_hurry_up',
      210000,
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop',
      'audio/the-weeknd-dancing-in-the-flames.wav',
      'Synthwave',
      2026,
      1,
    ]);

    // Additional Catalog Tracks (3+ Minutes)
    stmt.run([
      'trk_01',
      'Retro Groove',
      'Synthwave Collective',
      'art_synth',
      'Neon Nights',
      'alb_neon',
      214000,
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
      'audio/track1.wav',
      'Electronic',
      2026,
      1,
    ]);
    stmt.run([
      'trk_02',
      'Cyber Sunset',
      'Vector Pulse',
      'art_vector',
      'Digital Horizons',
      'alb_horizon',
      185000,
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop',
      'audio/track2.wav',
      'Electronic',
      2026,
      2,
    ]);
    stmt.run([
      'trk_03',
      'Midnight Drive',
      'Echo Shift',
      'art_echo',
      'Neon Nights',
      'alb_neon',
      242000,
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
      'audio/track3.wav',
      'Synthwave',
      2026,
      3,
    ]);
    stmt.run([
      'trk_04',
      'Solar Flare',
      'Cosmic Ray',
      'art_cosmic',
      'Astrosphere',
      'alb_astro',
      198000,
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&h=300&fit=crop',
      'audio/track4.wav',
      'Ambient',
      2026,
      1,
    ]);
    stmt.run([
      'trk_05',
      'Electric Dream',
      'Synthwave Collective',
      'art_synth',
      'Neon Nights',
      'alb_neon',
      220000,
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
      'audio/track5.wav',
      'Electronic',
      2026,
      4,
    ]);
    stmt.free();
  }

  // Playlists CRUD
  public getPlaylists(): PlaylistRecord[] {
    if (!this.db) return [];
    const res = this.db.exec(
      `SELECT p.id, p.name, p.description, p.cover_image, p.is_pinned, p.created_at, p.updated_at,
              COUNT(pt.track_id) as track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
       GROUP BY p.id
       ORDER BY p.is_pinned DESC, p.created_at ASC`
    );
    if (!res.length) return [];
    return res[0].values.map((row) => ({
      id: row[0] as string,
      name: row[1] as string,
      description: (row[2] as string) || undefined,
      coverImage: (row[3] as string) || undefined,
      isPinned: Boolean(row[4]),
      createdAt: row[5] as string,
      updatedAt: row[6] as string,
      trackCount: (row[7] as number) || 0,
    }));
  }

  public getPlaylist(id: string): PlaylistRecord | null {
    if (!this.db) return null;
    const stmt = this.db.prepare(
      `SELECT p.id, p.name, p.description, p.cover_image, p.is_pinned, p.created_at, p.updated_at,
              COUNT(pt.track_id) as track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
       WHERE p.id = ?
       GROUP BY p.id`
    );
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.get();
    stmt.free();
    return {
      id: row[0] as string,
      name: row[1] as string,
      description: row[2] != null ? (row[2] as string) : '',
      coverImage: (row[3] as string) || undefined,
      isPinned: Boolean(row[4]),
      createdAt: row[5] as string,
      updatedAt: row[6] as string,
      trackCount: (row[7] as number) || 0,
    };
  }

  public createPlaylist(name: string, description = '', coverImage?: string): PlaylistRecord {
    if (!this.db) throw new Error('Database not initialized');
    if (!name || name.trim().length === 0) {
      throw new Error('Playlist name cannot be empty');
    }
    const sanitizedName = name.trim().substring(0, 100);
    const sanitizedDesc = description ? description.substring(0, 300) : '';

    const id = 'pl_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const stmt = this.db.prepare(
      'INSERT INTO playlists (id, name, description, cover_image, is_pinned, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
    );
    stmt.run([id, sanitizedName, sanitizedDesc, coverImage || null, now, now]);
    stmt.free();
    this.persist();

    return {
      id,
      name: sanitizedName,
      description: sanitizedDesc,
      coverImage,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      trackCount: 0,
    };
  }

  public updatePlaylist(id: string, name?: string, description?: string, coverImage?: string): boolean {
    if (!this.db) return false;
    if (name !== undefined && (!name || name.trim().length === 0)) {
      throw new Error('Playlist name cannot be empty');
    }
    const existing = this.getPlaylist(id);
    if (!existing) return false;

    const sanitizedName = name !== undefined ? name.trim().substring(0, 100) : existing.name;
    const sanitizedDesc = description !== undefined ? description.substring(0, 300) : existing.description;

    const stmt = this.db.prepare(
      'UPDATE playlists SET name = COALESCE(?, name), description = COALESCE(?, description), cover_image = COALESCE(?, cover_image), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run([sanitizedName, sanitizedDesc ?? null, coverImage ?? null, id]);
    stmt.free();
    const modified = this.db.getRowsModified();
    if (modified > 0) {
      this.persist();
      return true;
    }
    return false;
  }

  public deletePlaylist(id: string): boolean {
    if (!this.db) return false;
    const existing = this.getPlaylist(id);
    if (!existing) return false;

    this.db.run('DELETE FROM playlist_tracks WHERE playlist_id = ?', [id]);
    this.db.run('DELETE FROM playlists WHERE id = ?', [id]);
    const modified = this.db.getRowsModified();
    if (modified > 0) {
      this.persist();
      return true;
    }
    return false;
  }

  public getPlaylistTracks(playlistId: string): TrackRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(
      `SELECT c.id, c.title, c.artist, c.artist_id, c.album, c.album_id, c.duration_ms, c.cover_url, c.audio_url, c.genre, c.release_year, c.track_number, pt.added_at,
              (SELECT 1 FROM liked_songs ls WHERE ls.track_id = c.id) as is_liked
       FROM playlist_tracks pt
       JOIN catalog_tracks c ON pt.track_id = c.id
       WHERE pt.playlist_id = ?
       ORDER BY pt.order_index ASC`
    );
    stmt.bind([playlistId]);
    const tracks: TrackRecord[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      tracks.push({
        id: row[0] as string,
        title: row[1] as string,
        artist: row[2] as string,
        artistId: (row[3] as string) || undefined,
        album: row[4] as string,
        albumId: (row[5] as string) || undefined,
        durationMs: row[6] as number,
        coverUrl: row[7] as string,
        audioUrl: row[8] as string,
        genre: (row[9] as string) || undefined,
        releaseYear: (row[10] as number) || undefined,
        trackNumber: (row[11] as number) || undefined,
        addedAt: (row[12] as string) || undefined,
        isLiked: Boolean(row[13]),
      });
    }
    stmt.free();
    return tracks;
  }

  public addTrackToPlaylist(playlistId: string, trackId: string): boolean {
    if (!this.db) return false;
    // Validate playlist exists
    const plStmt = this.db.prepare('SELECT 1 FROM playlists WHERE id = ?');
    plStmt.bind([playlistId]);
    const plExists = plStmt.step();
    plStmt.free();
    if (!plExists) return false;

    // Validate track exists in catalog
    const trkStmt = this.db.prepare('SELECT 1 FROM catalog_tracks WHERE id = ?');
    trkStmt.bind([trackId]);
    const trkExists = trkStmt.step();
    trkStmt.free();
    if (!trkExists) return false;

    const maxOrderStmt = this.db.prepare(
      'SELECT COALESCE(MAX(order_index), -1) + 1 FROM playlist_tracks WHERE playlist_id = ?'
    );
    maxOrderStmt.bind([playlistId]);
    let nextOrder = 0;
    if (maxOrderStmt.step()) {
      nextOrder = (maxOrderStmt.get()[0] as number) || 0;
    }
    maxOrderStmt.free();

    const insertStmt = this.db.prepare(
      'INSERT INTO playlist_tracks (playlist_id, track_id, order_index, added_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    );
    insertStmt.run([playlistId, trackId, nextOrder]);
    insertStmt.free();
    this.persist();
    return true;
  }

  public removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
    if (!this.db) return false;
    const stmt = this.db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?');
    stmt.run([playlistId, trackId]);
    stmt.free();
    const modified = this.db.getRowsModified();
    if (modified === 0) return false;

    // Re-index remaining tracks without gaps
    const resStmt = this.db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY order_index ASC');
    resStmt.bind([playlistId]);
    const trackIds: string[] = [];
    while (resStmt.step()) {
      trackIds.push(resStmt.get()[0] as string);
    }
    resStmt.free();

    const updateStmt = this.db.prepare('UPDATE playlist_tracks SET order_index = ? WHERE playlist_id = ? AND track_id = ?');
    trackIds.forEach((tId, idx) => {
      updateStmt.run([idx, playlistId, tId]);
    });
    updateStmt.free();

    this.persist();
    return true;
  }

  public reorderPlaylistTrack(playlistId: string, fromIndex: number, toIndex: number): boolean {
    if (!this.db) return false;
    const resStmt = this.db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY order_index ASC');
    resStmt.bind([playlistId]);
    const trackIds: string[] = [];
    while (resStmt.step()) {
      trackIds.push(resStmt.get()[0] as string);
    }
    resStmt.free();

    if (fromIndex < 0 || fromIndex >= trackIds.length || toIndex < 0 || toIndex >= trackIds.length) {
      return false;
    }

    const [moved] = trackIds.splice(fromIndex, 1);
    trackIds.splice(toIndex, 0, moved);

    const updateStmt = this.db.prepare('UPDATE playlist_tracks SET order_index = ? WHERE playlist_id = ? AND track_id = ?');
    trackIds.forEach((tId, idx) => {
      updateStmt.run([idx, playlistId, tId]);
    });
    updateStmt.free();

    this.persist();
    return true;
  }

  // Liked Songs
  public getLikedSongs(): TrackRecord[] {
    if (!this.db) return [];
    const res = this.db.exec(
      `SELECT c.id, c.title, c.artist, c.artist_id, c.album, c.album_id, c.duration_ms, c.cover_url, c.audio_url, c.genre, c.release_year, c.track_number, ls.liked_at,
              1 as is_liked
       FROM liked_songs ls
       JOIN catalog_tracks c ON ls.track_id = c.id
       ORDER BY ls.liked_at DESC`
    );
    if (!res.length) return [];
    return res[0].values.map((row) => ({
      id: row[0] as string,
      title: row[1] as string,
      artist: row[2] as string,
      artistId: (row[3] as string) || undefined,
      album: row[4] as string,
      albumId: (row[5] as string) || undefined,
      durationMs: row[6] as number,
      coverUrl: row[7] as string,
      audioUrl: row[8] as string,
      genre: (row[9] as string) || undefined,
      releaseYear: (row[10] as number) || undefined,
      trackNumber: (row[11] as number) || undefined,
      addedAt: (row[12] as string) || undefined,
      isLiked: true,
    }));
  }

  public toggleLikeSong(trackId: string): boolean {
    if (!this.db) return false;
    const isLiked = this.isSongLiked(trackId);
    if (isLiked) {
      this.db.run('DELETE FROM liked_songs WHERE track_id = ?', [trackId]);
    } else {
      this.db.run('INSERT INTO liked_songs (track_id) VALUES (?)', [trackId]);
    }
    this.persist();
    return !isLiked;
  }

  public isSongLiked(trackId: string): boolean {
    if (!this.db) return false;
    const stmt = this.db.prepare('SELECT 1 FROM liked_songs WHERE track_id = ?');
    stmt.bind([trackId]);
    const step = stmt.step();
    stmt.free();
    return step;
  }

  // Catalogue & Settings
  public getCatalogTracks(): TrackRecord[] {
    if (!this.db) return [];
    const res = this.db.exec(
      `SELECT c.id, c.title, c.artist, c.artist_id, c.album, c.album_id, c.duration_ms, c.cover_url, c.audio_url, c.genre, c.release_year, c.track_number,
              (SELECT 1 FROM liked_songs ls WHERE ls.track_id = c.id) as is_liked
       FROM catalog_tracks c
       ORDER BY c.title ASC`
    );
    if (!res.length) return [];
    return res[0].values.map((row) => ({
      id: row[0] as string,
      title: row[1] as string,
      artist: row[2] as string,
      artistId: (row[3] as string) || undefined,
      album: row[4] as string,
      albumId: (row[5] as string) || undefined,
      durationMs: row[6] as number,
      coverUrl: row[7] as string,
      audioUrl: row[8] as string,
      genre: (row[9] as string) || undefined,
      releaseYear: (row[10] as number) || undefined,
      trackNumber: (row[11] as number) || undefined,
      isLiked: Boolean(row[12]),
    }));
  }

  public getSettings(): Record<string, any> {
    if (!this.db) return {};
    const res = this.db.exec('SELECT key, value FROM settings');
    if (!res.length) return {};
    const result: Record<string, any> = {};
    for (const [k, v] of res[0].values) {
      try {
        result[k as string] = JSON.parse(v as string);
      } catch {
        result[k as string] = v;
      }
    }
    return result;
  }

  public saveSetting(key: string, value: any): boolean {
    if (!this.db) return false;
    const strVal = JSON.stringify(value);
    const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    stmt.run([key, strVal]);
    stmt.free();
    this.persist();
    return true;
  }

  // Playback History
  public recordHistory(trackId: string, durationPlayedMs: number, completed = false): boolean {
    if (!this.db) return false;
    const stmt = this.db.prepare(
      'INSERT INTO playback_history (track_id, duration_played_ms, completed) VALUES (?, ?, ?)'
    );
    stmt.run([trackId, durationPlayedMs, completed ? 1 : 0]);
    stmt.free();
    this.persist();
    return true;
  }

  public get history(): HistoryRecord[] {
    if (!this.db) return [];
    const res = this.db.exec('SELECT id, track_id, played_at, duration_played_ms, completed FROM playback_history ORDER BY id ASC');
    if (!res.length || !res[0].values.length) return [];
    return res[0].values.map((row) => ({
      id: row[0] as number,
      trackId: row[1] as string,
      playedAt: row[2] as string,
      durationPlayedMs: row[3] as number,
      completed: row[4] as number,
    }));
  }

  public close(): void {
    if (this.db) {
      this.persist();
      this.db.close();
      this.db = null;
    }
  }
}
