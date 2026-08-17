import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Replace the left img with a shield check button
left_pattern = re.compile(r'<img[^>]+src="/tileanceindia_fixed\.png"[^>]+alt="VYAPAR BRIDGE"[^>]+onClick=\{\(\) => setIsLogoLightboxOpen\(true\)\}[^>]+/>')
left_replacement = """<button onClick={() => setIsLogoMenuOpen(!isLogoMenuOpen)} className="p-2 text-black/70 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><ShieldCheck className="w-6 h-6" /></button>"""

if '<img' in content and 'isLogoMenuOpen' in content:
    content = left_pattern.sub(left_replacement, content, count=1)


# 2. Update the centered title in Mobile Header to include the image
center_pattern = re.compile(r'<div className="flex items-center justify-center gap-1\.5 w-full">\s*<div\s*className="text-\[17px\][^>]+>VYAPAR BRIDGE</div>\s*</div>')
center_replacement = """<div className="flex items-center justify-center gap-2 w-full">
            <img 
              onClick={(e) => { e.stopPropagation(); setIsLogoLightboxOpen(true); }}
              src="/icon.png" 
              alt="Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 shadow-sm border border-slate-200 dark:border-zinc-800 group-hover:scale-110 transition-transform duration-300"
              onError={(e) => { if (e.currentTarget.src.includes('icon.png')) { e.currentTarget.src = '/tileanceindia_fixed.png'; } else { e.currentTarget.style.display = 'none'; } }}
            />
            <div 
              className="text-[17px] min-[370px]:text-[19px] sm:text-xl md:text-2xl font-black uppercase tracking-wider sm:tracking-[0.12em] not-italic text-center brand-torch-text group-hover:scale-105 transition-all duration-300 active:scale-95 select-none shrink"
              style={{ fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif", fontWeight: 900 }}
            >VYAPAR BRIDGE</div>
          </div>"""

if center_pattern.search(content):
    content = center_pattern.sub(center_replacement, content, count=1)


# 3. Also fix desktop header
desktop_pattern = re.compile(r'<img\s*onClick=\{\(\) => setIsLogoLightboxOpen\(true\)\}\s*src="/tileanceindia_fixed\.png"\s*alt="VYAPAR BRIDGE"')
desktop_replacement = """<img
                  onClick={(e) => { e.stopPropagation(); setIsLogoLightboxOpen(true); }}
                 src="/icon.png"
                  alt="Logo"
                  onError={(e) => { if (e.currentTarget.src.includes('icon.png')) { e.currentTarget.src = '/tileanceindia_fixed.png'; } else { e.currentTarget.style.display = 'none'; } }}"""

if desktop_pattern.search(content):
    content = desktop_pattern.sub(desktop_replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
