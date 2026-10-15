import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  isDark?: boolean;
  className?: string;
  disableLink?: boolean;
  to?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  isDark = false,
  className = '',
  disableLink = false,
  to = '/',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  const content = (
    <>
      {/* Dynamic SVG Icon matching user reference image */}
      <div className={`relative ${iconSizes[size]} transition-transform duration-300 group-hover:scale-105 flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Calendar Top Binder Rings / Loops */}
          <rect x="25" y="8" width="9" height="18" rx="4.5" fill={isDark ? '#60A5FA' : '#1D4ED8'} />
          <rect x="66" y="8" width="9" height="18" rx="4.5" fill={isDark ? '#60A5FA' : '#1D4ED8'} />

          {/* Main Calendar Outline Body */}
          <rect
            x="14"
            y="17"
            width="72"
            height="72"
            rx="18"
            stroke={isDark ? '#60A5FA' : '#1D4ED8'}
            strokeWidth="8"
            fill={isDark ? '#0F172A' : '#FFFFFF'}
          />

          {/* Dynamic Heartbeat / Pulse Wave in Teal */}
          <path
            d="M20 54H34L44 28L54 74L65 48L72 54H80"
            stroke="#0D9488"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
          <span className={isDark ? 'text-white' : 'text-[#0B1A3A]'}>Event</span>
          <span className="bg-gradient-to-r from-[#0D9488] via-[#06B6D4] to-[#10B981] bg-clip-text text-transparent">
            Pulse
          </span>
        </div>
        {showTagline && (
          <span className={`font-semibold tracking-wide text-gray-500 dark:text-gray-400 mt-0.5 ${taglineSizes[size]}`}>
            Stay Connected. Never Miss an Event.
          </span>
        )}
      </div>
    </>
  );

  if (disableLink) {
    return (
      <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {content}
    </Link>
  );
};
export default BrandLogo;
