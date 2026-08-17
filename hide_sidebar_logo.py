import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """          <Link to="/" className="mb-8 px-1 lg:px-2 mt-2 block w-full overflow-hidden sidebar-nav-item outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
             {/* Branding Image with Text Fallback */}
             <div className="flex flex-col items-center lg:items-start justify-center gap-1 w-full group">
               <div className="lg:hidden flex items-center justify-center w-full">
                 <img src="/tileanceindiaicon.png" alt="Vyapar Bridge" className="w-14 h-14 min-w-[56px] min-h-[56px] aspect-square shrink-0 object-cover rounded-full shadow-sm" />
               </div>
               <div className="hidden lg:flex items-center gap-2">
                 <img 
                   src="/tileanceindiaicon (2).png" 
                   alt="VYAPAR BRIDGE Logo" 
                   className="h-8 xl:h-10 w-auto object-contain shrink-0 group-hover:scale-110 transition-transform duration-300"
                   onError={(e) => (e.currentTarget.style.display = 'none')}
                 />
                 <div className="flex flex-col">
                   <div 
                     className="text-base xl:text-lg font-black uppercase tracking-[0.06em] xl:tracking-[0.08em] whitespace-nowrap brand-torch-text group-hover:scale-105 origin-left transition-transform duration-300 select-none truncate max-w-full"
                     style={{ fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif", fontWeight: 900 }}
                   >VYAPAR BRIDGE</div>
                   <div className="text-[8px] xl:text-[9px] font-bold text-black/70 dark:text-zinc-400 uppercase tracking-widest leading-none mt-1 whitespace-nowrap group-hover:text-blue-500 transition-colors">
                     Connecting Commerce & Opportunity
                   </div>
                 </div>
               </div>
             </div>
          </Link>"""

if target in content:
    content = content.replace(target, '')
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Done")
else:
    print("Target not found")
