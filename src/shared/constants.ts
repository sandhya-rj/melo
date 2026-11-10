/**
 * MELO IPC Channel Constants
 */

export const IPC_CHANNELS = {
  // Window Controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
  WINDOW_MAXIMIZE_CHANGE: 'window:maximize-change',

  // Database - Playlists
  DB_GET_PLAYLISTS: 'db:get-playlists',
  DB_CREATE_PLAYLIST: 'db:create-playlist',
  DB_UPDATE_PLAYLIST: 'db:update-playlist',
  DB_DELETE_PLAYLIST: 'db:delete-playlist',
  DB_GET_PLAYLIST_TRACKS: 'db:get-playlist-tracks',
  DB_ADD_TRACK_TO_PLAYLIST: 'db:add-track-to-playlist',
  DB_REMOVE_TRACK_FROM_PLAYLIST: 'db:remove-track-from-playlist',

  // Database - Liked Songs
  DB_GET_LIKED_SONGS: 'db:get-liked-songs',
  DB_TOGGLE_LIKE_SONG: 'db:toggle-like-song',
  DB_IS_SONG_LIKED: 'db:is-song-liked',

  // Database - Catalogue & Settings
  DB_GET_CATALOG_TRACKS: 'db:get-catalog-tracks',
  DB_GET_SETTINGS: 'db:get-settings',
  DB_SAVE_SETTING: 'db:save-setting',
} as const;
