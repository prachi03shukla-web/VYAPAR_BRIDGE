import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

state_target = "const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);"
state_replacement = "const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);\n  const [isLogoLightboxOpen, setIsLogoLightboxOpen] = useState(false);"

content = content.replace(state_target, state_replacement)

# Mobile header logo
mobile_target = """        <div className="flex items-center z-10 cursor-pointer relative" onClick={() => setIsLogoMenuOpen(!isLogoMenuOpen)}>
          <img 
            src="/tileanceindia_fixed.png" 
            alt="VYAPAR BRIDGE" 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 transition-transform duration-300 shadow-sm border border-slate-200 dark:border-zinc-800 hover:scale-105"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />"""
mobile_replacement = """        <div className="flex items-center z-10 relative">
          <img 
            onClick={() => setIsLogoLightboxOpen(true)}
            src="/tileanceindia_fixed.png" 
            alt="VYAPAR BRIDGE" 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 transition-transform duration-300 shadow-sm border border-slate-200 dark:border-zinc-800 hover:scale-105 cursor-pointer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />"""
content = content.replace(mobile_target, mobile_replacement)

# Desktop Header Logo
desktop_target = """            <div className="flex-1 flex items-center justify-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
              <img 
                 src="/tileanceindia_fixed.png" 
                 alt="VYAPAR BRIDGE" 
                 className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md border border-slate-200 dark:border-zinc-800"
                 onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div className="flex flex-col items-center">
                <div 
                  className="text-xl lg:text-2xl font-black uppercase tracking-[0.14em] brand-torch-text select-none group-hover:scale-105 transition-transform duration-300"
                  style={{ fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif", fontWeight: 900 }}
                >VYAPAR BRIDGE</div>"""
desktop_replacement = """            <div className="flex-1 flex items-center justify-center gap-2 group">
              <img 
                 onClick={() => setIsLogoLightboxOpen(true)}
                 src="/tileanceindia_fixed.png" 
                 alt="VYAPAR BRIDGE" 
                 className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md border border-slate-200 dark:border-zinc-800 cursor-pointer"
                 onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('/')}>
                <div 
                  className="text-xl lg:text-2xl font-black uppercase tracking-[0.14em] brand-torch-text select-none group-hover:scale-105 transition-transform duration-300"
                  style={{ fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif", fontWeight: 900 }}
                >VYAPAR BRIDGE</div>"""
content = content.replace(desktop_target, desktop_replacement)

lightbox_code = """
      {/* Logo Lightbox Modal */}
      {isLogoLightboxOpen && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsLogoLightboxOpen(false)}>
          <button 
            onClick={() => setIsLogoLightboxOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <img 
              src="/tileanceindia_fixed.png" 
              alt="Tileance India Logo" 
              className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full object-cover shadow-[0_0_50px_rgba(230,199,108,0.3)] border-4 border-[#E6C76C]"
            />
          </div>
        </div>
      )}
"""

end_target = "{activeSavedPostIndex !== null && ("
end_replacement = lightbox_code + "\n      {activeSavedPostIndex !== null && ("
content = content.replace(end_target, end_replacement, 1)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
