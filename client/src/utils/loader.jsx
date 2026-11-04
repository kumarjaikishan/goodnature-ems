import React from "react";

const Loader = () => {
  return (
    <div className="relative w-full p-4 flex flex-col justify-center items-center gap-2 select-none">
      <style>{`
        @keyframes gfBreathing {
          0%, 100% {
            transform: scale(0.90);
            filter: drop-shadow(0 3px 10px rgba(13, 148, 136, 0.15));
          }
          50% {
            transform: scale(1.10);
            filter: drop-shadow(0 8px 18px rgba(13, 148, 136, 0.28));
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
        .animate-gf-stream {
          animation: gfStream 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Floating GF Logo */}
      <div className="relative flex items-center justify-center w-16 h-16">
        <img
          src="/logo.webp"
          alt="Good Feel Logo"
          className="w-14 h-14 object-contain animate-gf-breathing select-none"
          onError={(e) => {
            e.currentTarget.src = "/favicon.png";
          }}
        />
      </div>

      <div className="mt-2 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold tracking-[0.24em] text-slate-600 uppercase">
            Loading
          </span>
          <span className="flex items-center gap-0.5 ml-0.5">
            <span className="w-1 h-1 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" />
          </span>
        </div>

        <div className="w-20 h-[2px] bg-slate-200/80 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 w-10 bg-gradient-to-r from-transparent via-teal-600 to-emerald-500 rounded-full animate-gf-stream" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
