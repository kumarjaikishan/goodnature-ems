import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Standardized Symmetrical Page & Component Loader
 * Provides an organic, branded Good Nature pulse and rotation animation.
 */
const PageLoader = ({
  title = 'Loading Good Nature...',
  subtitle = 'Fetching real-time records & sync state',
  fullScreen = false,
  minHeight = 'min-h-[calc(100vh-140px)]',
}) => {
  const containerCls = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs select-none'
    : `flex flex-col items-center justify-center w-full ${minHeight} bg-transparent select-none p-8`;

  return (
    <div className={containerCls}>
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Symmetrical Outer Glow Pulse */}
        <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-25 animate-pulse" />

        {/* Concentric Outer Dashed Orbit Ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-teal-500/40 animate-spin"
          style={{ animationDuration: '4s' }}
        />

        {/* Concentric Counter-Rotating Accent Ring */}
        <div
          className="absolute inset-2 rounded-full border-2 border-t-teal-600 border-r-transparent border-b-emerald-500 border-l-transparent shadow-xs animate-spin"
          style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}
        />

        {/* Core Symmetrical Deep Teal Sphere */}
        <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-teal-900 to-teal-700 shadow-md border border-teal-500/30">
          <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
        </div>
      </div>

      {/* Symmetrical Typography Block */}
      <div className="mt-5 text-center space-y-1">
        <h3 className="text-sm md:text-base font-bold text-slate-800 tracking-wide flex items-center justify-center gap-1.5">
          <span>{title}</span>
          <span className="flex space-x-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageLoader;
