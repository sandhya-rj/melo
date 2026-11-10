import React from 'react';
import { X, Music2, Mic2 } from 'lucide-react';
import type { TrackRecord } from '../../../shared/types';

export interface RightPanelProps {
  isOpen: boolean;
  activeTab: 'nowPlaying' | 'queue';
  onClose: () => void;
  onTabChange?: (tab: 'nowPlaying' | 'queue') => void;
  currentTrack?: TrackRecord | null;
  onOpenLyrics?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
  currentTrack,
  onOpenLyrics,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-[280px] h-full bg-[#121212] rounded-lg flex flex-col p-4 select-none shrink-0 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282828] text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTabChange?.('nowPlaying')}
            className={`text-sm font-bold transition-colors ${
              activeTab === 'nowPlaying' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            Now Playing
          </button>
          <span className="text-[#727272]">•</span>
          <button
            type="button"
            onClick={() => onTabChange?.('queue')}
            className={`text-sm font-bold transition-colors ${
              activeTab === 'queue' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            Queue
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f] transition-colors focus:outline-none"
          title="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'nowPlaying' ? (
        <div className="mt-4 flex flex-col items-center">
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full aspect-square rounded-lg object-cover shadow-2xl bg-[#282828]"
            />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-[#282828] flex items-center justify-center">
              <Music2 size={48} className="text-[#727272]" />
            </div>
          )}

          <div className="mt-4 w-full">
            <h3 className="text-lg font-bold text-white truncate hover:underline cursor-pointer">
              {currentTrack ? currentTrack.title : 'No Track'}
            </h3>
            <p className="text-sm text-[#b3b3b3] truncate hover:underline hover:text-white cursor-pointer mt-0.5">
              {currentTrack ? currentTrack.artist : '—'}
            </p>
            <p className="text-xs text-[#727272] truncate mt-1">
              {currentTrack?.album ? `Album: ${currentTrack.album}` : ''}
            </p>

            {onOpenLyrics && (
              <div
                role="button"
                tabIndex={0}
                onClick={onOpenLyrics}
                className="mt-4 p-3.5 bg-gradient-to-br from-[#8a1f64]/40 via-[#1e1e1e] to-[#161616] rounded-lg border border-white/10 hover:border-[#1ed760]/50 cursor-pointer transition-all group shadow-md"
              >
                <div className="flex items-center justify-between text-xs text-[#1ed760] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Mic2 size={14} />
                    <span>Synchronized Lyrics</span>
                  </span>
                  <span className="text-[#b3b3b3] group-hover:text-white text-[11px]">&rarr;</span>
                </div>
                <p className="text-xs text-white/90 mt-1.5 font-medium leading-relaxed">
                  Real-time auto-scrolling lyrics available for this song
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">Next in Queue</p>
          <div className="p-3 bg-[#181818] rounded-md text-center text-xs text-[#727272]">
            Queue will sync in Milestone 3
          </div>
        </div>
      )}
    </aside>
  );
};
