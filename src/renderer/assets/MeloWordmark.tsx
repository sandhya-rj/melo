import React from 'react';

export interface MeloWordmarkProps {
  height?: number;
  className?: string;
  fill?: string;
}

export const MeloWordmark: React.FC<MeloWordmarkProps> = ({
  height = 20,
  className = '',
  fill = '#FFFFFF',
}) => {
  // Calculated aspect ratio for "MELO": width = height * 4.25
  const width = height * 4.25;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 102 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MELO Wordmark"
    >
      {/* Letter M */}
      <path
        d="M 4 21 V 3 H 8.5 L 14.5 13.5 L 20.5 3 H 25 V 21 H 20.5 V 9.5 L 15.2 18.5 H 13.8 L 8.5 9.5 V 21 H 4 Z"
        fill={fill}
      />
      {/* Letter E */}
      <path
        d="M 32 21 V 3 H 48 V 7 H 36.5 V 10.2 H 46 V 14.2 H 36.5 V 17 H 48.5 V 21 H 32 Z"
        fill={fill}
      />
      {/* Letter L */}
      <path
        d="M 55 21 V 3 H 59.5 V 17 H 70 V 21 H 55 Z"
        fill={fill}
      />
      {/* Letter O */}
      <path
        d="M 87 2.5 C 93.35 2.5 98.5 7.65 98.5 14 C 98.5 20.35 93.35 25.5 87 25.5 C 80.65 25.5 75.5 20.35 75.5 14 C 75.5 7.65 80.65 2.5 87 2.5 Z M 87 6.8 C 83.02 6.8 79.8 10.02 79.8 14 C 79.8 17.98 83.02 21.2 87 21.2 C 90.98 21.2 94.2 17.98 94.2 14 C 94.2 10.02 90.98 6.8 87 6.8 Z"
        fill={fill}
        transform="translate(0, -2)"
      />
    </svg>
  );
};
