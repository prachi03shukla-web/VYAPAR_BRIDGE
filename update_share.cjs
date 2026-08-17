const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Insert ShareModal before PostItem
const shareModalCode = `
function ShareModal({ isOpen, onClose, data, type }: { isOpen: boolean, onClose: () => void, data: any, type: string }) {
  if (!isOpen) return null;

  const shareText = \`Check out this \${type} by \${data.user?.name || data.authorName || 'someone'} on Tileance India!\\n\\n"\${data.content || 'Awesome content'}"\`;
  const shareUrl = \`\${window.location.origin}/\${type}/\${data.id || Date.now()}\`;

  const handleCopy = () => {
    navigator.clipboard.writeText(\`\${shareText}\\n\${shareUrl}\`);
    toast.success('Link copied to clipboard!');
    onClose();
  };

  const handleWhatsApp = () => {
    window.open(\`https://api.whatsapp.com/send?text=\${encodeURIComponent(shareText + ' ' + shareUrl)}\`, '_blank');
    onClose();
  };

  const handleFacebook = () => {
    window.open(\`https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(shareUrl)}&quote=\${encodeURIComponent(shareText)}\`, '_blank');
    onClose();
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: \`Tileance India - \${data.user?.name || data.authorName || ''}\`,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        console.error(err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="font-semibold text-lg">Share</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <button onClick={handleNativeShare} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            </div>
            <span className="font-semibold">Share via...</span>
          </button>
          
          <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </div>
            <span className="font-semibold">WhatsApp</span>
          </button>
          
          <button onClick={handleFacebook} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <span className="font-semibold">Facebook</span>
          </button>
          
          <button onClick={handleCopy} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors mt-2 border-t border-slate-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <span className="font-semibold">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
}
`;

content = content.replace('// --- Components ---', '// --- Components ---\n' + shareModalCode);

// Add state for Share Modal in PostItem
content = content.replace(
  'const [editCommentText, setEditCommentText] = useState(\'\');',
  'const [editCommentText, setEditCommentText] = useState(\'\');\n  const [isShareModalOpen, setIsShareModalOpen] = useState(false);'
);

// Add ShareModal to PostItem render
content = content.replace(
  '<button className="hover:text-slate-500 dark:hover:text-zinc-400 dark:text-zinc-400 hover:scale-110 active:scale-95 transition-all">',
  '<button onClick={() => setIsShareModalOpen(true)} className="hover:text-slate-500 dark:hover:text-zinc-400 dark:text-zinc-400 hover:scale-110 active:scale-95 transition-all">'
);

content = content.replace(
  '</form>\n        </div>\n      )}',
  '</form>\n        </div>\n      )}\n      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} data={post} type="post" />'
);

// Also add to ReelsPage
content = content.replace(
  'function ReelsPage() {',
  'function ReelsPage() {\n  const [isShareModalOpen, setIsShareModalOpen] = useState(false);'
);
content = content.replace(
  '<button className="flex flex-col items-center gap-1 text-white">\n            <svg aria-label="Share"',
  '<button onClick={() => setIsShareModalOpen(true)} className="flex flex-col items-center gap-1 text-white">\n            <svg aria-label="Share"'
);
content = content.replace(
  '</p>\n        </div>\n      </div>\n    </div>',
  '</p>\n        </div>\n        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} data={{ user: { name: "Ceramica Tiles Co." }, content: "Check out our new premium vitrified collection!", id: "reel1" }} type="reel" />\n      </div>\n    </div>'
);

fs.writeFileSync('src/App.tsx', content);
console.log('Share feature added');
