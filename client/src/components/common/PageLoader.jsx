import React from 'react';

/**
 * Modern High-Fidelity UI/UX Page & Component Loader
 * Displays the GF brand emblem directly with breathing zoom animation,
 * ambient soft backlight halo, and sleek progress stream.
 */
const PageLoader = ({
  title = 'Loading',
  subtitle = null,
  fullScreen = false,
  minHeight = 'min-h-[calc(100vh-140px)]',
}) => {
  const containerCls = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-sm select-none'
    : `flex flex-col items-center justify-center w-full ${minHeight} bg-transparent select-none p-8`;

  return (
    <div className={containerCls}>
      <style>{`
        @keyframes gfBreathing {
          0%, 100% {
            transform: scale(0.90);
            filter: drop-shadow(0 4px 14px rgba(13, 148, 136, 0.15));
          }
          50% {
            transform: scale(1.10);
            filter: drop-shadow(0 14px 28px rgba(13, 148, 136, 0.28));
          }
        }
        @keyframes gfAuraPulse {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.30;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.65;
          }
        }
        @keyframes gfStream {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(120%);
          }
          100% {
            transform: translateX(300%);
          }
        }
        .animate-gf-breathing {
          animation: gfBreathing 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-gf-aura {
          animation: gfAuraPulse 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-gf-stream {
          animation: gfStream 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Centerpiece Container: Logo with Ambient Halo */}
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Soft Ambient Backlight Halo */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-teal-500/25 via-emerald-400/20 to-teal-300/25 blur-2xl animate-gf-aura pointer-events-none" />

        {/* Clean Floating Logo */}
        <img
          src="/logo.webp"
          alt="Good Feel Logo"
          className="relative w-20 h-20 object-contain animate-gf-breathing select-none z-10"
          onError={(e) => {
            e.currentTarget.src = '/favicon.png';
          }}
        />
      </div>

      {/* Typography & Sleek Activity Bar */}
      <div className="mt-5 flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.28em] text-slate-700 uppercase">
            {title}
          </span>
          <span className="flex items-center gap-1 ml-0.5">
            <span className="w-1 h-1 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" />
          </span>
        </div>

        {/* Micro Stream Line */}
        <div className="w-28 h-[2.5px] bg-slate-200/80 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 w-14 bg-gradient-to-r from-transparent via-teal-600 to-emerald-500 rounded-full animate-gf-stream" />
        </div>

        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageLoader;
