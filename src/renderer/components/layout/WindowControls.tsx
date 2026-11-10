import React, { useState, useEffect } from 'react';

export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Initial check
    if (window.electronAPI?.windowIsMaximized) {
      window.electronAPI.windowIsMaximized().then(setIsMaximized).catch(() => {});
    }

    // Subscribe to maximize change events from main process
    if (window.electronAPI?.onMaximizeChange) {
      const cleanup = window.electronAPI.onMaximizeChange((max) => {
        setIsMaximized(max);
      });
      return cleanup;
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize?.().catch(() => {});
  };

  const handleMaximize = async () => {
    if (!window.electronAPI?.windowMaximize) return;
    try {
      await window.electronAPI.windowMaximize();
      const max = await window.electronAPI.windowIsMaximized?.();
      setIsMaximized(Boolean(max));
    } catch {}
  };

  const handleClose = () => {
    window.electronAPI?.windowClose?.().catch(() => {});
  };

  return (
    <div
      className="flex items-center h-full ml-auto"
      style={{ WebkitAppRegion: 'no-drag' as any }}
    >
      {/* Minimize */}
      <button
        type="button"
        onClick={handleMinimize}
        className="w-11 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a] transition-colors focus:outline-none"
        title="Minimize"
        aria-label="Minimize"
      >
        <svg width="10" height="1" viewBox="0 0 10 1">
          <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        type="button"
        onClick={handleMaximize}
        className="w-11 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a] transition-colors focus:outline-none"
        title={isMaximized ? 'Restore' : 'Maximize'}
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="2" y="0.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1" />
            <polyline points="0.5,2.5 0.5,9.5 7.5,9.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      </button>

      {/* Close */}
      <button
        type="button"
        onClick={handleClose}
        className="w-11 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-[#e81123] transition-colors focus:outline-none"
        title="Close"
        aria-label="Close"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  );
};
