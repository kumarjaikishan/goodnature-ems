import React from 'react';
import { motion } from 'framer-motion';
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
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          className="absolute inset-0 bg-teal-500 rounded-full blur-xl"
        />

        {/* Concentric Outer Dashed Orbit Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-teal-500/40"
        />

        {/* Concentric Counter-Rotating Accent Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          className="absolute inset-2 rounded-full border-2 border-t-teal-600 border-r-transparent border-b-emerald-500 border-l-transparent shadow-xs"
        />

        {/* Center Symmetric Brand Orb */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="relative z-10 w-11 h-11 bg-gradient-to-tr from-teal-800 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md ring-4 ring-white"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
        </motion.div>
      </div>

      {/* Typography & Staggered Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6 flex flex-col items-center text-center max-w-sm px-4"
      >
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs font-medium text-slate-400 mt-1">
            {subtitle}
          </p>
        )}

        {/* Symmetrical Animated Dot Track */}
        <div className="mt-3 flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.35, 1, 0.35],
                backgroundColor: ['#0f766e', '#10b981', '#0f766e'],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
              className="w-1.5 h-1.5 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PageLoader;
