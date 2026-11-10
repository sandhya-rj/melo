import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  MoreHorizontal,
  CheckCircle2,
  Heart,
  Clock,
} from 'lucide-react';
import type { TrackRecord } from '../../shared/types';
import {
  MOCK_ARTISTS,
  MOCK_ALBUMS,
  ArtistRecord,
  formatDurationMs,
} from './mockCatalog';

export interface ArtistViewProps {
  artistId: string;
  catalog: TrackRecord[];
  currentTrack: TrackRecord | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackRecord, queueContext?: TrackRecord[]) => void;
  onTogglePlay: () => void;
  onToggleLike: (track: TrackRecord) => void;
  onOpenContextMenu: (e: React.MouseEvent, track: TrackRecord) => void;
  onNavigate: (view: string) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({
  artistId,
  catalog,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleLike,
  onOpenContextMenu,
  onNavigate,
}) => {
  const [isFollowing, setIsFollowing] = useState(false);

  // Artist data
  const artist = useMemo(() => {
    return MOCK_ARTISTS.find((a) => a.id === artistId) || MOCK_ARTISTS[0];
  }, [artistId]);

  // Artist tracks
  const popularTracks = useMemo(() => {
    const matched = catalog.filter((t) => t.artistId === artist.id || t.artist === artist.name);
    return matched.length > 0 ? matched : catalog.slice(0, 5);
  }, [catalog, artist]);

  // Artist albums
  const discography = useMemo(() => {
    return MOCK_ALBUMS.filter((alb) => alb.artistId === artist.id || alb.artist === artist.name);
  }, [artist]);

  const isArtistPlaying =
    currentTrack && popularTracks.some((t) => t.id === currentTrack.id) && isPlaying;

  const handleHeroPlay = () => {
    if (isArtistPlaying) {
      onTogglePlay();
    } else if (popularTracks.length > 0) {
      onPlayTrack(popularTracks[0], popularTracks);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* 1. Full-Bleed Artist Header Banner */}
      <div className="relative -mx-6 -mt-6 h-80 sm:h-96 overflow-hidden flex flex-col justify-end p-6 sm:p-8 select-none">
        {/* Background Image with Gradient Overlay */}
        <img
          src={artist.headerUrl}
          alt={artist.name}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-transparent z-10" />

        {/* Content */}
        <div className="relative z-20 space-y-2">
          {artist.verified && (
            <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 size={20} className="fill-[#3d91f4] text-white" />
              <span>Verified Artist</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
            {artist.name}
          </h1>

          <p className="text-sm font-semibold text-white/90">
            {artist.monthlyListeners.toLocaleString()} monthly listeners
          </p>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={handleHeroPlay}
          className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-106 hover:bg-[#1fdf64] active:scale-100 transition-all duration-200 focus:outline-none"
          title={isArtistPlaying ? 'Pause' : 'Play'}
        >
          {isArtistPlaying ? (
            <Pause size={24} className="fill-black text-black" />
          ) : (
            <Play size={24} className="fill-black text-black ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsFollowing(!isFollowing)}
          className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all focus:outline-none ${
            isFollowing
              ? 'border-white bg-white text-black'
              : 'border-[#727272] text-white hover:border-white hover:scale-104'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>

        <button
          type="button"
          className="text-[#b3b3b3] hover:text-white transition-colors focus:outline-none"
          title="More options"
        >
          <MoreHorizontal size={28} />
        </button>
      </div>

      {/* 3. Popular Tracks Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Popular</h2>

        <div className="space-y-1">
          {popularTracks.slice(0, 5).map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            const isThisPlaying = isCurrent && isPlaying;
            // Simulated plays count
            const playsCount = (artist.monthlyListeners * (0.8 - idx * 0.12)).toFixed(0);

            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track, popularTracks)}
                onContextMenu={(e) => onOpenContextMenu(e, track)}
                className={`track-row grid-cols-12 group cursor-pointer ${
                  isCurrent ? 'bg-[#282828] text-[#1ed760]' : ''
                }`}
              >
                {/* Index / Play */}
                <div className="col-span-1 flex items-center">
                  <span className="group-hover:hidden font-medium text-xs text-[#b3b3b3]">
                    {isThisPlaying ? <span className="text-[#1ed760]">▶</span> : idx + 1}
                  </span>
                  <span className="hidden group-hover:inline text-white">
                    <Play size={14} className="fill-white" />
                  </span>
                </div>

                {/* Cover & Title */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-10 h-10 rounded object-cover shrink-0 bg-[#282828]"
                  />
                  <span
                    className={`text-sm font-medium truncate ${
                      isCurrent ? 'text-[#1ed760]' : 'text-white'
                    }`}
                  >
                    {track.title}
                  </span>
                </div>

                {/* Plays Count */}
                <div className="hidden sm:block col-span-3 text-xs text-[#b3b3b3] tabular-nums truncate">
                  {parseInt(playsCount, 10).toLocaleString()}
                </div>

                {/* Duration & Like */}
                <div className="col-span-5 sm:col-span-3 flex items-center justify-end gap-3">
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
      </section>

      {/* 4. Discography Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">Discography</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {discography.length > 0 ? (
            discography.map((album) => (
              <div
                key={album.id}
                onClick={() => onNavigate(`album:${album.id}`)}
                className="media-card group cursor-pointer"
              >
                <div className="relative mb-3 aspect-square rounded-md overflow-hidden bg-[#242424] shadow-card-artwork">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const albTracks = catalog.filter((t) => t.albumId === album.id);
                      if (albTracks.length > 0) onPlayTrack(albTracks[0], albTracks);
                    }}
                    className="media-card-play-btn"
                    title="Play"
                  >
                    <Play size={22} className="fill-black ml-0.5" />
                  </button>
                </div>
                <h4 className="font-bold text-sm text-white truncate">{album.title}</h4>
                <p className="text-xs text-[#b3b3b3] truncate mt-1">
                  {album.releaseYear} • Album
                </p>
              </div>
            ))
          ) : (
            <div className="text-xs text-[#727272]">No separate releases listed</div>
          )}
        </div>
      </section>

      {/* 5. About Artist Card */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">About</h2>
        <div className="relative rounded-2xl overflow-hidden bg-[#242424] p-8 max-w-3xl shadow-card-artwork">
          <div className="relative z-10 space-y-4">
            <div className="text-2xl font-bold text-white">
              {artist.monthlyListeners.toLocaleString()} monthly listeners
            </div>
            <p className="text-sm text-[#b3b3b3] leading-relaxed max-w-xl">
              {artist.bio}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {artist.genres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
