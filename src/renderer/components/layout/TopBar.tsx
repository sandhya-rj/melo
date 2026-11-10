import React from 'react';
import { ChevronLeft, ChevronRight, Search, Bell, User } from 'lucide-react';
import { MeloBrandLockup } from '../brand/MeloBrandLockup';
import { WindowControls } from './WindowControls';

export interface TopBarProps {
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchFocus?: () => void;
  onBrandClick?: () => void;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  isPrivateSession?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  searchQuery = '',
  onSearchChange,
  onSearchFocus,
  onBrandClick,
  onProfileClick,
  onNotificationsClick,
  isPrivateSession = false,
}) => {
  return (
    <header
      className="h-16 w-full flex items-center px-4 bg-black select-none z-30 relative shrink-0"
      style={{ WebkitAppRegion: 'drag' as any }}
    >
      {/* Left Section: Brand & History Navigation */}
      <div className="flex items-center gap-4">
        <MeloBrandLockup onClick={onBrandClick} size="md" />

        {/* History Navigation Buttons */}
        <div
          className="flex items-center gap-2 ml-2"
          style={{ WebkitAppRegion: 'no-drag' as any }}
        >
          <button
            type="button"
            onClick={onGoBack}
            disabled={!canGoBack}
            className="w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center text-white hover:bg-[#1f1f1f] disabled:opacity-40 disabled:hover:bg-[#121212] transition-colors focus:outline-none"
            title="Go back"
            aria-label="Go back"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onGoForward}
            disabled={!canGoForward}
            className="w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center text-white hover:bg-[#1f1f1f] disabled:opacity-40 disabled:hover:bg-[#121212] transition-colors focus:outline-none"
            title="Go forward"
            aria-label="Go forward"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Center Section: Global Search Input Pill */}
      <div
        className="flex-1 max-w-md mx-6"
        style={{ WebkitAppRegion: 'no-drag' as any }}
      >
        <div className="relative flex items-center">
          <div className="absolute left-3 text-[#b3b3b3] pointer-events-none flex items-center">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onFocus={onSearchFocus}
            placeholder="What do you want to play?"
            className="w-full h-11 pl-10 pr-4 bg-[#1f1f1f] hover:bg-[#282828] focus:bg-[#282828] text-white text-sm placeholder-[#727272] rounded-full border border-transparent focus:border-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right Section: Notification, User Profile, Window Controls */}
      <div className="flex items-center gap-3 ml-auto">
        <div
          className="flex items-center gap-2.5"
          style={{ WebkitAppRegion: 'no-drag' as any }}
        >
          {isPrivateSession && (
            <div
              className="px-2.5 py-1 rounded-full bg-[#1e3a8a] text-[#93c5fd] text-xs font-semibold flex items-center gap-1.5 border border-[#3b82f6]/40 shadow-sm animate-in fade-in"
              title="Private Session Active"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
              <span>Private Session</span>
            </div>
          )}

          <button
            type="button"
            onClick={onNotificationsClick}
            className="w-8 h-8 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors focus:outline-none"
            title="What's New"
            aria-label="What's New"
          >
            <Bell size={16} />
          </button>

          <button
            type="button"
            onClick={onProfileClick}
            className="w-8 h-8 rounded-full bg-[#282828] hover:scale-105 border border-white/10 text-white flex items-center justify-center transition-transform focus:outline-none"
            title="Settings & Profile"
            aria-label="Settings & Profile"
          >
            <User size={16} />
          </button>
        </div>

        {/* Windows Frameless Title Bar Controls */}
        <WindowControls />
      </div>
    </header>
  );
};
