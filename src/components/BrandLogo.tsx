import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  isDark?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  isDark = false,
  className = '',
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

  return (
    <Link to="/" className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Dynamic SVG Icon matching the EventPulse branding */}
      <div className={`relative ${iconSizes[size]} transition-transform duration-300 group-hover:scale-105 flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="ep-cal-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="ep-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="ep-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
          </defs>

          {/* Calendar Hanger Rings */}
          <rect x="26" y="8" width="10" height="18" rx="5" fill="#1D4ED8" />
          <rect x="64" y="8" width="10" height="18" rx="5" fill="#1D4ED8" />

          {/* Sparkles / Sunburst top-right */}
          <path d="M78 14L83 8" stroke="#14B8A6" strokeWidth="4" strokeLinecap="round" />
          <path d="M85 22L93 23" stroke="#14B8A6" strokeWidth="4" strokeLinecap="round" />

          {/* Main Calendar Base Rounded Rect */}
          <rect x="14" y="16" width="72" height="74" rx="20" fill="url(#ep-cal-bg)" />
          
          {/* Inner Grid Background */}
          <rect x="22" y="30" width="56" height="52" rx="12" fill="#FFFFFF" />

          {/* Calendar Grid Cells */}
          <rect x="28" y="36" width="9" height="9" rx="2.5" fill="#93C5FD" fillOpacity="0.7" />
          <rect x="42" y="36" width="9" height="9" rx="2.5" fill="#BFDBFE" />
          <rect x="56" y="36" width="9" height="9" rx="2.5" fill="#BFDBFE" />
          <rect x="65" y="36" width="9" height="9" rx="2.5" fill="#0D9488" /> {/* Highlighted date */}

          <rect x="28" y="49" width="9" height="9" rx="2.5" fill="#BFDBFE" />
          <rect x="42" y="49" width="9" height="9" rx="2.5" fill="#DBEAFE" />
          <rect x="56" y="49" width="9" height="9" rx="2.5" fill="#BFDBFE" />
          <rect x="65" y="49" width="9" height="9" rx="2.5" fill="#BFDBFE" />

          <rect x="28" y="62" width="9" height="9" rx="2.5" fill="#93C5FD" fillOpacity="0.8" />
          <rect x="42" y="62" width="9" height="9" rx="2.5" fill="#BFDBFE" />
          <rect x="56" y="62" width="9" height="9" rx="2.5" fill="#93C5FD" fillOpacity="0.9" />
          <rect x="65" y="62" width="9" height="9" rx="2.5" fill="#BFDBFE" />

          {/* Pulse / Heartbeat Wave across calendar */}
          <path
            d="M8 56H38L47 38L55 72L63 56H92"
            stroke="url(#ep-pulse)"
            strokeWidth="6"
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
    </Link>
  );
};
export default BrandLogo;
