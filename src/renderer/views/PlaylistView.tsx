import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Clock,
  Search,
  Music,
  Edit2,
  Calendar,
} from 'lucide-react';
import type { PlaylistRecord, TrackRecord } from '../../shared/types';
import { formatDurationMs, formatTotalDurationDetailed } from './mockCatalog';

export interface PlaylistViewProps {
  playlist: PlaylistRecord | null;
  tracks: TrackRecord[];
  currentTrack: TrackRecord | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackRecord, queueContext?: TrackRecord[]) => void;
  onTogglePlay: () => void;
  onToggleLike: (track: TrackRecord) => void;
  onOpenContextMenu: (e: React.MouseEvent, track: TrackRecord) => void;
  onEditPlaylist?: (playlist: PlaylistRecord) => void;
  onNavigate: (view: string) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleLike,
  onOpenContextMenu,
  onEditPlaylist,
  onNavigate,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Filter tracks inside playlist
  const displayedTracks = useMemo(() => {
    if (!filterQuery.trim()) return tracks;
    const q = filterQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [tracks, filterQuery]);

  const totalDurationMs = useMemo(() => {
    return tracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  }, [tracks]);

  const isPlaylistActive =
    currentTrack && tracks.some((t) => t.id === currentTrack.id) && isPlaying;

  const handleHeroPlay = () => {
    if (isPlaylistActive) {
      onTogglePlay();
    } else if (tracks.length > 0) {
      onPlayTrack(tracks[0], tracks);
    }
  };

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Music size={48} className="text-[#727272] mb-4" />
        <h2 className="text-xl font-bold text-white">Playlist not found</h2>
        <p className="text-sm text-[#b3b3b3] mt-1">This playlist may have been deleted.</p>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="mt-6 px-6 py-2 rounded-full bg-white text-black font-bold text-sm hover:scale-104 transition-transform"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Hero Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pt-2 pb-4">
        {/* Playlist Cover */}
        <div
          onClick={() => onEditPlaylist?.(playlist)}
          className="w-44 h-44 sm:w-56 sm:h-56 rounded-md shadow-2xl bg-[#282828] overflow-hidden shrink-0 group relative cursor-pointer"
        >
          {playlist.coverImage ? (
            <img
              src={playlist.coverImage}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#727272] bg-[#1f1f1f]">
              <Music size={56} />
              <span className="text-xs mt-2">Choose photo</span>
            </div>
          )}

          {/* Hover Edit Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity text-white">
            <Edit2 size={28} />
            <span className="text-xs font-bold">Edit Details</span>
          </div>
        </div>

        {/* Playlist Metadata Info */}
        <div className="flex flex-col gap-2 min-w-0 flex-1 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Playlist
          </span>

          <h1
            onClick={() => onEditPlaylist?.(playlist)}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight hover:underline cursor-pointer break-words leading-none py-1"
          >
            {playlist.name}
          </h1>

          {playlist.description && (
            <p className="text-sm text-[#b3b3b3] line-clamp-2 mt-1">
              {playlist.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-[#b3b3b3] mt-2 font-medium">
            <span className="text-white font-bold hover:underline cursor-pointer">MELO User</span>
            <span>•</span>
            <span>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
            {totalDurationMs > 0 && (
              <>
                <span>•</span>
                <span>{formatTotalDurationDetailed(totalDurationMs)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Action Bar: Play Button, Heart, Options, and Local Search */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-6">
          {/* 56px Hero Play Button */}
          <button
            type="button"
            onClick={handleHeroPlay}
            className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-106 hover:bg-[#1fdf64] active:scale-100 transition-all duration-200 focus:outline-none shrink-0"
            title={isPlaylistActive ? 'Pause' : 'Play'}
            aria-label={isPlaylistActive ? 'Pause playlist' : 'Play playlist'}
          >
            {isPlaylistActive ? (
              <Pause size={24} className="fill-black text-black" />
            ) : (
              <Play size={24} className="fill-black text-black ml-1" />
            )}
          </button>

          {/* Heart Save Toggle */}
          <button
            type="button"
            onClick={() => setIsSaved(!isSaved)}
            className="text-[#b3b3b3] hover:text-white transition-colors focus:outline-none"
            title={isSaved ? 'Remove from Your Library' : 'Save to Your Library'}
          >
            <Heart
              size={32}
              className={isSaved ? 'fill-[#1ed760] text-[#1ed760]' : 'hover:scale-105 transition-transform'}
            />
          </button>

          {/* Options Menu Button */}
          <button
            type="button"
            onClick={() => onEditPlaylist?.(playlist)}
            className="text-[#b3b3b3] hover:text-white transition-colors focus:outline-none"
            title="More options"
          >
            <MoreHorizontal size={28} />
          </button>
        </div>

        {/* Filter within Playlist */}
        <div className="relative flex items-center bg-[#242424] rounded-full px-3 py-1.5 w-44 sm:w-60">
          <Search size={15} className="text-[#b3b3b3] mr-2 shrink-0" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search in playlist"
            className="bg-transparent text-white text-xs placeholder-[#727272] focus:outline-none w-full"
          />
        </div>
      </div>

      {/* 3. Full Track Table */}
      <div className="space-y-1">
        {/* Table Header Row */}
        <div className="border-b border-white/10 pb-2 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider grid grid-cols-12 px-4 items-center">
          <span className="col-span-1">#</span>
          <span className="col-span-6 sm:col-span-5">Title</span>
          <span className="hidden sm:inline col-span-3">Album</span>
          <span className="hidden lg:inline col-span-2">Date Added</span>
          <span className="col-span-5 sm:col-span-3 lg:col-span-1 flex justify-end">
            <Clock size={16} />
          </span>
        </div>

        {/* Empty State */}
        {displayedTracks.length === 0 && (
          <div className="text-center py-12 text-[#b3b3b3] text-sm">
            {tracks.length === 0
              ? 'This playlist is empty. Search for songs to add!'
              : 'No songs match your search filter.'}
          </div>
        )}

        {/* Table Body Track Rows */}
        {displayedTracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => onPlayTrack(track, tracks)}
              onContextMenu={(e) => onOpenContextMenu(e, track)}
              className={`track-row grid-cols-12 group cursor-pointer ${
                isCurrent ? 'bg-[#282828] text-[#1ed760]' : ''
              }`}
            >
              {/* # or Play icon on hover */}
              <div className="col-span-1 flex items-center">
                <span className="group-hover:hidden font-medium text-xs text-[#b3b3b3] min-w-[16px]">
                  {isThisPlaying ? (
                    <span className="text-[#1ed760] animate-pulse">▶</span>
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="hidden group-hover:inline text-white">
                  <Play size={14} className="fill-white" />
                </span>
              </div>

              {/* Title & Artist with Cover */}
              <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-10 h-10 rounded object-cover shrink-0 bg-[#282828]"
                />
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-sm font-medium truncate ${
                      isCurrent ? 'text-[#1ed760]' : 'text-white'
                    }`}
                  >
                    {track.title}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (track.artistId) onNavigate(`artist:${track.artistId}`);
                    }}
                    className="text-xs text-[#b3b3b3] hover:underline hover:text-white truncate"
                  >
                    {track.artist}
                  </span>
                </div>
              </div>

              {/* Album */}
              <div className="hidden sm:block col-span-3 min-w-0 pr-2">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (track.albumId) onNavigate(`album:${track.albumId}`);
                  }}
                  className="text-xs text-[#b3b3b3] hover:underline hover:text-white truncate block"
                >
                  {track.album}
                </span>
              </div>

              {/* Date Added */}
              <div className="hidden lg:block col-span-2 text-xs text-[#b3b3b3] truncate">
                {track.addedAt || 'Recently'}
              </div>

              {/* Duration & Hover Actions */}
              <div className="col-span-5 sm:col-span-3 lg:col-span-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(track);
                  }}
                  className="text-[#b3b3b3] hover:text-white focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                  title={track.isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart
                    size={16}
                    className={track.isLiked ? 'fill-[#1ed760] text-[#1ed760] opacity-100' : ''}
                  />
                </button>

                <span className="text-xs text-[#b3b3b3] tabular-nums">
                  {formatDurationMs(track.durationMs)}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenContextMenu(e, track);
                  }}
                  className="text-[#b3b3b3] hover:text-white focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                  title="More options"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
