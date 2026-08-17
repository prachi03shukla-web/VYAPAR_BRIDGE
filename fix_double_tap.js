import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldInteraction = `  const handleMediaInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimeout.current) {
      // It's a double click
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleDoubleClickImage();
    } else {
      // Start a timeout for a single click
      clickTimeout.current = setTimeout(() => {
        if (onPostClick) onPostClick();
        clickTimeout.current = null;
      }, 250);
    }
  };`;

const newInteraction = `  const handleMediaInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) {
      // Native double click detected
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
      handleDoubleClickImage();
      return;
    }
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleDoubleClickImage();
    } else {
      clickTimeout.current = setTimeout(() => {
        if (onPostClick) onPostClick();
        clickTimeout.current = null;
      }, 300); // Increased delay for mobile double-tap
    }
  };`;

code = code.replace(oldInteraction, newInteraction);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed double tap delay');
