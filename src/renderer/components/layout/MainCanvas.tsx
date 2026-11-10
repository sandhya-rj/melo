import React, { useRef } from 'react';

export interface MainCanvasProps {
  children?: React.ReactNode;
  heroAccentColor?: string;
  onScroll?: (scrollTop: number) => void;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({
  children,
  heroAccentColor = '#1db954',
  onScroll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll?.(e.currentTarget.scrollTop);
  };

  return (
    <main
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 h-full overflow-y-auto rounded-lg bg-[#121212] relative flex flex-col focus:outline-none"
      tabIndex={0}
    >
      {/* Dynamic Header Gradient Backdrop */}
      <div
        className="absolute top-0 left-0 right-0 h-80 pointer-events-none transition-colors duration-700 ease-out z-0"
        style={{
          background: `linear-gradient(180deg, ${heroAccentColor}33 0%, rgba(18, 18, 18, 0) 100%)`,
        }}
      />

      {/* Main Canvas Content */}
      <div className="relative z-10 p-6 flex-1 flex flex-col">
        {children}
      </div>
    </main>
  );
};
