import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  textColor?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 32,
  textColor,
  showText = true,
  variant = 'dark',
}) => {
  // If textColor is explicitly supplied, use it; otherwise infer from variant:
  // variant='light' means placed on dark backgrounds -> text is Oat Cream (#F5F1E6)
  // variant='dark' means placed on light backgrounds -> text is Deep Moss (#1F3D2B)
  const resolvedTextColor = textColor || (variant === 'light' ? '#F5F1E6' : '#1F3D2B');
  const bgFill = variant === 'light' ? 'rgba(245, 241, 230, 0.12)' : '#1F3D2B';
  const leafFill = variant === 'light' ? '#E4EDB8' : '#E4EDB8';
  const stemStroke = variant === 'light' ? '#1F3D2B' : '#1F3D2B';
  const borderStroke = variant === 'light' ? 'rgba(255, 255, 255, 0.15)' : 'transparent';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Handcrafted LeafPulse custom botanical mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        {/* Soft rounded container background */}
        <rect
          width="36"
          height="36"
          rx="10"
          fill={bgFill}
          stroke={borderStroke}
          strokeWidth="1"
        />

        {/* Curved botanical leaf silhouette */}
        <path
          d="M10 26C10 17 16 9 27 7C25 19 17 26 10 26Z"
          fill={leafFill}
        />

        {/* Fine leaf stem & inner pulse vein */}
        <path
          d="M10 26C14.5 22.5 19 18 23 12.5"
          stroke={stemStroke}
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* Lower stem rooted down */}
        <path
          d="M10 26L7.5 28.5"
          stroke="#3E7B52"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Small terracotta pulse spark dot */}
        <circle cx="27" cy="8" r="2.2" fill="#C8693F" />
      </svg>

      {showText && (
        <span
          className="font-serif font-bold text-xl tracking-tight leading-none"
          style={{ color: resolvedTextColor }}
        >
          LeafPulse
        </span>
      )}
    </div>
  );
};
