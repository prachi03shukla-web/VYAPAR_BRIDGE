#!/bin/bash
sed -i 's/className="bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 text-black dark:text-zinc-50 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"/className="bg-black border border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.6)] font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"/g' src/App.tsx
