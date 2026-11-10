import React from 'react';
import { Play } from 'lucide-react';
import type { TrackRecord, PlaylistRecord } from '../../shared/types';
import {
  MOCK_ARTISTS,
  MOCK_ALBUMS,
  MOCK_PLAYLISTS,
  ArtistRecord,
  AlbumRecord,
} from './mockCatalog';

export interface HomeViewProps {
  catalog: TrackRecord[];
  playlists: PlaylistRecord[];
  currentTrack: TrackRecord | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackRecord, queueContext?: TrackRecord[]) => void;
  onNavigate: (view: string) => void;
  onOpenContextMenu?: (e: React.MouseEvent, track: TrackRecord) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  catalog,
  playlists,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onNavigate,
  onOpenContextMenu,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickGrid = [
    { id: 'liked', title: 'Liked Songs', color: 'from-[#450af5] to-[#8e8ee5]', icon: '❤️', view: 'liked' },
    { id: 'art_weeknd', title: 'The Weeknd', color: 'from-[#e1118c] to-[#e91429]', icon: '🎙️', view: 'artist:art_weeknd' },
    { id: 'pl_top_hits', title: "Today's Top Hits", color: 'from-[#1ed760] to-[#006450]', icon: '🔥', view: 'playlist:pl_top_hits' },
    { id: 'alb_after_hours', title: 'After Hours', color: 'from-[#b91d47] to-[#1e3264]', icon: '⚡', view: 'album:alb_after_hours' },
    { id: 'pl_discover', title: 'Discover Weekly', color: 'from-[#7358ff] to-[#1e3264]', icon: '✨', view: 'playlist:pl_discover' },
    { id: 'alb_neon', title: 'Neon Nights', color: 'from-[#00F5A0] to-[#169C46]', icon: '🌆', view: 'album:alb_neon' },
  ];

  const allPlaylists = playlists.length > 0 ? playlists : MOCK_PLAYLISTS;

  return (
    <div className="space-y-9 pb-12 animate-in fade-in duration-300">
      {/* 1. Contextual Greeting */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          {getGreeting()}
        </h1>
      </div>

      {/* 2. 6-Card Recent Quick Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {quickGrid.map((item) => (
          <div
            key={item.id}
            onClick={() => onNavigate(item.view)}
            className="flex items-center gap-3.5 bg-[#ffffff14] hover:bg-[#ffffff24] rounded-md overflow-hidden cursor-pointer group transition-colors shadow-sm relative pr-3"
          >
            <div
              className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shrink-0 shadow-md`}
            >
              {item.icon}
            </div>
            <span className="font-bold text-sm text-white truncate flex-1">
              {item.title}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (catalog.length > 0) {
                  onPlayTrack(catalog[0], catalog);
                }
              }}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-106 hover:bg-[#1fdf64] focus:outline-none shrink-0"
              title="Play"
              aria-label={`Play ${item.title}`}
            >
              <Play size={20} className="fill-black ml-0.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 3. Shelf: Featured Playlists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            onClick={() => onNavigate('library')}
            className="text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight"
          >
            Featured Playlists
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline uppercase tracking-wider focus:outline-none"
          >
            Show all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allPlaylists.slice(0, 5).map((pl) => (
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
                  title="Play playlist"
                  aria-label={`Play ${pl.name}`}
                >
                  <Play size={22} className="fill-black ml-0.5" />
                </button>
              </div>
              <h3 className="font-bold text-sm text-white truncate">{pl.name}</h3>
              <p className="text-xs text-[#b3b3b3] line-clamp-2 mt-1">
                {pl.description || `By MELO • ${pl.trackCount ?? 0} tracks`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Shelf: Top Albums */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            onClick={() => onNavigate('browse')}
            className="text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight"
          >
            Top Albums
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('browse')}
            className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline uppercase tracking-wider focus:outline-none"
          >
            Show all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {MOCK_ALBUMS.map((album: AlbumRecord) => (
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
                    else if (catalog.length > 0) onPlayTrack(catalog[0], catalog);
                  }}
                  className="media-card-play-btn"
                  title="Play album"
                  aria-label={`Play ${album.title}`}
                >
                  <Play size={22} className="fill-black ml-0.5" />
                </button>
              </div>
              <h3 className="font-bold text-sm text-white truncate">{album.title}</h3>
              <p className="text-xs text-[#b3b3b3] truncate mt-1">
                {album.releaseYear} • {album.artist}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Shelf: Popular Artists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            onClick={() => onNavigate('search')}
            className="text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight"
          >
            Popular Artists
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline uppercase tracking-wider focus:outline-none"
          >
            Show all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {MOCK_ARTISTS.map((artist: ArtistRecord) => (
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
                    else if (catalog.length > 0) onPlayTrack(catalog[0], catalog);
                  }}
                  className="media-card-play-btn bottom-1 right-1"
                  title="Play artist"
                  aria-label={`Play ${artist.name}`}
                >
                  <Play size={22} className="fill-black ml-0.5" />
                </button>
              </div>
              <h3 className="font-bold text-sm text-white truncate">{artist.name}</h3>
              <p className="text-xs text-[#b3b3b3] truncate mt-1">Artist</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Shelf: Made For You */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">Made For You</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {catalog.slice(0, 5).map((track) => {
            const isThisPlaying = currentTrack?.id === track.id && isPlaying;
            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track, catalog)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenContextMenu?.(e, track);
                }}
                className="media-card group cursor-pointer"
              >
                <div className="relative mb-3 aspect-square rounded-md overflow-hidden bg-[#242424] shadow-card-artwork">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    className="media-card-play-btn"
                    title="Play track"
                    aria-label={`Play ${track.title}`}
                  >
                    <Play size={22} className="fill-black ml-0.5" />
                  </button>
                </div>
                <h3
                  className={`font-bold text-sm truncate ${
                    isThisPlaying ? 'text-[#1ed760]' : 'text-white'
                  }`}
                >
                  {track.title}
                </h3>
                <p className="text-xs text-[#b3b3b3] truncate mt-1">{track.artist}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
