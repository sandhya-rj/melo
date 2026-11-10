import React from 'react';
import { MeloLogo } from './MeloLogo';
import { MeloWordmark } from './MeloWordmark';

export interface MeloBrandLockupProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MeloBrandLockup: React.FC<MeloBrandLockupProps> = ({
  onClick,
  className = '',
  size = 'md',
}) => {
  const dimensions = {
    sm: { logo: 24, wordmark: 16, gap: 'gap-2' },
    md: { logo: 30, wordmark: 19, gap: 'gap-2.5' },
    lg: { logo: 40, wordmark: 24, gap: 'gap-3.5' },
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center ${dimensions.gap} focus:outline-none focus:ring-2 focus:ring-[#1ed760] rounded-md px-1.5 py-1 transition-opacity hover:opacity-95 ${className}`}
      style={{ WebkitAppRegion: 'no-drag' as any }}
      title="MELO Home"
    >
      <MeloLogo size={dimensions.logo} />
      <MeloWordmark height={dimensions.wordmark} />
    </button>
  );
};
