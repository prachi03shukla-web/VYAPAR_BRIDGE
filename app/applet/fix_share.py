with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("import { ShareModal } from './components/ShareModal';", "")

share_jsx = '''      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto" 
          onClick={(e) => { e.stopPropagation(); setShowShareModal(false); }}
        >
          <div 
            className="bg-zinc-950 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-800 flex flex-col gap-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" /> Share via VYAPAR BRIDGE
              </h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-2">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=` + encodeURIComponent((reel?.title ? reel.title + '\\n' : '') + (reel?.content ? reel.content + '\\n\\n' : '') + 'Check out this post on Vyapar Bridge B2B Network!\\n' + window.location.href)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { setSharesCount(prev => prev + 1); setShowShareModal(false); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-900 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-zinc-800 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-300">WhatsApp</span>
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=` + encodeURIComponent(window.location.href)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { setSharesCount(prev => prev + 1); setShowShareModal(false); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-900 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-800 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-300">Facebook</span>
              </a>

              {/* Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=` + encodeURIComponent('VYAPAR BRIDGE - Check out this post') + `&url=` + encodeURIComponent(window.location.href)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { setSharesCount(prev => prev + 1); setShowShareModal(false); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-900 hover:bg-sky-600/20 hover:border-sky-500/50 border border-zinc-800 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-300">Twitter</span>
              </a>

              {/* Copy Link */}
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText((reel?.title || 'VYAPAR BRIDGE Post') + '\\n' + window.location.href);
                    toast.success('Link copied to clipboard!');
                    setSharesCount(prev => prev + 1);
                    setShowShareModal(false);
                  } catch (e) {
                    toast.error('Could not copy link');
                  }
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-900 hover:bg-purple-600/20 hover:border-purple-500/50 border border-zinc-800 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Copy className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-300">Copy Link</span>
              </button>
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-colors cursor-pointer mt-2 border border-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}'''

target = "{/* Stats Modal */}"
if target in content and "Share via VYAPAR BRIDGE" not in content:
    content = content.replace(target, share_jsx + "\n\n      " + target, 1)
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Successfully added inline Share Modal")
else:
    print("Target not found or already added")
