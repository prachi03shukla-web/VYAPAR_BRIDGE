import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove the misplaced lightbox code
bad_lightbox = """      {/* Logo Lightbox Modal */}
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
content = content.replace(bad_lightbox, "")

# 2. Insert it before the end of AppContent
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

end_appcontent_target = """      </nav>
    </div>
  );
}"""

end_appcontent_replacement = """      </nav>
""" + lightbox_code + """
    </div>
  );
}"""

content = content.replace(end_appcontent_target, end_appcontent_replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
