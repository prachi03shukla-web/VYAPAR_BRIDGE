import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const postItemSearch = 'function PostItem({';
const postItemIndex = code.indexOf(postItemSearch);

if (postItemIndex !== -1) {
  // Add state for tap handling
  const stateInsertPoint = code.indexOf('const [isLiked, setIsLiked]', postItemIndex);
  code = code.slice(0, stateInsertPoint) + `  const clickTimeout = React.useRef<NodeJS.Timeout | null>(null);\n` + code.slice(stateInsertPoint);

  const doubleClickFuncSearch = 'const handleDoubleClickImage = () => {';
  const newInteractionFunc = `  const handleDoubleClickImage = () => {
    if (!isLiked) {
      handleLike();
    }
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800); // slightly longer heart display
  };

  const handleMediaInteraction = (e: React.MouseEvent) => {
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

  code = code.replace(`  const handleDoubleClickImage = () => {
    if (!isLiked) {
      handleLike();
    }
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 500);
  };`, newInteractionFunc);

  // Update image replacement
  code = code.replace(
    'className="w-full h-full max-h-[80vh] object-contain bg-black cursor-pointer" \n              onClick={onPostClick}',
    'className="w-full h-full max-h-[80vh] object-contain bg-black cursor-pointer" \n              onClick={handleMediaInteraction}'
  );

  code = code.replace(
    'className="w-full h-full max-h-[80vh] object-contain bg-black transform-gpu will-change-transform cursor-pointer" onClick={onPostClick}',
    'className="w-full h-full max-h-[80vh] object-contain bg-black transform-gpu will-change-transform cursor-pointer" onClick={handleMediaInteraction}'
  );

  // Also make sure the Like button is visible in light mode
  code = code.replace(
    '<Heart className={cn("w-6 h-6 transition-all duration-700 active:scale-95", isLiked ? "text-red-500 fill-red-500" : "")} />',
    '<Heart className={cn("w-6 h-6 transition-all duration-700 active:scale-95", isLiked ? "text-red-500 fill-red-500" : "text-black dark:text-zinc-50")} />'
  );

  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated App.tsx with double tap and visible like button.");
} else {
  console.log("Could not find PostItem");
}
