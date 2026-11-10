import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Clock,
  Search,
  Music,
} from 'lucide-react';
import type { TrackRecord } from '../../shared/types';
import { formatDurationMs, formatTotalDurationDetailed } from './mockCatalog';

export interface LikedSongsViewProps {
  likedTracks: TrackRecord[];
  currentTrack: TrackRecord | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackRecord, queueContext?: TrackRecord[]) => void;
  onTogglePlay: () => void;
  onToggleLike: (track: TrackRecord) => void;
  onOpenContextMenu: (e: React.MouseEvent, track: TrackRecord) => void;
  onNavigate: (view: string) => void;
}

export const LikedSongsView: React.FC<LikedSongsViewProps> = ({
  likedTracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleLike,
  onOpenContextMenu,
  onNavigate,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const displayedTracks = useMemo(() => {
    if (!filterQuery.trim()) return likedTracks;
    const q = filterQuery.toLowerCase();
    return likedTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [likedTracks, filterQuery]);

  const totalDurationMs = useMemo(() => {
    return likedTracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  }, [likedTracks]);

  const isLikedActive =
    currentTrack && likedTracks.some((t) => t.id === currentTrack.id) && isPlaying;

  const handleHeroPlay = () => {
    if (isLikedActive) {
      onTogglePlay();
    } else if (likedTracks.length > 0) {
      onPlayTrack(likedTracks[0], likedTracks);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Purple-Blue Gradient Hero Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pt-2 pb-4">
        {/* Heart Emblem */}
        <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-md shadow-2xl bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shrink-0">
          <Heart size={72} className="fill-white text-white drop-shadow-md" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 min-w-0 flex-1 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Playlist
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-none py-1">
            Liked Songs
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-[#b3b3b3] mt-2 font-medium">
            <span className="text-white font-bold hover:underline cursor-pointer">MELO User</span>
            <span>•</span>
            <span>{likedTracks.length} {likedTracks.length === 1 ? 'song' : 'songs'}</span>
            {totalDurationMs > 0 && (
              <>
                <span>•</span>
                <span>{formatTotalDurationDetailed(totalDurationMs)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleHeroPlay}
            disabled={likedTracks.length === 0}
            className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-106 hover:bg-[#1fdf64] active:scale-100 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:hover:scale-100"
            title={isLikedActive ? 'Pause' : 'Play'}
          >
            {isLikedActive ? (
              <Pause size={24} className="fill-black text-black" />
            ) : (
              <Play size={24} className="fill-black text-black ml-1" />
            )}
          </button>
        </div>

        {/* Filter input */}
        <div className="relative flex items-center bg-[#242424] rounded-full px-3 py-1.5 w-44 sm:w-60">
          <Search size={15} className="text-[#b3b3b3] mr-2 shrink-0" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search in liked songs"
            className="bg-transparent text-white text-xs placeholder-[#727272] focus:outline-none w-full"
          />
        </div>
      </div>

      {/* 3. Tracklist Table */}
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
          <div className="text-center py-16 space-y-3">
            <Heart size={48} className="mx-auto text-[#727272]" />
            <h3 className="text-xl font-bold text-white">Songs you like will appear here</h3>
            <p className="text-sm text-[#b3b3b3]">
              Save songs by tapping the heart icon in search, playlists, or the player bar.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('search')}
              className="mt-4 px-6 py-2 rounded-full bg-white text-black font-bold text-sm hover:scale-104 transition-transform"
            >
              Find songs to like
            </button>
          </div>
        )}

        {/* Track Rows */}
        {displayedTracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track, likedTracks)}
              onContextMenu={(e) => onOpenContextMenu(e, track)}
              className={`track-row grid-cols-12 group cursor-pointer ${
                isCurrent ? 'bg-[#282828] text-[#1ed760]' : ''
              }`}
            >
              <div className="col-span-1 flex items-center">
                <span className="group-hover:hidden font-medium text-xs text-[#b3b3b3]">
                  {isThisPlaying ? <span className="text-[#1ed760]">▶</span> : idx + 1}
                </span>
                <span className="hidden group-hover:inline text-white">
                  <Play size={14} className="fill-white" />
                </span>
              </div>

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

              <div className="hidden lg:block col-span-2 text-xs text-[#b3b3b3] truncate">
                {track.addedAt || 'Recently'}
              </div>

              <div className="col-span-5 sm:col-span-3 lg:col-span-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(track);
                  }}
                  className="text-[#1ed760] hover:scale-105 focus:outline-none transition-transform"
                  title="Remove from Liked Songs"
                >
                  <Heart size={16} className="fill-[#1ed760]" />
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
