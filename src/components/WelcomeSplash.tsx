import React, { useEffect, useState, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { BRAND_LOGO_SRC, BRAND_NAME, BRAND_TAGLINE, BRAND_MOTTO } from "../constants/brandLogo";

interface WelcomeSplashProps {
  onComplete?: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing Vyapar Bridge Commerce Hub...");
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 400);
  };

  // Pure 4-Second Brand Welcome Progress Bar
  useEffect(() => {
    // 4000ms / 100 steps = 40ms per increment
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next < 25) {
          setStatusText("Connecting Manufacturers, Wholesalers & Dealers...");
        } else if (next < 55) {
          setStatusText("Loading Verified Tiles & Building Material Hubs...");
        } else if (next < 85) {
          setStatusText("Powering ONDC Direct B2B Commerce...");
        } else if (next < 99) {
          setStatusText("✨ Vocal For Local - Welcome to Vyapar Bridge! ✨");
        } else {
          setStatusText("✨ Welcome to Vyapar Bridge! ✨");
          clearInterval(interval);
          setTimeout(() => {
            handleFinish();
          }, 350);
          return 100;
        }
        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const brandLetters = "VYAPAR BRIDGE".split("");

  return (
    <div
      id="brand-intro-splash"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-black text-white transition-all duration-500 select-none overflow-hidden ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex items-center justify-center sm:justify-start z-30">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="tiranga-border-circle shadow-xl">
            <img
              src={BRAND_LOGO_SRC}
              alt="Vyapar Bridge Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full bg-slate-50 p-0.5"
            />
          </div>
          <div>
            <h1
              className="text-base sm:text-lg font-black italic tracking-wider tiranga-shimmer-text leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {BRAND_NAME}
            </h1>
            <p className="text-[10px] sm:text-xs text-amber-300 font-bold uppercase tracking-wider">
              {BRAND_TAGLINE}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center flex-1 text-center z-20 py-4">
        {/* Main Glowing Brand Emblem */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 blur-2xl opacity-60 animate-pulse" />
          <div className="relative tiranga-border-circle p-2 shadow-2xl bg-black/80">
            <img
              src={BRAND_LOGO_SRC}
              alt="Vyapar Bridge Crest"
              className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-full bg-slate-50 p-1"
            />
          </div>
        </div>

        {/* Raindrop Staggered Brand Letter Animation */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3 flex-wrap">
          {brandLetters.map((char, index) => (
            <span
              key={index}
              className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-widest bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-100 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] inline-block transition-all transform hover:scale-125"
              style={{
                fontFamily: "'Playfair Display', 'Dancing Script', serif",
                animation: `bounce 1.5s infinite ease-in-out ${index * 0.08}s`,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>

        {/* Digital India & Vocal for Local Badges */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> VOCAL FOR LOCAL
          </span>
          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-black tracking-wider uppercase shadow-md">
            🇮🇳 DIGITAL INDIA B2B
          </span>
        </div>

        {/* 4-Second Brand Progress Bar */}
        <div className="w-full max-w-md bg-zinc-950/90 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-300 font-mono text-[11px] sm:text-xs text-left truncate max-w-[80%]">{statusText}</span>
            <span className="font-mono text-amber-400 font-black text-xs sm:text-sm">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-amber-500/40 p-0.5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)]">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 rounded-full transition-all duration-75 shadow-[0_0_15px_rgba(245,158,11,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full max-w-4xl mx-auto px-4 pb-4 sm:pb-6 flex flex-col items-center justify-center gap-1 z-30 text-center animate-in fade-in duration-300">
        <p
          className="text-xs sm:text-sm font-black italic tracking-[0.2em] uppercase bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent drop-shadow-md flex items-center gap-1.5"
          style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {BRAND_MOTTO}
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </p>
        <p className="text-[10px] sm:text-xs text-zinc-400 tracking-wider">
          Direct B2B Network for Indian Manufacturers, Dealers & Trade Hubs
        </p>
      </footer>
    </div>
  );
};
