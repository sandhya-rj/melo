import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Volume,
  Heart,
  ListMusic,
  Maximize2,
  Mic2,
} from 'lucide-react';
import type { TrackRecord, RepeatMode } from '../../../shared/types';

export interface PlayerBarProps {
  currentTrack?: TrackRecord | null;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (seconds: number) => void;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onVolumeChange?: (level: number) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  repeatMode?: RepeatMode;
  onCycleRepeat?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onToggleQueue?: () => void;
  onToggleRightPanel?: (tab: 'nowPlaying' | 'queue') => void;
  isRightPanelOpen?: boolean;
  activeRightPanelTab?: 'nowPlaying' | 'queue';
  onToggleLyrics?: () => void;
  isLyricsActive?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack = {
    id: 't1',
    title: 'Midnight City Lights',
    artist: 'Synthwave Collective',
    album: 'Retro Future',
    durationMs: 214000,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
    audioUrl: '',
    isLiked: false,
  },
  isPlaying: controlledIsPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  currentTime: controlledCurrentTime,
  duration: controlledDuration,
  volume: controlledVolume,
  onVolumeChange,
  isMuted: controlledIsMuted,
  onToggleMute,
  isShuffle: controlledIsShuffle,
  onToggleShuffle,
  repeatMode: controlledRepeatMode,
  onCycleRepeat,
  isLiked: controlledIsLiked,
  onToggleLike,
  onToggleRightPanel,
  isRightPanelOpen,
  activeRightPanelTab,
  onToggleLyrics,
  isLyricsActive = false,
}) => {
  // Local fallback state
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [internalCurrentTime, setInternalCurrentTime] = useState(42);
  const [internalVolume, setInternalVolume] = useState(0.8);
  const [internalMuted, setInternalMuted] = useState(false);
  const [internalShuffle, setInternalShuffle] = useState(false);
  const [internalRepeat, setInternalRepeat] = useState<RepeatMode>('OFF');
  const [internalLiked, setInternalLiked] = useState(false);

  const isPlaying = controlledIsPlaying ?? internalPlaying;
  const currentTime = controlledCurrentTime ?? internalCurrentTime;
  const duration = controlledDuration ?? (currentTrack ? currentTrack.durationMs / 1000 : 214);
  const volume = controlledVolume ?? internalVolume;
  const isMuted = controlledIsMuted ?? internalMuted;
  const isShuffle = controlledIsShuffle ?? internalShuffle;
  const repeatMode = controlledRepeatMode ?? internalRepeat;
  const isLiked = controlledIsLiked ?? (currentTrack?.isLiked || internalLiked);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const progressPercent = duration > 0 ? ((isScrubbing ? scrubValue : currentTime) / duration) * 100 : 0;

  const handlePlayToggle = () => {
    if (onTogglePlay) onTogglePlay();
    else setInternalPlaying((p) => !p);
  };

  const handleLikeToggle = () => {
    if (onToggleLike) onToggleLike();
    else setInternalLiked((l) => !l);
  };

  const handleShuffleToggle = () => {
    if (onToggleShuffle) onToggleShuffle();
    else setInternalShuffle((s) => !s);
  };

  const handleRepeatCycle = () => {
    if (onCycleRepeat) {
      onCycleRepeat();
    } else {
      const next: Record<RepeatMode, RepeatMode> = { OFF: 'ALL', ALL: 'ONE', ONE: 'OFF' };
      setInternalRepeat(next[repeatMode]);
    }
  };

  const handleMuteToggle = () => {
    if (onToggleMute) onToggleMute();
    else setInternalMuted((m) => !m);
  };

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    if (onVolumeChange) onVolumeChange(clamped);
    else setInternalVolume(clamped);
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * duration;
    setIsScrubbing(true);
    setScrubValue(targetTime);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const movePos = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      setScrubValue(movePos * duration);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      const finalPos = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width));
      const finalTime = finalPos * duration;
      setIsScrubbing(false);
      if (onSeek) onSeek(finalTime);
      else setInternalCurrentTime(finalTime);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleVolumeChange(pos);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const movePos = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      handleVolumeChange(movePos);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Speaker Icon depending on volume
  const renderVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={18} />;
    if (volume < 0.33) return <Volume size={18} />;
    if (volume < 0.66) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-black border-t border-[#282828] px-4 flex items-center justify-between select-none z-40">
      {/* 1. Left Section: Now Playing Track Info (30% min 180px, max 320px) */}
      <div className="flex items-center gap-3 w-[30%] min-w-[180px] max-w-[320px]">
        {currentTrack?.coverUrl ? (
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-14 h-14 rounded shadow object-cover bg-[#282828] shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded bg-[#282828] flex items-center justify-center shrink-0">
            <span className="text-xl">🎵</span>
          </div>
        )}

        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
            {currentTrack ? currentTrack.title : 'No Track Selected'}
          </span>
          <span className="text-xs text-[#b3b3b3] truncate hover:underline hover:text-white cursor-pointer">
            {currentTrack ? currentTrack.artist : '—'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLikeToggle}
          className="btn-icon-subdued ml-1 focus:outline-none"
          title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
          aria-label={isLiked ? 'Unlike track' : 'Like track'}
        >
          <Heart
            size={18}
            className={isLiked ? 'fill-[#1ed760] text-[#1ed760] scale-105' : 'text-[#b3b3b3]'}
          />
        </button>
      </div>

      {/* 2. Center Section: Playback Controls & Timeline (40% max 722px) */}
      <div className="flex flex-col items-center justify-center w-[40%] max-w-[722px]">
        {/* Transport Row */}
        <div className="flex items-center gap-4 mb-1">
          {/* Shuffle */}
          <button
            type="button"
            onClick={handleShuffleToggle}
            className={`btn-icon-subdued ${isShuffle ? 'btn-icon-active' : ''} focus:outline-none`}
            title={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
            aria-label="Toggle shuffle"
          >
            <Shuffle size={16} />
          </button>

          {/* Previous */}
          <button
            type="button"
            onClick={onPrevious}
            className="btn-icon-subdued focus:outline-none"
            title="Previous"
            aria-label="Previous track"
          >
            <SkipBack size={20} className="fill-current" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={handlePlayToggle}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-106 active:scale-95 transition-transform shadow-md focus:outline-none"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={16} className="fill-black text-black" />
            ) : (
              <Play size={16} className="fill-black text-black ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={onNext}
            className="btn-icon-subdued focus:outline-none"
            title="Next"
            aria-label="Next track"
          >
            <SkipForward size={20} className="fill-current" />
          </button>

          {/* Repeat */}
          <button
            type="button"
            onClick={handleRepeatCycle}
            className={`btn-icon-subdued ${repeatMode !== 'OFF' ? 'btn-icon-active' : ''} focus:outline-none`}
            title={`Repeat: ${repeatMode}`}
            aria-label="Cycle repeat mode"
          >
            {repeatMode === 'ONE' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Timeline Row with Scrub Slider */}
        <div className="flex items-center gap-2 w-full max-w-[500px]">
          <span className="text-[11px] text-[#b3b3b3] tabular-nums min-w-[34px] text-right select-none">
            {formatTime(isScrubbing ? scrubValue : currentTime)}
          </span>

          <div
            onMouseDown={handleTimelineMouseDown}
            className="slider-container group"
          >
            <div className="slider-track">
              <div
                className="slider-fill"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="slider-thumb"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          <span className="text-[11px] text-[#b3b3b3] tabular-nums min-w-[34px] select-none">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Right Section: Secondary & Volume Controls (30% min 180px) */}
      <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px]">
        {/* Right Panel / Now Playing Toggle */}
        <button
          type="button"
          onClick={() => onToggleRightPanel?.('nowPlaying')}
          className={`btn-icon-subdued ${
            isRightPanelOpen && activeRightPanelTab === 'nowPlaying' ? 'text-[#1ed760]' : ''
          } focus:outline-none`}
          title="Now playing view"
          aria-label="Toggle now playing panel"
        >
          <Maximize2 size={16} />
        </button>

        {/* Synced Lyrics Toggle Button */}
        <button
          type="button"
          onClick={onToggleLyrics}
          className={`btn-icon-subdued ${
            isLyricsActive ? 'text-[#1ed760]' : ''
          } focus:outline-none`}
          title="Lyrics"
          aria-label="Toggle synchronized lyrics view"
        >
          <Mic2 size={16} />
        </button>

        {/* Queue Drawer Toggle */}
        <button
          type="button"
          onClick={() => onToggleRightPanel?.('queue')}
          className={`btn-icon-subdued ${
            isRightPanelOpen && activeRightPanelTab === 'queue' ? 'text-[#1ed760]' : ''
          } focus:outline-none`}
          title="Queue"
          aria-label="Toggle queue"
        >
          <ListMusic size={18} />
        </button>

        {/* Volume Slider & Mute Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMuteToggle}
            className="btn-icon-subdued focus:outline-none"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label="Toggle mute"
          >
            {renderVolumeIcon()}
          </button>

          <div
            className="w-24 group relative flex items-center h-3 cursor-pointer"
            onMouseDown={handleVolumeMouseDown}
          >
            <div className="slider-track">
              <div
                className="slider-fill"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <div
                className="slider-thumb"
                style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
