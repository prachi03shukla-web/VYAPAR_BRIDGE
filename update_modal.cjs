const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "function FullScreenFeedViewerModal({";
const endMarker = "function EditPostModal({";

const startIndex = code.indexOf(startMarker, 1000);
const endIndex = code.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers", startIndex, endIndex);
  process.exit(1);
}

const newModal = `function FullScreenFeedViewerModal({
  posts,
  initialIndex = 0,
  currentUser,
  onClose,
  userLocation
}: {
  posts: any[];
  initialIndex?: number;
  currentUser?: any;
  onClose: () => void;
  userLocation?: {lat: number, lng: number} | null;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    // Scroll to the initial index on mount
    if (containerRef.current) {
      const scrollHeight = containerRef.current.clientHeight;
      containerRef.current.scrollTop = scrollHeight * initialIndex;
    }
  }, [initialIndex]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      const scrollHeight = containerRef.current.clientHeight;
      const currentScroll = containerRef.current.scrollTop;
      const index = Math.round(currentScroll / scrollHeight);

      if (e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (index < posts.length - 1) containerRef.current.scrollTo({ top: (index + 1) * scrollHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (index > 0) containerRef.current.scrollTo({ top: (index - 1) * scrollHeight, behavior: 'smooth' });
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posts.length, onClose]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollHeight = e.currentTarget.clientHeight;
    const currentScroll = e.currentTarget.scrollTop;
    const index = Math.round(currentScroll / scrollHeight);
    
    if (index !== activeIndex && index >= 0 && index < posts.length) {
      setActiveIndex(index);
    }
  };

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Top Header Overlay */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-8 z-40 flex items-center justify-between text-white pointer-events-none">
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 pointer-events-auto shadow-2xl">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wider">
            {activeIndex + 1} / {posts.length}
          </span>
          <span className="text-[10px] text-zinc-300 font-medium ml-1 hidden sm:inline">
            • Scroll up or down to navigate
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-2.5 bg-black/70 hover:bg-black/90 rounded-full text-white backdrop-blur-md border border-white/20 transition-all pointer-events-auto cursor-pointer hover:scale-110 active:scale-95 shadow-2xl"
          title="Close Full Screen"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-[100dvh] overflow-y-auto snap-y snap-mandatory scrollbar-hide relative flex flex-col"
      >
        {posts.map((post, i) => (
           <div key={post.id || i} className="w-full h-[100dvh] shrink-0 snap-center snap-always flex items-center justify-center relative bg-black/95 pointer-events-auto" onClick={onClose}>
              <div onClick={e => e.stopPropagation()} className="relative w-full max-w-[420px] h-[100dvh] sm:h-[90vh] flex items-center justify-center">
                 {/* Optimization: Render adjacent items to save memory, otherwise rely on active state for playback */}
                 {Math.abs(activeIndex - i) <= 2 ? (
                   <ReelCard 
                     reel={post} 
                     currentUser={currentUser} 
                     onClose={onClose} 
                     userLocation={userLocation}
                     isActive={activeIndex === i}
                   />
                 ) : null}
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}

`;

code = code.substring(0, startIndex) + newModal + code.substring(endIndex);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx successfully");
