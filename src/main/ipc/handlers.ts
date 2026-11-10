import { IPC_CHANNELS } from '../../shared/constants.ts';
import type { MeloDatabase } from '../database/db.ts';

export interface IIpcMainLike {
  handle: (channel: string, listener: (event: any, ...args: any[]) => any) => void;
}

export interface IWindowLike {
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  close: () => void;
  isMaximized: () => boolean;
}

export function registerIpcHandlers(
  ipc: IIpcMainLike,
  db: MeloDatabase | null,
  getMainWindow?: () => IWindowLike | null
): void {
  // Window Controls
  ipc.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    getMainWindow?.()?.minimize();
  });

  ipc.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = getMainWindow?.();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipc.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    getMainWindow?.()?.close();
  });

  ipc.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return getMainWindow?.()?.isMaximized() ?? false;
  });

  // Database IPC Handlers - Playlists
  ipc.handle(IPC_CHANNELS.DB_GET_PLAYLISTS, async () => {
    return db?.getPlaylists() ?? [];
  });

  ipc.handle(IPC_CHANNELS.DB_CREATE_PLAYLIST, async (_, { name, description, coverImage }) => {
    return db?.createPlaylist(name, description, coverImage);
  });

  ipc.handle(IPC_CHANNELS.DB_UPDATE_PLAYLIST, async (_, { id, name, description, coverImage }) => {
    return db?.updatePlaylist(id, name, description, coverImage) ?? false;
  });

  ipc.handle(IPC_CHANNELS.DB_DELETE_PLAYLIST, async (_, id) => {
    return db?.deletePlaylist(id) ?? false;
  });

  ipc.handle(IPC_CHANNELS.DB_GET_PLAYLIST_TRACKS, async (_, playlistId) => {
    return db?.getPlaylistTracks(playlistId) ?? [];
  });

  ipc.handle(IPC_CHANNELS.DB_ADD_TRACK_TO_PLAYLIST, async (_, { playlistId, trackId }) => {
    return db?.addTrackToPlaylist(playlistId, trackId) ?? false;
  });

  ipc.handle(IPC_CHANNELS.DB_REMOVE_TRACK_FROM_PLAYLIST, async (_, { playlistId, trackId }) => {
    return db?.removeTrackFromPlaylist(playlistId, trackId) ?? false;
  });

  // Database IPC Handlers - Liked Songs
  ipc.handle(IPC_CHANNELS.DB_GET_LIKED_SONGS, async () => {
    return db?.getLikedSongs() ?? [];
  });

  ipc.handle(IPC_CHANNELS.DB_TOGGLE_LIKE_SONG, async (_, trackId) => {
    return db?.toggleLikeSong(trackId) ?? false;
  });

  ipc.handle(IPC_CHANNELS.DB_IS_SONG_LIKED, async (_, trackId) => {
    return db?.isSongLiked(trackId) ?? false;
  });

  // Database IPC Handlers - Catalogue & Settings
  ipc.handle(IPC_CHANNELS.DB_GET_CATALOG_TRACKS, async () => {
    return db?.getCatalogTracks() ?? [];
  });

  ipc.handle(IPC_CHANNELS.DB_GET_SETTINGS, async () => {
    return db?.getSettings() ?? {};
  });

  ipc.handle(IPC_CHANNELS.DB_SAVE_SETTING, async (_, { key, value }) => {
    return db?.saveSetting(key, value) ?? false;
  });
}
