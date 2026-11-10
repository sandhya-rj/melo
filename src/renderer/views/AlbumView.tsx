import React, { useState, useMemo } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock, Disc } from 'lucide-react';
import type { TrackRecord } from '../../shared/types';
import {
  MOCK_ALBUMS,
  MOCK_ARTISTS,
  AlbumRecord,
  formatDurationMs,
  formatTotalDurationDetailed,
} from './mockCatalog';

export interface AlbumViewProps {
  albumId: string;
  catalog: TrackRecord[];
  currentTrack: TrackRecord | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackRecord, queueContext?: TrackRecord[]) => void;
  onTogglePlay: () => void;
  onToggleLike: (track: TrackRecord) => void;
  onOpenContextMenu: (e: React.MouseEvent, track: TrackRecord) => void;
  onNavigate: (view: string) => void;
}

export const AlbumView: React.FC<AlbumViewProps> = ({
  albumId,
  catalog,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleLike,
  onOpenContextMenu,
  onNavigate,
}) => {
  const [isSaved, setIsSaved] = useState(false);

  // Find album details
  const album = useMemo(() => {
    return MOCK_ALBUMS.find((a) => a.id === albumId) || MOCK_ALBUMS[0];
  }, [albumId]);

  // Find artist details
  const artist = useMemo(() => {
    return MOCK_ARTISTS.find((art) => art.id === album.artistId) || MOCK_ARTISTS[0];
  }, [album]);

  // Find tracks belonging to this album
  const albumTracks = useMemo(() => {
    const matched = catalog.filter((t) => t.albumId === album.id || t.album === album.title);
    return matched.length > 0 ? matched : catalog.slice(0, 4);
  }, [catalog, album]);

  const totalDurationMs = useMemo(() => {
    return albumTracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  }, [albumTracks]);

  const isAlbumActive =
    currentTrack && albumTracks.some((t) => t.id === currentTrack.id) && isPlaying;

  const handleHeroPlay = () => {
    if (isAlbumActive) {
      onTogglePlay();
    } else if (albumTracks.length > 0) {
      onPlayTrack(albumTracks[0], albumTracks);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Album Hero Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pt-2 pb-4">
        {/* Album Artwork */}
        <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-md shadow-2xl bg-[#282828] overflow-hidden shrink-0">
          <img
            src={album.coverUrl}
            alt={album.title}
            className="w-full h-full object-cover shadow-card-artwork"
          />
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-2 min-w-0 flex-1 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Album
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight break-words leading-none py-1">
            {album.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#b3b3b3] mt-2 font-medium">
            <div
              onClick={() => onNavigate(`artist:${artist.id}`)}
              className="flex items-center gap-1.5 text-white font-bold hover:underline cursor-pointer"
            >
              <img
                src={artist.avatarUrl}
                alt={artist.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span>{album.artist}</span>
            </div>
            <span>•</span>
            <span>{album.releaseYear}</span>
            <span>•</span>
            <span>{albumTracks.length} songs</span>
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
      <div className="flex items-center gap-6 py-2">
        <button
          type="button"
          onClick={handleHeroPlay}
          className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-106 hover:bg-[#1fdf64] active:scale-100 transition-all duration-200 focus:outline-none"
          title={isAlbumActive ? 'Pause' : 'Play'}
        >
          {isAlbumActive ? (
            <Pause size={24} className="fill-black text-black" />
          ) : (
            <Play size={24} className="fill-black text-black ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
          className="text-[#b3b3b3] hover:text-white transition-colors focus:outline-none"
          title={isSaved ? 'Remove from library' : 'Save to library'}
        >
          <Heart
            size={32}
            className={isSaved ? 'fill-[#1ed760] text-[#1ed760]' : 'hover:scale-105 transition-transform'}
          />
        </button>

        <button
          type="button"
          className="text-[#b3b3b3] hover:text-white transition-colors focus:outline-none"
          title="More options"
        >
          <MoreHorizontal size={28} />
        </button>
      </div>

      {/* 3. Compact Album Tracklist Table */}
      <div className="space-y-1">
        <div className="border-b border-white/10 pb-2 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider grid grid-cols-12 px-4 items-center">
          <span className="col-span-1">#</span>
          <span className="col-span-9 sm:col-span-10">Title</span>
          <span className="col-span-2 sm:col-span-1 flex justify-end">
            <Clock size={16} />
          </span>
        </div>

        {albumTracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track, albumTracks)}
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

              <div className="col-span-9 sm:col-span-10 flex flex-col justify-center min-w-0 pr-2">
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

              <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(track);
                  }}
                  className="text-[#b3b3b3] hover:text-white focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
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
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Album Copyright & Release Notice */}
      <div className="pt-6 text-xs text-[#727272] space-y-1">
        <p>© {album.releaseYear} MELO Records / {album.artist}</p>
        <p>℗ {album.releaseYear} Distributed independently for MELO Desktop</p>
      </div>
    </div>
  );
};
