import React from 'react';
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  ArrowLeft, 
  Search, 
  HelpCircle, 
  Compass, 
  LayoutDashboard,
  CalendarCheck,
  Building2,
  Sparkles,
  MapPinOff
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

const Errorpage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const quickLinks = [
    { title: "Dashboard", desc: "Go to overview", path: "/", icon: LayoutDashboard },
    { title: "Attendance", desc: "View logs & status", path: "/admin/attendance", icon: CalendarCheck },
    { title: "Organization", desc: "Branches & departments", path: "/admin/organization/departments", icon: Building2 },
  ];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 overflow-hidden px-4 py-8 select-none">
      
      {/* Dynamic Animated Ambient Background Blobs */}
      <motion.div 
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-teal-300/30 rounded-full blur-3xl pointer-events-none" 
      />
      
      <motion.div 
        animate={{
          x: [0, -35, 25, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" 
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-xl w-full text-center flex flex-col items-center"
      >
        
        {/* Animated Badge */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50/90 backdrop-blur-sm border border-teal-200/70 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
          </motion.div>
          <span>Page Not Found</span>
        </motion.div>

        {/* 404 Large Interactive & Floating Graphics */}
        <motion.div 
          variants={itemVariants}
          className="relative mb-2 flex items-center justify-center"
        >
          {/* Floating decorative mini-icons */}
          <motion.div
            animate={{ y: [-6, 6, -6], rotate: [-8, 8, -8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-6 sm:-left-12 top-2 p-2 rounded-xl bg-white shadow-md border border-slate-100 text-teal-600 hidden xs:flex"
          >
            <MapPinOff className="w-5 h-5" />
          </motion.div>

          <motion.div
            animate={{ y: [6, -6, 6], rotate: [8, -8, 8] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-6 sm:-right-12 bottom-4 p-2 rounded-xl bg-white shadow-md border border-slate-100 text-amber-500 hidden xs:flex"
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>

          {/* Floating & hovering 404 */}
          <motion.h1 
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="text-8xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 drop-shadow-sm leading-none"
          >
            404
          </motion.h1>
        </motion.div>

        {/* Headline & Subtitle */}
        <motion.h2 
          variants={itemVariants}
          className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-3"
        >
          Lost in the workplace?
        </motion.h2>

        <motion.p 
          variants={itemVariants}
          className="text-slate-500 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed"
        >
          The page you're searching for doesn't exist, was moved, or you might not have access to view it.
        </motion.p>

        {/* Action Buttons with spring hover & tap effects */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium text-sm shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Go Back</span>
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white bg-teal-700 hover:bg-teal-800 transition-colors font-medium text-sm shadow-md shadow-teal-700/20 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Helpful quick jump destinations */}
        <motion.div 
          variants={itemVariants}
          className="w-full bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm"
        >
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-left px-1 flex items-center justify-between">
            <span>Popular Destinations</span>
            <Search className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <motion.div
                  key={link.title}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                >
                  <Link
                    to={link.path}
                    className="group flex flex-col items-start p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all text-left w-full h-full"
                  >
                    <div className="p-2 rounded-lg bg-white border border-slate-200/60 text-slate-600 group-hover:text-teal-700 group-hover:border-teal-200 group-hover:shadow-sm transition-all mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900 transition-colors">
                      {link.title}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {link.desc}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer Support Info */}
        <motion.div 
          variants={itemVariants}
          className="mt-7 text-xs text-slate-400 flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Need assistance? Contact your system administrator.</span>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default Errorpage;