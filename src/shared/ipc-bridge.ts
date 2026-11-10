import { IPC_CHANNELS } from './constants.ts';
import type { IElectronAPI } from './types.ts';

export interface IIpcInvoker {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

export function createElectronClient(invoker: IIpcInvoker): IElectronAPI {
  return {
    windowMinimize: () => invoker.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    windowMaximize: () => invoker.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
    windowClose: () => invoker.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    windowIsMaximized: () => invoker.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),

    dbGetPlaylists: () => invoker.invoke(IPC_CHANNELS.DB_GET_PLAYLISTS),
    dbCreatePlaylist: (name: string, description?: string, coverImage?: string) =>
      invoker.invoke(IPC_CHANNELS.DB_CREATE_PLAYLIST, { name, description, coverImage }),
    dbUpdatePlaylist: (id: string, name: string, description?: string, coverImage?: string) =>
      invoker.invoke(IPC_CHANNELS.DB_UPDATE_PLAYLIST, { id, name, description, coverImage }),
    dbDeletePlaylist: (id: string) => invoker.invoke(IPC_CHANNELS.DB_DELETE_PLAYLIST, id),
    dbGetPlaylistTracks: (playlistId: string) =>
      invoker.invoke(IPC_CHANNELS.DB_GET_PLAYLIST_TRACKS, playlistId),
    dbAddTrackToPlaylist: (playlistId: string, trackId: string) =>
      invoker.invoke(IPC_CHANNELS.DB_ADD_TRACK_TO_PLAYLIST, { playlistId, trackId }),
    dbRemoveTrackFromPlaylist: (playlistId: string, trackId: string) =>
      invoker.invoke(IPC_CHANNELS.DB_REMOVE_TRACK_FROM_PLAYLIST, { playlistId, trackId }),

    dbGetLikedSongs: () => invoker.invoke(IPC_CHANNELS.DB_GET_LIKED_SONGS),
    dbToggleLikeSong: (trackId: string) => invoker.invoke(IPC_CHANNELS.DB_TOGGLE_LIKE_SONG, trackId),
    dbIsSongLiked: (trackId: string) => invoker.invoke(IPC_CHANNELS.DB_IS_SONG_LIKED, trackId),

    dbGetCatalogTracks: () => invoker.invoke(IPC_CHANNELS.DB_GET_CATALOG_TRACKS),
    dbGetSettings: () => invoker.invoke(IPC_CHANNELS.DB_GET_SETTINGS),
    dbSaveSetting: (key: string, value: any) =>
      invoker.invoke(IPC_CHANNELS.DB_SAVE_SETTING, { key, value }),
  };
}
