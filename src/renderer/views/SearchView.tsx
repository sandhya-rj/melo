import React, { useState, useMemo, useEffect } from 'react';
import { Search as SearchIcon, Play, Heart, Clock, MoreHorizontal, Sparkles } from 'lucide-react';
import type { TrackRecord, PlaylistRecord } from '../../shared/types';
import {
  MOCK_ARTISTS,
  MOCK_ALBUMS,
  MOCK_PLAYLISTS,
  BROWSE_CATEGORIES,
  ArtistRecord,
  AlbumRecord,
  BrowseCategory,
  formatDurationMs,
} from './mockCatalog';

export interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  catalog: TrackRecord[];
  playlists: PlaylistRecord[];
  currentTrack: TrackRecord | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackRecord, queueContext?: TrackRecord[]) => void;
  onToggleLike: (track: TrackRecord) => void;
  onOpenContextMenu: (e: React.MouseEvent, track: TrackRecord) => void;
  onNavigate: (view: string) => void;
}

type FilterChip = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  catalog,
  playlists,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onToggleLike,
  onOpenContextMenu,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Sync external search query
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced input change
  const handleInputChange = (val: string) => {
    setLocalQuery(val);
    onSearchChange(val);
  };

  const allPlaylists = playlists.length > 0 ? playlists : MOCK_PLAYLISTS;

  // Filtered Results
  const trimmed = localQuery.trim().toLowerCase();

  const matchingSongs = useMemo(() => {
    if (!trimmed) return [];
    return catalog.filter(
      (t) =>
        t.title.toLowerCase().includes(trimmed) ||
        t.artist.toLowerCase().includes(trimmed) ||
        t.album.toLowerCase().includes(trimmed) ||
        (t.genre && t.genre.toLowerCase().includes(trimmed))
    );
  }, [catalog, trimmed]);

  const matchingArtists = useMemo(() => {
    if (!trimmed) return [];
    return MOCK_ARTISTS.filter(
      (a) =>
        a.name.toLowerCase().includes(trimmed) ||
        a.genres.some((g) => g.toLowerCase().includes(trimmed))
    );
  }, [trimmed]);

  const matchingAlbums = useMemo(() => {
    if (!trimmed) return [];
    return MOCK_ALBUMS.filter(
      (alb) =>
        alb.title.toLowerCase().includes(trimmed) ||
        alb.artist.toLowerCase().includes(trimmed) ||
        alb.genre.toLowerCase().includes(trimmed)
    );
  }, [trimmed]);

  const matchingPlaylists = useMemo(() => {
    if (!trimmed) return [];
    return allPlaylists.filter(
      (pl) =>
        pl.name.toLowerCase().includes(trimmed) ||
        (pl.description && pl.description.toLowerCase().includes(trimmed))
    );
  }, [allPlaylists, trimmed]);

  const topResult = matchingSongs[0] || null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Live Search Input Bar (in-view) */}
      <div className="relative max-w-lg">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b3b3b3] pointer-events-none">
          <SearchIcon size={20} />
        </div>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="What do you want to play?"
          className="w-full h-12 pl-11 pr-4 bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm placeholder-[#727272] rounded-full border border-transparent focus:border-white focus:outline-none transition-colors shadow-inner"
        />
      </div>

      {/* 2. Filter Pills */}
      {trimmed && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'songs', label: 'Songs' },
              { id: 'artists', label: 'Artists' },
              { id: 'albums', label: 'Albums' },
              { id: 'playlists', label: 'Playlists' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveFilter(chip.id)}
              className={`filter-chip ${activeFilter === chip.id ? 'filter-chip-active' : ''}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. Empty State: Browse Categories */}
      {!trimmed && (
        <div className="space-y-4 pt-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {BROWSE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleInputChange(cat.title)}
                className="h-36 rounded-lg p-4 relative overflow-hidden cursor-pointer select-none group transition-transform duration-200 hover:scale-104 shadow-md"
                style={{ backgroundColor: cat.color }}
              >
                <h3 className="text-xl font-bold text-white tracking-tight break-words max-w-[80%] z-10 relative">
                  {cat.title}
                </h3>
                <div className="absolute -bottom-2 -right-3 w-20 h-20 rounded-md shadow-2xl rotate-[25deg] overflow-hidden group-hover:rotate-[28deg] transition-all">
                  <img src={cat.coverUrl} alt={cat.title} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Active Search Results */}
      {trimmed && (
        <div className="space-y-8">
          {/* Top Result & Top Songs Section */}
          {(activeFilter === 'all' || activeFilter === 'songs') && matchingSongs.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Result Card (5 cols on lg) */}
              {activeFilter === 'all' && topResult && (
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <h3 className="text-xl font-bold text-white tracking-tight">Top result</h3>
                  <div
                    onClick={() => onPlayTrack(topResult, matchingSongs)}
                    className="p-5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-all duration-300 cursor-pointer group relative flex flex-col justify-between flex-1 shadow-card-artwork"
                  >
                    <div className="space-y-4">
                      <img
                        src={topResult.coverUrl}
                        alt={topResult.title}
                        className="w-24 h-24 rounded-lg object-cover shadow-lg"
                      />
                      <div>
                        <h4 className="text-2xl font-black text-white truncate tracking-tight">
                          {topResult.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-[#b3b3b3]">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-semibold uppercase">
                            Song
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (topResult.artistId) onNavigate(`artist:${topResult.artistId}`);
                            }}
                            className="hover:underline hover:text-white"
                          >
                            {topResult.artist}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Floating Play Button */}
                    <button
                      type="button"
                      className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-106 hover:bg-[#1fdf64] focus:outline-none"
                      title="Play"
                      aria-label={`Play ${topResult.title}`}
                    >
                      <Play size={22} className="fill-black ml-0.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Songs List (7 cols on lg) */}
              <div
                className={`${
                  activeFilter === 'all' && topResult ? 'lg:col-span-7' : 'lg:col-span-12'
                } space-y-3`}
              >
                <h3 className="text-xl font-bold text-white tracking-tight">Songs</h3>
                <div className="space-y-1">
                  {matchingSongs.slice(0, activeFilter === 'all' ? 4 : 12).map((song, idx) => {
                    const isCurrent = currentTrack?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => onPlayTrack(song, matchingSongs)}
                        onContextMenu={(e) => onOpenContextMenu(e, song)}
                        className={`flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#282828] cursor-pointer group transition-colors select-none ${
                          isCurrent ? 'bg-[#232323]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-[#282828]">
                            <img
                              src={song.coverUrl}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play size={16} className="fill-white text-white ml-0.5" />
                            </div>
                          </div>

                          <div className="flex flex-col min-w-0 pr-2">
                            <span
                              className={`text-sm font-semibold truncate ${
                                isCurrent ? 'text-[#1ed760]' : 'text-white'
                              }`}
                            >
                              {song.title}
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (song.artistId) onNavigate(`artist:${song.artistId}`);
                              }}
                              className="text-xs text-[#b3b3b3] hover:underline hover:text-white truncate"
                            >
                              {song.artist}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLike(song);
                            }}
                            className="p-1 text-[#b3b3b3] hover:text-white transition-colors focus:outline-none opacity-0 group-hover:opacity-100"
                            title={song.isLiked ? 'Unlike' : 'Like'}
                          >
                            <Heart
                              size={16}
                              className={song.isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''}
                            />
                          </button>

                          <span className="text-xs text-[#b3b3b3] tabular-nums min-w-[36px] text-right">
                            {formatDurationMs(song.durationMs)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenContextMenu(e, song);
                            }}
                            className="p-1 text-[#b3b3b3] hover:text-white transition-colors focus:outline-none opacity-0 group-hover:opacity-100"
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
            </div>
          )}

          {/* Artists Section */}
          {(activeFilter === 'all' || activeFilter === 'artists') && matchingArtists.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white tracking-tight">Artists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {matchingArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => onNavigate(`artist:${artist.id}`)}
                    className="media-card group text-left"
                  >
                    <div className="relative mb-3 aspect-square rounded-full overflow-hidden bg-[#242424] shadow-card-artwork mx-auto">
                      <img
                        src={artist.avatarUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const artistTracks = catalog.filter((t) => t.artistId === artist.id);
                          if (artistTracks.length > 0) onPlayTrack(artistTracks[0], artistTracks);
                        }}
                        className="media-card-play-btn bottom-1 right-1"
                        title="Play"
                      >
                        <Play size={22} className="fill-black ml-0.5" />
                      </button>
                    </div>
                    <h4 className="font-bold text-sm text-white truncate">{artist.name}</h4>
                    <p className="text-xs text-[#b3b3b3] truncate mt-1">Artist</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {(activeFilter === 'all' || activeFilter === 'albums') && matchingAlbums.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white tracking-tight">Albums</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {matchingAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onNavigate(`album:${album.id}`)}
                    className="media-card group"
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
                          const albumTracks = catalog.filter((t) => t.albumId === album.id);
                          if (albumTracks.length > 0) onPlayTrack(albumTracks[0], albumTracks);
                        }}
                        className="media-card-play-btn"
                        title="Play"
                      >
                        <Play size={22} className="fill-black ml-0.5" />
                      </button>
                    </div>
                    <h4 className="font-bold text-sm text-white truncate">{album.title}</h4>
                    <p className="text-xs text-[#b3b3b3] truncate mt-1">
                      {album.releaseYear} • {album.artist}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists Section */}
          {(activeFilter === 'all' || activeFilter === 'playlists') && matchingPlaylists.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white tracking-tight">Playlists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {matchingPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => onNavigate(`playlist:${pl.id}`)}
                    className="media-card group"
                  >
                    <div className="relative mb-3 aspect-square rounded-md overflow-hidden bg-[#242424] shadow-card-artwork">
                      <img
                        src={
                          pl.coverImage ||
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop'
                        }
                        alt={pl.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (catalog.length > 0) onPlayTrack(catalog[0], catalog);
                        }}
                        className="media-card-play-btn"
                        title="Play"
                      >
                        <Play size={22} className="fill-black ml-0.5" />
                      </button>
                    </div>
                    <h4 className="font-bold text-sm text-white truncate">{pl.name}</h4>
                    <p className="text-xs text-[#b3b3b3] line-clamp-2 mt-1">
                      {pl.description || 'Playlist by MELO'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results fallback */}
          {matchingSongs.length === 0 &&
            matchingArtists.length === 0 &&
            matchingAlbums.length === 0 &&
            matchingPlaylists.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <h3 className="text-xl font-bold text-white">No results found for "{localQuery}"</h3>
                <p className="text-sm text-[#b3b3b3]">
                  Please make sure your words are spelled correctly, or use fewer or different keywords.
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
