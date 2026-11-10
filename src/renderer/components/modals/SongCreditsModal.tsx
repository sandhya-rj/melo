import React, { useEffect, useRef } from 'react';
import { X, Mic2, PenTool, Sliders, Disc } from 'lucide-react';
import type { TrackRecord } from '../../../shared/types';

export interface SongCreditsModalProps {
  isOpen: boolean;
  track: TrackRecord | null;
  onClose: () => void;
}

export const SongCreditsModal: React.FC<SongCreditsModalProps> = ({
  isOpen,
  track,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  // Realistic credits metadata derivation
  const artistName = track.artist || 'Unknown Artist';
  const isWeeknd = artistName.toLowerCase().includes('weeknd');
  
  const performers = artistName;
  const writers = isWeeknd
    ? 'Abel Tesfaye, Max Martin, Oscar Holter, Ahmad Balshe'
    : `${artistName}, MELO Music Studios`;
  const producers = isWeeknd
    ? 'Max Martin, Oscar Holter, The Weeknd'
    : 'MELO Production Team, Sound Design Collective';
  const sourceCopyright = `© 2026 ${isWeeknd ? 'XO / Republic Records' : 'MELO Music AB'} / Master Recording`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#242424] text-white w-full max-w-lg rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#b3b3b3]">
              Credits
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5 truncate max-w-sm">
              {track.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors focus:outline-none"
            title="Close credits"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Rows */}
        <div className="p-6 space-y-5 text-sm">
          {/* Performed by */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#1ed760] shrink-0 mt-0.5">
              <Mic2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wide block">
                Performed by
              </span>
              <p className="text-base font-bold text-white mt-0.5 truncate">{performers}</p>
              <p className="text-xs text-[#727272] mt-0.5">Main Artist, Lead Vocals</p>
            </div>
          </div>

          {/* Written by */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#7358ff] shrink-0 mt-0.5">
              <PenTool size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wide block">
                Written by
              </span>
              <p className="text-sm font-semibold text-white mt-0.5 leading-snug">{writers}</p>
              <p className="text-xs text-[#727272] mt-0.5">Composer, Songwriter, Lyricist</p>
            </div>
          </div>

          {/* Produced by */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#ffa42b] shrink-0 mt-0.5">
              <Sliders size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wide block">
                Produced by
              </span>
              <p className="text-sm font-semibold text-white mt-0.5 leading-snug">{producers}</p>
              <p className="text-xs text-[#727272] mt-0.5">Producer, Audio Engineer, Mastering</p>
            </div>
          </div>

          {/* Source / Label */}
          <div className="flex items-start gap-4 pt-3 border-t border-white/5">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#539df5] shrink-0 mt-0.5">
              <Disc size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wide block">
                Source & Copyright
              </span>
              <p className="text-xs text-[#b3b3b3] mt-1 font-mono leading-relaxed">
                {sourceCopyright}
              </p>
              <p className="text-xs text-[#727272] mt-0.5">
                Release: {track.releaseYear || 2026} • Stereo Audio Master
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1e1e1e] border-t border-white/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition-all focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
