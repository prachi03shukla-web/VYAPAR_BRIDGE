#!/bin/bash
sed -i '1657c\
      <AnimatePresence>\
        {showOptionsModal && (\
          <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center p-4 pointer-events-auto">\
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOptionsModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />\
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-zinc-900 w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-2 relative z-10 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col gap-1">\
' src/App.tsx
