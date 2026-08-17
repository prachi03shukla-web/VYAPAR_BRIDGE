const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove "Reels <Sparkles...>"
code = code.replace(
  /<span className="font-bold text-base tracking-wide flex items-center gap-1\.5 drop-shadow-md">\s*Reels <Sparkles className="w-4 h-4 text-amber-300" \/>\s*<\/span>/g,
  ''
);

// 2. Remove Music / Audio Track Ticker
const musicTickerRegex = /\{\/\* Music \/ Audio Track Ticker \*\/\}[\s\S]*?<\/div>\s*\{\/\* Caption text with/g;
code = code.replace(musicTickerRegex, '{/* Caption text with');

// 3. Remove Star Rating Button
const starRatingRegex = /\{\/\* Star Rating Button[^\}]+\*\/\}[\s\S]*?<\/button>\s*\{\/\* Insights Display \*\/\}/g;
code = code.replace(starRatingRegex, '{/* Insights Display */}');

// 4. Update Interaction Overlay click handler
const oldInteraction = `  const handleInteractionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastClickTime.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      handleDoubleTap(e);
      lastClickTime.current = 0; // Reset to prevent triple-tap double-trigger
    } else {
      // Potential single tap
      lastClickTime.current = now;
      clickTimerRef.current = setTimeout(() => {
        togglePlay();
        clickTimerRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };`;

const newInteraction = `  const handleInteractionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleDoubleTap(e);
    } else {
      clickTimerRef.current = setTimeout(() => {
        togglePlay();
        clickTimerRef.current = null;
      }, 250);
    }
  };`;

code = code.replace(oldInteraction, newInteraction);

// Also make the interaction overlay explicitly bg-transparent to catch all touches
code = code.replace(
  `className="absolute inset-0 z-20 cursor-pointer"`,
  `className="absolute inset-0 z-[30] cursor-pointer bg-transparent"`
);

// Optional: Add native onDoubleClick as fallback to the overlay
code = code.replace(
  `onClick={handleInteractionClick}`,
  `onClick={handleInteractionClick} onDoubleClick={(e) => { e.stopPropagation(); if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; } handleDoubleTap(e); }}`
);


fs.writeFileSync('src/App.tsx', code);
console.log("Updated ReelCard: removed headers/music, updated double tap.");
