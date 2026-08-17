import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace 1: Auth screen (Line 7565)
auth_target = """          <p className="text-xs sm:text-[13px] text-amber-300 font-medium leading-relaxed max-w-xs mx-auto text-balance mt-2 drop-shadow-sm">
            Connecting Commerce & Opportunity
          </p>"""
auth_replacement = """          <p className="text-xs sm:text-[13px] text-amber-300 font-medium leading-relaxed max-w-xs mx-auto text-balance mt-2 drop-shadow-sm">
            Connecting Commerce & Opportunity
          </p>
          <p className="text-[9px] sm:text-[10px] text-amber-200/80 font-bold tracking-[0.15em] mt-1 uppercase text-center w-full">
            SYNCLOGIC AI TECH SOLUTION & DEVELOPERS HUB
          </p>"""
content = content.replace(auth_target, auth_replacement)

# Replace 2: Mobile Header (Line 12092)
mob_target = """          <div className="text-[7.5px] min-[370px]:text-[8.5px] sm:text-[9px] font-bold text-black/70 dark:text-zinc-400 uppercase tracking-[0.1em] leading-none mt-1 text-center whitespace-nowrap w-full group-hover:text-blue-500 transition-colors">
            Connecting Commerce & Opportunity
          </div>"""
mob_replacement = """          <div className="text-[7.5px] min-[370px]:text-[8.5px] sm:text-[9px] font-bold text-black/70 dark:text-zinc-400 uppercase tracking-[0.1em] leading-none mt-1 text-center whitespace-nowrap w-full group-hover:text-blue-500 transition-colors">
            Connecting Commerce & Opportunity
          </div>
          <div className="text-[6px] min-[370px]:text-[6.5px] sm:text-[7px] font-black text-black/50 dark:text-zinc-500 uppercase tracking-[0.15em] leading-none mt-1 text-center whitespace-nowrap w-full">
            SYNCLOGIC AI TECH SOLUTION & DEVELOPERS HUB
          </div>"""
content = content.replace(mob_target, mob_replacement)

# Replace 3: Desktop Header (Line 12230)
desk_target = """                <div className="text-[9px] lg:text-[10px] font-bold text-black/70 dark:text-zinc-400 uppercase tracking-widest mt-0.5 group-hover:text-blue-500 transition-colors">
                  Connecting Commerce & Opportunity
                </div>"""
desk_replacement = """                <div className="text-[9px] lg:text-[10px] font-bold text-black/70 dark:text-zinc-400 uppercase tracking-widest mt-0.5 group-hover:text-blue-500 transition-colors">
                  Connecting Commerce & Opportunity
                </div>
                <div className="text-[7px] lg:text-[8px] font-black text-black/50 dark:text-zinc-500 uppercase tracking-[0.15em] mt-0.5">
                  SYNCLOGIC AI TECH SOLUTION & DEVELOPERS HUB
                </div>"""
content = content.replace(desk_target, desk_replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
