import re

with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    content = f.read()

# Make it much simpler:
replacement = """import React, { useEffect, useState, useRef } from "react";

interface FootballIntroSplashProps {
  onComplete?: () => void;
}

export const FootballIntroSplash: React.FC<FootballIntroSplashProps> = ({
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let currentProgress = 0;
    const textDuration = 6000;
    const intervalTime = textDuration / 100;

    const progressInterval = setInterval(() => {
      currentProgress += 1;
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setProgress(100);
      } else {
        setProgress(currentProgress);
      }
    }, intervalTime);

    // Fade out splash after video duration or fallback 6s
    const timeout = setTimeout(() => {
       let vDur = videoRef.current?.duration;
       if (!vDur || isNaN(vDur) || vDur === Infinity) vDur = 6;
       
       setIsFadingOut(true);
       setTimeout(() => {
         setIsVisible(false);
         if (onComplete) onComplete();
       }, 1000);
    }, textDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-1000 select-none overflow-hidden ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Video ALWAYS playing */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
      >
        <source src="/welcome_v6.mp4" type="video/mp4" />
      </video>

      {/* Main Content Container */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 py-8 sm:px-12 sm:py-12 bg-black/40 backdrop-blur-md rounded-3xl max-w-4xl w-full border border-white/5 shadow-2xl"
      >
        <h1
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-[0.18em] brand-torch-text drop-shadow-[0_4px_25px_rgba(37,99,235,0.6)]"
          style={{
            fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif",
            fontWeight: 900,
          }}
        >
          VYAPAR BRIDGE
        </h1>
        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-2 drop-shadow-md">
          <span className="text-base sm:text-xl">🇮🇳</span>
          <p className="text-xs sm:text-sm md:text-base font-bold tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-amber-200">
            Digital India Initiative for Trade & Commerce
          </p>
        </div>
        <p className="text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-[0.25em] uppercase text-sky-200/80 mt-4 text-center">
          POWERED BY SYNLOGIC AI TECHNOLOGY & DEVELOPERS HUB
        </p>
        <div className="mt-10 sm:mt-14 w-full max-w-md px-2 flex flex-col items-center gap-2">
          <div className="w-full h-2.5 sm:h-3 bg-slate-900/90 rounded-full p-0.5 border border-slate-700/70 shadow-[0_0_15px_rgba(59,130,246,0.3)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="w-full flex items-center justify-between text-[11px] sm:text-xs font-semibold tracking-wider text-slate-400 px-1">
            <span className="text-sky-300/90 font-mono">{progress}%</span>
            <span className="uppercase text-slate-400 tracking-widest animate-pulse">
              Loading App Experience...
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
          }, 300);
        }}
        className="absolute bottom-6 right-6 px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-full transition-all cursor-pointer z-20 shadow-lg"
      >
        Skip Intro ✕
      </button>
    </div>
  );
};
"""

with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(replacement)

