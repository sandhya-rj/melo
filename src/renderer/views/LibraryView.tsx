import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Heart,
  Music,
  ArrowUpDown,
  ChevronDown,
  FolderUp,
} from 'lucide-react';
import type { PlaylistRecord } from '../../shared/types';
import {
  MOCK_ARTISTS,
  MOCK_ALBUMS,
  MOCK_PLAYLISTS,
  ArtistRecord,
  AlbumRecord,
} from './mockCatalog';

export interface LibraryViewProps {
  playlists: PlaylistRecord[];
  likedSongsCount: number;
  onCreatePlaylist: () => void;
  onNavigate: (view: string) => void;
  onLoadLocalAudio?: (file: File) => void;
}

type LibraryFilter = 'all' | 'playlists' | 'artists' | 'albums';
type SortOption = 'custom' | 'title' | 'creator' | 'date';

export const LibraryView: React.FC<LibraryViewProps> = ({
  playlists,
  likedSongsCount,
  onCreatePlaylist,
  onNavigate,
  onLoadLocalAudio,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('custom');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLoadLocalAudio) {
      onLoadLocalAudio(file);
    }
    if (e.target) e.target.value = '';
  };

  const allPlaylists = playlists.length > 0 ? playlists : MOCK_PLAYLISTS;

  // Filter items
  const filteredPlaylists = useMemo(() => {
    if (activeFilter === 'artists' || activeFilter === 'albums') return [];
    return allPlaylists.filter((pl) =>
      pl.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allPlaylists, activeFilter, searchQuery]);

  const filteredArtists = useMemo(() => {
    if (activeFilter === 'playlists' || activeFilter === 'albums') return [];
    return MOCK_ARTISTS.filter((art) =>
      art.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeFilter, searchQuery]);

  const filteredAlbums = useMemo(() => {
    if (activeFilter === 'playlists' || activeFilter === 'artists') return [];
    return MOCK_ALBUMS.filter(
      (alb) =>
        alb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alb.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 select-none">
      {/* Top Header: Title & Action Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Your Library</h1>
          <p className="text-sm text-[#b3b3b3] mt-1">Playlists, saved albums, followed artists, and local tracks</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".mp3,.wav,audio/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1f1f1f] hover:bg-[#282828] text-white font-bold text-sm hover:scale-104 active:scale-100 transition-all border border-white/10 shadow-md focus:outline-none"
            title="Load Local Audio File (.mp3/.wav)"
          >
            <FolderUp size={18} className="text-[#1ed760]" />
            <span>Load Local Audio (.mp3/.wav)</span>
          </button>

          <button
            type="button"
            onClick={onCreatePlaylist}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-sm hover:scale-104 active:scale-100 hover:bg-[#f0f0f0] transition-all shadow-md focus:outline-none"
          >
            <Plus size={18} />
            <span>Create Playlist</span>
          </button>
        </div>
      </div>

      {/* Filter Pills & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-white/10">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'playlists', label: 'Playlists' },
              { id: 'artists', label: 'Artists' },
              { id: 'albums', label: 'Albums' },
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

        {/* Search, Sort & View Mode Toggles */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Library Search Input */}
          <div className="relative flex items-center bg-[#242424] rounded-full px-3 py-1.5 w-44 sm:w-56">
            <Search size={15} className="text-[#b3b3b3] mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in Library"
              className="bg-transparent text-white text-xs placeholder-[#727272] focus:outline-none w-full"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 text-xs text-[#b3b3b3] hover:text-white font-medium px-2 py-1.5 rounded hover:bg-[#242424] transition-colors focus:outline-none"
            >
              <ArrowUpDown size={14} />
              <span className="capitalize">{sortOption}</span>
              <ChevronDown size={14} />
            </button>

            {isSortOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-36 bg-[#282828] border border-white/10 rounded-md shadow-context-menu py-1 z-30"
                onClick={() => setIsSortOpen(false)}
              >
                {(
                  [
                    { id: 'custom', label: 'Custom order' },
                    { id: 'title', label: 'Title' },
                    { id: 'creator', label: 'Creator/Artist' },
                    { id: 'date', label: 'Date added' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortOption(opt.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[#3e3e3e] ${
                      sortOption === opt.id ? 'text-[#1ed760] font-bold' : 'text-[#e7e7e7]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center gap-1 bg-[#242424] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${
                viewMode === 'grid' ? 'bg-[#3e3e3e] text-white' : 'text-[#b3b3b3] hover:text-white'
              } transition-colors focus:outline-none`}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${
                viewMode === 'list' ? 'bg-[#3e3e3e] text-white' : 'text-[#b3b3b3] hover:text-white'
              } transition-colors focus:outline-none`}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View Content */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Liked Songs Special Card (if viewing all or playlists) */}
          {(activeFilter === 'all' || activeFilter === 'playlists') && !searchQuery && (
            <div
              onClick={() => onNavigate('liked')}
              className="media-card col-span-2 sm:col-span-2 bg-gradient-to-br from-[#450af5] to-[#8e8ee5] hover:opacity-90 transition-opacity cursor-pointer p-5 flex flex-col justify-end min-h-[180px] shadow-card-artwork"
            >
              <div className="mt-auto space-y-2">
                <Heart size={32} className="fill-white text-white" />
                <h3 className="text-2xl font-black text-white tracking-tight">Liked Songs</h3>
                <p className="text-xs text-white/80 font-medium">
                  {likedSongsCount} liked {likedSongsCount === 1 ? 'song' : 'songs'}
                </p>
              </div>
            </div>
          )}

          {/* Playlists */}
          {filteredPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onNavigate(`playlist:${pl.id}`)}
              className="media-card group cursor-pointer"
            >
              <div className="relative mb-3 aspect-square rounded-md overflow-hidden bg-[#242424] shadow-card-artwork">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#282828]">
                    <Music size={40} className="text-[#727272]" />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm text-white truncate">{pl.name}</h3>
              <p className="text-xs text-[#b3b3b3] truncate mt-1">
                Playlist • {pl.trackCount ?? 0} tracks
              </p>
            </div>
          ))}

          {/* Artists */}
          {filteredArtists.map((art) => (
            <div
              key={art.id}
              onClick={() => onNavigate(`artist:${art.id}`)}
              className="media-card group cursor-pointer text-left"
            >
              <div className="relative mb-3 aspect-square rounded-full overflow-hidden bg-[#242424] shadow-card-artwork mx-auto">
                <img src={art.avatarUrl} alt={art.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-sm text-white truncate">{art.name}</h3>
              <p className="text-xs text-[#b3b3b3] truncate mt-1">Artist</p>
            </div>
          ))}

          {/* Albums */}
          {filteredAlbums.map((alb) => (
            <div
              key={alb.id}
              onClick={() => onNavigate(`album:${alb.id}`)}
              className="media-card group cursor-pointer"
            >
              <div className="relative mb-3 aspect-square rounded-md overflow-hidden bg-[#242424] shadow-card-artwork">
                <img src={alb.coverUrl} alt={alb.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-sm text-white truncate">{alb.title}</h3>
              <p className="text-xs text-[#b3b3b3] truncate mt-1">
                {alb.releaseYear} • {alb.artist}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* List View Content */}
      {viewMode === 'list' && (
        <div className="space-y-1">
          {/* Liked Songs row */}
          {(activeFilter === 'all' || activeFilter === 'playlists') && (
            <div
              onClick={() => onNavigate('liked')}
              className="flex items-center gap-4 p-2 rounded-md hover:bg-[#282828] cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 rounded bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shrink-0">
                <Heart size={20} className="fill-white text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-white truncate block">Liked Songs</span>
                <span className="text-xs text-[#b3b3b3]">Playlist • {likedSongsCount} songs</span>
              </div>
            </div>
          )}

          {/* Playlists rows */}
          {filteredPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onNavigate(`playlist:${pl.id}`)}
              className="flex items-center gap-4 p-2 rounded-md hover:bg-[#282828] cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 rounded bg-[#282828] overflow-hidden shrink-0 flex items-center justify-center">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                ) : (
                  <Music size={22} className="text-[#727272]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-white truncate block">{pl.name}</span>
                <span className="text-xs text-[#b3b3b3]">
                  Playlist • {pl.description || `${pl.trackCount ?? 0} tracks`}
                </span>
              </div>
            </div>
          ))}

          {/* Artists rows */}
          {filteredArtists.map((art) => (
            <div
              key={art.id}
              onClick={() => onNavigate(`artist:${art.id}`)}
              className="flex items-center gap-4 p-2 rounded-md hover:bg-[#282828] cursor-pointer transition-colors"
            >
              <img
                src={art.avatarUrl}
                alt={art.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-white truncate block">{art.name}</span>
                <span className="text-xs text-[#b3b3b3]">Artist</span>
              </div>
            </div>
          ))}

          {/* Albums rows */}
          {filteredAlbums.map((alb) => (
            <div
              key={alb.id}
              onClick={() => onNavigate(`album:${alb.id}`)}
              className="flex items-center gap-4 p-2 rounded-md hover:bg-[#282828] cursor-pointer transition-colors"
            >
              <img
                src={alb.coverUrl}
                alt={alb.title}
                className="w-12 h-12 rounded object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-white truncate block">{alb.title}</span>
                <span className="text-xs text-[#b3b3b3]">
                  Album • {alb.artist} ({alb.releaseYear})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
