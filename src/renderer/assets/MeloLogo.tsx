import React from 'react';

export interface MeloLogoProps {
  size?: number;
  className?: string;
  withBackground?: boolean;
}

export const MeloLogo: React.FC<MeloLogoProps> = ({
  size = 32,
  className = '',
  withBackground = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
      aria-label="MELO Logo"
    >
      <defs>
        <linearGradient id="melo-bg-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#242424" />
          <stop offset="100%" stopColor="#0E0E0E" />
        </linearGradient>
        <linearGradient id="melo-wave-grad" x1="10" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F5A0" />
          <stop offset="55%" stopColor="#1ED760" />
          <stop offset="100%" stopColor="#169C46" />
        </linearGradient>
        <filter id="melo-glow" x="6" y="8" width="36" height="34" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {withBackground && (
        <rect
          width="48"
          height="48"
          rx="12"
          fill="url(#melo-bg-grad)"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
      )}

      {/* Harmonic Waveform "M" */}
      <path
        d="M 12 33 V 19 C 12 15 15.2 14 17.5 17 L 24 25.5 L 30.5 17 C 32.8 14 36 15 36 19 V 33"
        stroke="url(#melo-wave-grad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#melo-glow)"
      />

      {/* Acoustic Resonance Core Pulse */}
      <circle cx="24" cy="33.5" r="2.5" fill="#00F5A0" />
    </svg>
  );
};
