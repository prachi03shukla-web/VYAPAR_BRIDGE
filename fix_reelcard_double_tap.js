import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldInteraction = `  const handleInteractionClick = (e: React.MouseEvent) => {
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

const newInteraction = `  const handleInteractionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      handleDoubleTap(e);
      return;
    }
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleDoubleTap(e);
    } else {
      clickTimerRef.current = setTimeout(() => {
        togglePlay();
        clickTimerRef.current = null;
      }, 300);
    }
  };`;

code = code.replace(oldInteraction, newInteraction);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ReelCard double tap delay');
