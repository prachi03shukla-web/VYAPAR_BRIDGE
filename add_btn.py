import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """          </button>

          {/* Appearance (Theme Toggle) */}"""

replacement = """          </button>

          {user?.role === 'admin' && (
            <button 
              onClick={() => { onClose(); if(onOpenMasterConsole) onOpenMasterConsole(); }}
              className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group border border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10"
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-black dark:text-zinc-100 flex items-center gap-1 font-bold">
                  <span>Developer Console</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">
                  Master Admin Settings & Approvals
                </div>
              </div>
            </button>
          )}

          {/* Appearance (Theme Toggle) */}"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("target not found")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
