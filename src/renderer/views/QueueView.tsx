import React from 'react';
import {
  Play,
  Heart,
  MoreHorizontal,
  Trash2,
  Music2,
  Volume2,
} from 'lucide-react';
import type { TrackRecord } from '../../shared/types';
import { formatDurationMs } from './mockCatalog';

export interface QueueViewProps {
  currentTrack: TrackRecord | null;
  isPlaying: boolean;
  userQueue: TrackRecord[];
  contextQueue: TrackRecord[];
  contextName?: string;
  onPlayTrack: (track: TrackRecord) => void;
  onRemoveFromUserQueue: (index: number) => void;
  onClearUserQueue: () => void;
  onToggleLike: (track: TrackRecord) => void;
  onOpenContextMenu: (e: React.MouseEvent, track: TrackRecord) => void;
  onNavigate: (view: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  currentTrack,
  isPlaying,
  userQueue,
  contextQueue,
  contextName = "Today's Top Hits",
  onPlayTrack,
  onRemoveFromUserQueue,
  onClearUserQueue,
  onToggleLike,
  onOpenContextMenu,
  onNavigate,
}) => {
  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300 max-w-4xl select-none">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Queue</h1>
      </div>

      {/* 1. Now Playing Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#b3b3b3]">
          Now playing
        </h2>

        {currentTrack ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1f1f1f] hover:bg-[#282828] transition-colors group">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* Playing wave animation indicator */}
              <div className="w-6 flex items-center justify-center shrink-0">
                {isPlaying ? (
                  <Volume2 size={18} className="text-[#1ed760] animate-pulse" />
                ) : (
                  <span className="text-[#727272] text-xs">❚❚</span>
                )}
              </div>

              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover shadow bg-[#282828] shrink-0"
              />

              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-semibold text-[#1ed760] truncate">
                  {currentTrack.title}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentTrack.artistId) onNavigate(`artist:${currentTrack.artistId}`);
                  }}
                  className="text-xs text-[#b3b3b3] hover:underline hover:text-white truncate"
                >
                  {currentTrack.artist}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => onToggleLike(currentTrack)}
                className="text-[#b3b3b3] hover:text-white focus:outline-none"
              >
                <Heart
                  size={16}
                  className={currentTrack.isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''}
                />
              </button>

              <span className="text-xs text-[#b3b3b3] tabular-nums">
                {formatDurationMs(currentTrack.durationMs)}
              </span>

              <button
                type="button"
                onClick={(e) => onOpenContextMenu(e, currentTrack)}
                className="text-[#b3b3b3] hover:text-white focus:outline-none"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#181818] text-center text-[#727272] text-sm">
            No track currently playing
          </div>
        )}
      </section>

      {/* 2. Next in Queue (User manual additions) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#b3b3b3]">
            Next In Queue
          </h2>
          {userQueue.length > 0 && (
            <button
              type="button"
              onClick={onClearUserQueue}
              className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline focus:outline-none"
            >
              Clear queue
            </button>
          )}
        </div>

        {userQueue.length > 0 ? (
          <div className="space-y-1">
            {userQueue.map((track, idx) => (
              <div
                key={`user-${track.id}-${idx}`}
                onClick={() => onPlayTrack(track)}
                onContextMenu={(e) => onOpenContextMenu(e, track)}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#282828] cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs text-[#b3b3b3] w-4 text-center">{idx + 1}</span>
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-10 h-10 rounded object-cover shrink-0"
                  />
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-sm font-medium text-white truncate">{track.title}</span>
                    <span className="text-xs text-[#b3b3b3] truncate">{track.artist}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromUserQueue(idx);
                    }}
                    className="p-1 text-[#b3b3b3] hover:text-[#f3727f] focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from queue"
                  >
                    <Trash2 size={16} />
                  </button>

                  <span className="text-xs text-[#b3b3b3] tabular-nums">
                    {formatDurationMs(track.durationMs)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#181818] text-center text-[#727272] text-xs">
            Add tracks to queue using right-click or track options menu
          </div>
        )}
      </section>

      {/* 3. Next From: [Context] (e.g. Playlist or Album) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#b3b3b3]">
          Next from: <span className="text-white normal-case font-semibold">{contextName}</span>
        </h2>

        <div className="space-y-1">
          {contextQueue.map((track, idx) => (
            <div
              key={`context-${track.id}-${idx}`}
              onClick={() => onPlayTrack(track)}
              onContextMenu={(e) => onOpenContextMenu(e, track)}
              className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#282828] cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xs text-[#b3b3b3] w-4 text-center group-hover:hidden">
                  {idx + 1}
                </span>
                <span className="hidden group-hover:inline-block w-4 text-center text-white">
                  <Play size={12} className="fill-white mx-auto" />
                </span>
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-sm font-medium text-white truncate">{track.title}</span>
                  <span className="text-xs text-[#b3b3b3] truncate">{track.artist}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
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
                    className={track.isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''}
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
          ))}
        </div>
      </section>
    </div>
  );
};
