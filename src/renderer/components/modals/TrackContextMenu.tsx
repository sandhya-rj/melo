import React, { useEffect, useRef, useState } from 'react';
import {
  ListPlus,
  PlusSquare,
  Plus,
  Heart,
  User,
  Disc,
  Trash2,
  Share2,
  ChevronRight,
  Info,
  Check,
  Music,
} from 'lucide-react';
import type { TrackRecord, PlaylistRecord } from '../../../shared/types';

export interface TrackContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  track: TrackRecord | null;
  playlists?: PlaylistRecord[];
  currentPlaylistId?: string;
  onClose: () => void;
  onAddToQueue?: (track: TrackRecord) => void;
  onAddToPlaylist?: (playlistId: string, trackId: string, playlistName?: string) => void;
  onCreatePlaylistWithTrack?: (track: TrackRecord) => void;
  onToggleLike?: (track: TrackRecord) => void;
  onNavigate?: (view: string) => void;
  onRemoveFromPlaylist?: (playlistId: string, trackId: string, playlistName?: string) => void;
  onViewCredits?: (track: TrackRecord) => void;
  onShowToast?: (message: string) => void;
}

export const TrackContextMenu: React.FC<TrackContextMenuProps> = ({
  isOpen,
  position,
  track,
  playlists = [],
  currentPlaylistId,
  onClose,
  onAddToQueue,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
  onToggleLike,
  onNavigate,
  onRemoveFromPlaylist,
  onViewCredits,
  onShowToast,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  // Window boundary clamping
  const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const menuWidth = 224;
  const menuHeight = currentPlaylistId ? 340 : 300;
  const x = Math.max(10, Math.min(position.x, winWidth - menuWidth - 10));
  const y = Math.max(10, Math.min(position.y, winHeight - menuHeight - 10));
  const isNearRight = x + menuWidth + 210 > winWidth;

  // Resolve artist navigation ID
  const resolvedArtistId =
    track.artistId ||
    (track.artist.toLowerCase().includes('weeknd')
      ? 'art_weeknd'
      : track.artist.toLowerCase().includes('synthwave')
      ? 'art_synth'
      : track.artist.toLowerCase().includes('vector')
      ? 'art_vector'
      : track.artist.toLowerCase().includes('echo')
      ? 'art_echo'
      : 'art_weeknd');

  // Resolve album navigation ID
  const resolvedAlbumId =
    track.albumId ||
    (track.album.toLowerCase().includes('after hours')
      ? 'alb_after_hours'
      : track.album.toLowerCase().includes('starboy')
      ? 'alb_starboy'
      : track.album.toLowerCase().includes('hurry up')
      ? 'alb_hurry_up'
      : track.album.toLowerCase().includes('neon')
      ? 'alb_neon'
      : track.album.toLowerCase().includes('horizon')
      ? 'alb_horizon'
      : track.album.toLowerCase().includes('astro')
      ? 'alb_astro'
      : 'alb_after_hours');

  // Current playlist details if opened inside a playlist
  const currentPl = playlists.find((p) => p.id === currentPlaylistId);
  const currentPlaylistName = currentPl?.name || 'playlist';

  const handleCopyLink = () => {
    try {
      const shareUrl = `https://open.melo.app/track/${track.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      onShowToast?.('Link copied to clipboard');
      setTimeout(() => {
        setCopiedShare(false);
        onClose();
      }, 600);
    } catch {
      onShowToast?.('Link copied to clipboard');
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#282828] rounded-md shadow-context-menu border border-[#3e3e3e] py-1.5 w-56 text-[#e7e7e7] text-sm select-none animate-in fade-in zoom-in-95 duration-100"
      style={{ top: `${y}px`, left: `${x}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Add to Queue */}
      <button
        type="button"
        onClick={() => {
          onAddToQueue?.(track);
          onShowToast?.('Added to Queue');
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left"
      >
        <ListPlus size={16} className="text-[#b3b3b3] shrink-0" />
        <span className="truncate">Add to queue</span>
      </button>

      {/* 2. Add to Playlist (with nested submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setShowPlaylistSubmenu(true)}
        onMouseLeave={() => setShowPlaylistSubmenu(false)}
      >
        <button
          type="button"
          onClick={() => setShowPlaylistSubmenu((s) => !s)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left"
        >
          <div className="flex items-center gap-3 truncate">
            <PlusSquare size={16} className="text-[#b3b3b3] shrink-0" />
            <span className="truncate">Add to playlist</span>
          </div>
          <ChevronRight size={14} className="text-[#b3b3b3] shrink-0" />
        </button>

        {showPlaylistSubmenu && (
          <div
            className={`absolute top-0 ${
              isNearRight ? 'right-full mr-1.5' : 'left-full ml-1.5'
            } bg-[#282828] rounded-md shadow-context-menu border border-[#3e3e3e] py-1.5 w-52 max-h-72 overflow-y-auto z-50`}
          >
            {/* Create Playlist Option */}
            <button
              type="button"
              onClick={() => {
                if (onCreatePlaylistWithTrack) {
                  onCreatePlaylistWithTrack(track);
                } else if (onAddToPlaylist && playlists.length > 0) {
                  onAddToPlaylist(playlists[0].id, track.id, playlists[0].name);
                }
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left text-xs font-semibold text-white"
            >
              <Plus size={15} className="text-[#1ed760] shrink-0" />
              <span className="truncate">Create playlist</span>
            </button>

            <div className="h-px bg-white/10 my-1 mx-2" />

            {/* Existing Playlists */}
            {playlists.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#727272]">No playlists found</div>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => {
                    onAddToPlaylist?.(pl.id, track.id, pl.name);
                    onShowToast?.(`Added to ${pl.name}`);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left truncate text-xs"
                >
                  <Music size={13} className="text-[#b3b3b3] shrink-0" />
                  <span className="truncate">{pl.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Like / Unlike Song */}
      <button
        type="button"
        onClick={() => {
          onToggleLike?.(track);
          onShowToast?.(track.isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left"
      >
        <Heart
          size={16}
          className={track.isLiked ? 'fill-[#1ed760] text-[#1ed760] shrink-0' : 'text-[#b3b3b3] shrink-0'}
        />
        <span className="truncate">
          {track.isLiked ? 'Remove from your Liked Songs' : 'Save to your Liked Songs'}
        </span>
      </button>

      {/* Remove from current playlist (if inside custom playlist) */}
      {currentPlaylistId && onRemoveFromPlaylist && (
        <button
          type="button"
          onClick={() => {
            onRemoveFromPlaylist(currentPlaylistId, track.id, currentPlaylistName);
            onShowToast?.(`Removed from ${currentPlaylistName}`);
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3e3e3e] text-[#f3727f] hover:text-[#ff8591] transition-colors text-left"
        >
          <Trash2 size={16} className="shrink-0" />
          <span className="truncate">Remove from this playlist</span>
        </button>
      )}

      <div className="h-px bg-white/10 my-1 mx-2" />

      {/* 4. Go to Artist */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => {
            onNavigate(`artist:${resolvedArtistId}`);
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left"
        >
          <User size={16} className="text-[#b3b3b3] shrink-0" />
          <span className="truncate">Go to artist</span>
        </button>
      )}

      {/* 5. Go to Album */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => {
            onNavigate(`album:${resolvedAlbumId}`);
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left"
        >
          <Disc size={16} className="text-[#b3b3b3] shrink-0" />
          <span className="truncate">Go to album</span>
        </button>
      )}

      {/* 6. View Credits Modal */}
      {onViewCredits && (
        <button
          type="button"
          onClick={() => {
            onViewCredits(track);
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left"
        >
          <Info size={16} className="text-[#b3b3b3] shrink-0" />
          <span className="truncate">View credits</span>
        </button>
      )}

      <div className="h-px bg-white/10 my-1 mx-2" />

      {/* 7. Share Track -> Copy Link */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3e3e3e] hover:text-white transition-colors text-left"
      >
        {copiedShare ? (
          <>
            <Check size={16} className="text-[#1ed760] shrink-0" />
            <span className="text-[#1ed760] font-semibold">Link copied to clipboard</span>
          </>
        ) : (
          <>
            <Share2 size={16} className="text-[#b3b3b3] shrink-0" />
            <span className="truncate">Share track</span>
          </>
        )}
      </button>
    </div>
  );
};
