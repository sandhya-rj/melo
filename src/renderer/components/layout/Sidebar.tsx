import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Library, Plus, Search, Heart, Music, ListFilter, FolderUp } from 'lucide-react';
import type { PlaylistRecord } from '../../../shared/types';

export interface SidebarProps {
  width?: number;
  onWidthChange?: (width: number) => void;
  activePlaylistId?: string;
  onSelectPlaylist?: (playlistId: string) => void;
  onSelectLikedSongs?: () => void;
  onCreatePlaylist?: () => void;
  likedSongsCount?: number;
  onLoadLocalAudio?: (file: File) => void;
  useCompactLibrary?: boolean;
  showLocalFiles?: boolean;
}

export const SIDEBAR_MIN_WIDTH = 232;
export const SIDEBAR_DEFAULT_WIDTH = 280;
export const SIDEBAR_MAX_WIDTH = 420;

export const Sidebar: React.FC<SidebarProps> = ({
  width: controlledWidth,
  onWidthChange,
  activePlaylistId,
  onSelectPlaylist,
  onSelectLikedSongs,
  onCreatePlaylist,
  likedSongsCount = 0,
  onLoadLocalAudio,
  useCompactLibrary = false,
  showLocalFiles = true,
}) => {
  const [internalWidth, setInternalWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('melo_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= SIDEBAR_MIN_WIDTH && parsed <= SIDEBAR_MAX_WIDTH) {
          return parsed;
        }
      }
    } catch {}
    return SIDEBAR_DEFAULT_WIDTH;
  });

  const width = controlledWidth ?? internalWidth;

  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'artists' | 'albums'>('all');
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLoadLocalAudio) {
      onLoadLocalAudio(file);
    }
    if (e.target) e.target.value = '';
  };

  // Load playlists from IPC
  const refreshPlaylists = useCallback(async () => {
    if (window.electronAPI?.dbGetPlaylists) {
      try {
        const records = await window.electronAPI.dbGetPlaylists();
        setPlaylists(records);
      } catch (err) {
        console.error('Failed to load playlists:', err);
      }
    }
  }, []);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      const clamped = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, newWidth));
      setInternalWidth(clamped);
      onWidthChange?.(clamped);
      try {
        localStorage.setItem('melo_sidebar_width', clamped.toString());
      } catch {}
    },
    [onWidthChange]
  );

  // Mouse drag handler for resizer
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleWidthChange(e.clientX - 8); // Offset by panel padding
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleWidthChange]);

  const filteredPlaylists = playlists.filter((pl) => {
    if (activeFilter === 'artists' || activeFilter === 'albums') return false;
    if (filterQuery.trim()) {
      return pl.name.toLowerCase().includes(filterQuery.toLowerCase());
    }
    return true;
  });

  return (
    <aside
      className="relative flex flex-col h-full bg-[#121212] rounded-lg select-none overflow-hidden shrink-0"
      style={{ width: `${width}px` }}
    >
      {/* Top Header: Your Library + Action Buttons */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[#b3b3b3]">
        <button
          type="button"
          className="flex items-center gap-3 font-bold text-sm text-[#b3b3b3] hover:text-white transition-colors focus:outline-none group"
          title="Collapse / Expand Your Library"
        >
          <Library size={24} className="group-hover:text-white transition-colors" />
          <span>Your Library</span>
        </button>

        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".mp3,.wav,audio/*"
            className="hidden"
          />
          {showLocalFiles && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1f1f1f] hover:text-white transition-colors focus:outline-none"
              title="Load Local Audio File (.mp3/.wav)"
              aria-label="Load Local Audio File"
            >
              <FolderUp size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onCreatePlaylist}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1f1f1f] hover:text-white transition-colors focus:outline-none"
            title="Create playlist"
            aria-label="Create playlist"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'playlists' ? 'all' : 'playlists')}
          className={`filter-chip ${activeFilter === 'playlists' ? 'filter-chip-active' : ''}`}
        >
          Playlists
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'artists' ? 'all' : 'artists')}
          className={`filter-chip ${activeFilter === 'artists' ? 'filter-chip-active' : ''}`}
        >
          Artists
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'albums' ? 'all' : 'albums')}
          className={`filter-chip ${activeFilter === 'albums' ? 'filter-chip-active' : ''}`}
        >
          Albums
        </button>
      </div>

      {/* Search & Sort Row within Library */}
      <div className="flex items-center justify-between px-4 py-1.5 text-[#b3b3b3] text-xs">
        <div className="flex items-center gap-1 flex-1">
          {isSearchOpen ? (
            <div className="flex items-center bg-[#1f1f1f] rounded-full px-2 py-1 w-full max-w-[180px]">
              <Search size={14} className="text-[#b3b3b3] mr-1.5 shrink-0" />
              <input
                type="text"
                autoFocus
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                onBlur={() => {
                  if (!filterQuery) setIsSearchOpen(false);
                }}
                placeholder="Search in Library"
                className="bg-transparent text-white text-xs placeholder-[#727272] focus:outline-none w-full"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 rounded-full hover:bg-[#1f1f1f] hover:text-white transition-colors focus:outline-none"
              title="Search in Your Library"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none font-medium ml-auto"
          title="Sort by Recents"
        >
          <span>Recents</span>
          <ListFilter size={14} />
        </button>
      </div>

      {/* Scrollable Library List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {/* Pinned Liked Songs */}
        {useCompactLibrary ? (
          <div
            role="button"
            tabIndex={0}
            onClick={onSelectLikedSongs}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#1f1f1f] cursor-pointer transition-colors group ${
              activePlaylistId === 'liked' ? 'bg-[#232323]' : ''
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Heart size={14} className="fill-[#1ed760] text-[#1ed760] shrink-0" />
              <span
                className={`text-xs font-semibold truncate ${
                  activePlaylistId === 'liked' ? 'text-[#1ed760]' : 'text-white'
                }`}
              >
                Liked Songs
              </span>
            </div>
            <span className="text-[11px] text-[#727272] shrink-0">{likedSongsCount}</span>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={onSelectLikedSongs}
            className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#1f1f1f] cursor-pointer transition-colors group ${
              activePlaylistId === 'liked' ? 'bg-[#232323]' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shrink-0 shadow">
              <Heart size={20} className="fill-white text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={`text-sm font-semibold truncate ${
                  activePlaylistId === 'liked' ? 'text-[#1ed760]' : 'text-white'
                }`}
              >
                Liked Songs
              </span>
              <span className="text-xs text-[#b3b3b3] truncate flex items-center gap-1">
                <span className="text-[#1ed760] font-bold">📌</span> Playlist • {likedSongsCount} songs
              </span>
            </div>
          </div>
        )}

        {/* Load Local Audio Shortcut */}
        {showLocalFiles && (
          useCompactLibrary ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#1f1f1f] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderUp size={14} className="text-[#00F5A0] shrink-0" />
                <span className="text-xs font-semibold truncate text-white group-hover:text-[#1ed760] transition-colors">
                  Local Files
                </span>
              </div>
              <span className="text-[11px] text-[#727272] shrink-0">📁</span>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1f1f1f] cursor-pointer transition-colors group"
            >
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#00F5A0] to-[#006450] flex items-center justify-center shrink-0 shadow">
                <FolderUp size={20} className="text-black" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate text-white group-hover:text-[#1ed760] transition-colors">
                  Load Local Audio
                </span>
                <span className="text-xs text-[#b3b3b3] truncate flex items-center gap-1">
                  <span>📁</span> .mp3 / .wav from disk
                </span>
              </div>
            </div>
          )
        )}

        {/* Dynamic User Playlists */}
        {filteredPlaylists.map((pl) => {
          const isActive = activePlaylistId === pl.id;
          return useCompactLibrary ? (
            <div
              key={pl.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPlaylist?.(pl.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#1f1f1f] cursor-pointer transition-colors group ${
                isActive ? 'bg-[#232323]' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Music size={14} className="text-[#b3b3b3] shrink-0" />
                <span
                  className={`text-xs font-semibold truncate ${
                    isActive ? 'text-[#1ed760]' : 'text-white'
                  }`}
                >
                  {pl.name}
                </span>
              </div>
              <span className="text-[11px] text-[#727272] shrink-0">{pl.trackCount ?? 0}</span>
            </div>
          ) : (
            <div
              key={pl.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPlaylist?.(pl.id)}
              className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#1f1f1f] cursor-pointer transition-colors group ${
                isActive ? 'bg-[#232323]' : ''
              }`}
            >
              {pl.coverImage ? (
                <img
                  src={pl.coverImage}
                  alt={pl.name}
                  className="w-12 h-12 rounded-md object-cover bg-[#282828] shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-[#282828] group-hover:bg-[#333333] flex items-center justify-center shrink-0 transition-colors">
                  <Music size={22} className="text-[#b3b3b3]" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-sm font-semibold truncate ${
                    isActive ? 'text-[#1ed760]' : 'text-white'
                  }`}
                >
                  {pl.name}
                </span>
                <span className="text-xs text-[#b3b3b3] truncate">
                  Playlist • {pl.trackCount ?? 0} songs
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resize Handle on Right Border */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#1ed760] transition-colors z-20 ${
          isResizing ? 'bg-[#1ed760]' : 'bg-transparent'
        }`}
        title="Resize sidebar"
      />
    </aside>
  );
};
