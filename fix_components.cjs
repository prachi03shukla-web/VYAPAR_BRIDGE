const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix missing icons in imports:
const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];/;
const match = code.match(lucideImportRegex);
if (match) {
    let imports = match[1];
    const needed = ['BadgeCheck', 'Music', 'BarChart3', 'Flag', 'ChevronUp', 'ChevronDown', 'ChevronRight', 'ChevronLeft'];
    for (let icon of needed) {
        if (!imports.includes(icon)) {
            imports += `, ${icon}`;
        }
    }
    code = code.replace(lucideImportRegex, `import {${imports}} from "lucide-react";`);
}

// 2. Fix handleToggleLike and handleToggleSave
code = code.replace(/onClick=\{handleToggleLike\}/g, "onClick={handleLike}");
code = code.replace(/onClick=\{handleToggleSave\}/g, "onClick={handleSave}");

// 3. Fix PostStatsModal to use SinglePostStatsModal
code = code.replace(/<PostStatsModal/g, "<SinglePostStatsModal");
if (!code.includes("import { SinglePostStatsModal }")) {
    code = `import { SinglePostStatsModal } from './components/SinglePostStatsModal';\n` + code;
}

// 4. We need to define FullScreenFeedViewerModal and Feed
const componentsToAdd = `
export function FullScreenFeedViewerModal({ posts, initialIndex = 0, currentUser, onClose, userLocation }: any) {
  const [currentIndex, React_setCurrentIndex] = React.useState(initialIndex);
  
  const handlePrevious = () => {
    if (currentIndex > 0) React_setCurrentIndex(currentIndex - 1);
  };
  
  const handleNext = () => {
    if (currentIndex < posts.length - 1) React_setCurrentIndex(currentIndex + 1);
  };
  
  const post = posts[currentIndex];
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 z-50">
        <button onClick={onClose} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer">
           <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="absolute inset-y-0 left-0 w-12 sm:w-20 flex items-center justify-center z-50 pointer-events-none">
        {currentIndex > 0 && (
          <button onClick={handlePrevious} className="p-2 sm:p-4 text-white/50 hover:text-white hover:bg-black/30 rounded-full transition-all pointer-events-auto">
            <ChevronLeft className="w-8 h-8 sm:w-12 sm:h-12" />
          </button>
        )}
      </div>
      
      <div className="absolute inset-y-0 right-0 w-12 sm:w-20 flex items-center justify-center z-50 pointer-events-none">
        {currentIndex < posts.length - 1 && (
           <button onClick={handleNext} className="p-2 sm:p-4 text-white/50 hover:text-white hover:bg-black/30 rounded-full transition-all pointer-events-auto">
             <ChevronRight className="w-8 h-8 sm:w-12 sm:h-12" />
           </button>
        )}
      </div>

      <div className="w-full h-full max-w-md mx-auto relative flex items-center justify-center snap-y snap-mandatory overflow-hidden">
         <div className="w-full h-full snap-start flex items-center justify-center">
            <ReelCard reel={post} currentUser={currentUser} onClose={onClose} userLocation={userLocation} />
         </div>
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md">
        <span className="text-white text-xs font-bold tracking-widest uppercase">{currentIndex + 1} / {posts.length}</span>
      </div>
    </div>
  );
}

export function Feed({ user, onUpdateUser, userLocation }: any) {
  const [posts, React_setPosts] = React.useState<any[]>([]);

  React.useEffect(() => {
    safeFetch(\`/api/posts\`).then((data: any) => {
       if (Array.isArray(data)) React_setPosts(data);
    }).catch(e => console.error(e));
  }, []);

  return (
    <div className="max-w-md mx-auto pb-24 pt-2 md:pt-6 flex flex-col gap-8 min-h-screen">
       {posts.length > 0 ? posts.map(post => (
         <div key={post.id} className="w-full flex items-center justify-center">
            <ReelCard reel={post} currentUser={user} userLocation={userLocation} />
         </div>
       )) : (
         <div className="text-center py-20 text-zinc-500">
           <p className="font-semibold text-lg">Loading Feed...</p>
         </div>
       )}
    </div>
  );
}
`;

// Insert the components right before function AppContent()
code = code.replace("function AppContent()", componentsToAdd + "\n\nfunction AppContent()");

fs.writeFileSync('src/App.tsx', code);
console.log("Components added and errors fixed.");

