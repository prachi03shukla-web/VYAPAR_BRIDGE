import re

# Update App.tsx
with open('src/App.tsx', 'r') as f:
    app_content = f.read()

app_content = app_content.replace("SYNLOGIC AI TECH SOLUTION & DEVELOPERS HUB", "POWERED BY SYNLOGIC AI TECH SOLUTION & DEVELOPERS HUB")

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

# Update FootballIntroSplash.tsx
splash_content = """import React, { useEffect, useState, useRef } from 'react';

interface FootballIntroSplashProps {
  onComplete?: () => void;
}

export const FootballIntroSplash: React.FC<FootballIntroSplashProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  
  const [phase, setPhase] = useState<'text' | 'video'>('text');
  const [videoDuration, setVideoDuration] = useState(0);

  const textDuration = 8000; // 8 seconds for text progress bar

  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Progress bar update based on textDuration
    const intervalTime = textDuration / 100;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    // After textDuration, switch to video if available, else complete
    phaseTimerRef.current = setTimeout(() => {
      if (isVideoLoaded && !hasVideoError) {
        setPhase('video');
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(()=>{});
        }
        // Set timer for video to finish
        const vDur = videoDuration > 0 ? videoDuration : 5000; // fallback 5s
        fadeTimerRef.current = setTimeout(() => setIsFadingOut(true), vDur - 500);
        completeTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, vDur);
      } else {
        // No video, just complete
        setIsFadingOut(true);
        completeTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, 500);
      }
    }, textDuration);

    return () => {
      clearInterval(interval);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [textDuration, isVideoLoaded, hasVideoError, videoDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-500 select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Video (Hidden during 'text' phase) */}
      {!hasVideoError && (
        <video
          ref={videoRef}
          src="/welcome.mp4"
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
            phase === 'video' ? 'opacity-100' : 'opacity-0'
          } pointer-events-none`}
          onLoadedMetadata={(e) => {
            const vidDuration = e.currentTarget.duration;
            if (vidDuration && vidDuration > 0 && vidDuration !== Infinity) {
              setVideoDuration(vidDuration * 1000);
            }
            setIsVideoLoaded(true);
          }}
          onError={() => {
            setHasVideoError(true);
            setIsVideoLoaded(false);
          }}
        />
      )}

      {/* Main Content Container (Text Phase) */}
      <div 
        className={`relative z-10 flex flex-col items-center text-center px-6 py-8 sm:px-12 sm:py-12 bg-black/40 backdrop-blur-sm rounded-3xl max-w-4xl w-full border border-transparent transition-opacity duration-1000 ${
          phase === 'text' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Animated Brand Header */}
        <h1 
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-[0.18em] brand-torch-text drop-shadow-[0_4px_25px_rgba(37,99,235,0.6)]"
          style={{ fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif", fontWeight: 900 }}
        >
          VYAPAR BRIDGE
        </h1>
        
        {/* Digital India Tagline */}
        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-2 drop-shadow-md">
          <span className="text-base sm:text-xl">🇮🇳</span>
          <p className="text-xs sm:text-sm md:text-base font-bold tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-amber-200">
            Digital India Initiative for Tiles & Marble
          </p>
        </div>
        
        <p className="text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-[0.25em] uppercase text-sky-200/80 mt-4 text-center">
          POWERED BY SYNLOGIC AI TECH SOLUTION & DEVELOPERS HUB
        </p>

        {/* Glowing Synchronized Progress Bar */}
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

      {/* Skip Button */}
      <button
        onClick={() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
          }, 200);
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
    f.write(splash_content)

print("Done")
