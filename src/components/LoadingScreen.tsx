import React, { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';

interface LoadingScreenProps {
  message?: string;
  isInitialBoot?: boolean;
  onFinish?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Initializing Campus Event System...',
  isInitialBoot = false,
  onFinish
}) => {
  const [progress, setProgress] = useState(15);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(45), 180);
    const timer2 = setTimeout(() => setProgress(82), 400);
    const timer3 = setTimeout(() => setProgress(100), 750);
    const timer4 = setTimeout(() => {
      setFadeOut(true);
      if (onFinish) {
        setTimeout(onFinish, 300);
      }
    }, 950);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-navy-dark via-navy to-slate-900 text-white transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-royal/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-teal/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Brand Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full space-y-6">
        {/* Pulsing University Badge & Logo */}
        <div className="relative">
          <div className="absolute -inset-3 bg-gradient-to-r from-royal via-teal to-turquoise rounded-3xl opacity-40 blur-xl animate-pulse" />
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl flex items-center justify-center">
            <BrandLogo size="lg" />
          </div>
        </div>

        {/* Brand Tagline & Institutional Affiliation */}
        <div className="space-y-1.5">
          <p className="text-xs font-black tracking-widest uppercase text-turquoise">
            Nasarawa State University, Keffi
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Stay Connected. Never Miss an Event.
          </h2>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Official Campus Event Management & Notification System
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-royal via-turquoise to-teal rounded-full transition-all duration-300 ease-out shadow-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
              <span>{message}</span>
            </span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Footer System Credits */}
      <div className="absolute bottom-6 text-center text-[10px] text-slate-500 font-medium">
        Secured Campus Portal • Africa/Lagos (WAT UTC+1)
      </div>
    </div>
  );
};
