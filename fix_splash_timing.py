import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix SYNCLOGIC to SYNLOGIC
content = content.replace("SYNCLOGIC AI TECH SOLUTION & DEVELOPERS HUB", "SYNLOGIC AI TECH SOLUTION & DEVELOPERS HUB")

with open('src/App.tsx', 'w') as f:
    f.write(content)

with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    splash = f.read()

# Set duration to 8000
splash = splash.replace("const [duration, setDuration] = useState(3500); // Default duration 3.5s", "const [duration, setDuration] = useState(8000); // Default duration 8.0s")

# Let's change the minimum video length logic so it doesn't shorten the 8 second duration.
splash = splash.replace("setDuration(Math.max(500, Math.min(15000, actualMs)));", "setDuration(Math.max(8000, Math.min(15000, actualMs)));")

# Add the SYNLOGIC text under the Digital India tagline
tagline_target = """        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-2 drop-shadow-md">
          <span className="text-base sm:text-xl">🇮🇳</span>
          <p className="text-xs sm:text-sm md:text-base font-bold tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-amber-200">
            Digital India Initiative for Tiles & Marble
          </p>
        </div>"""

tagline_replacement = """        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-2 drop-shadow-md">
          <span className="text-base sm:text-xl">🇮🇳</span>
          <p className="text-xs sm:text-sm md:text-base font-bold tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-amber-200">
            Digital India Initiative for Tiles & Marble
          </p>
        </div>
        <p className="text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-[0.25em] uppercase text-sky-200/80 mt-4 text-center">
          SYNLOGIC AI TECH SOLUTION & DEVELOPERS HUB
        </p>"""

splash = splash.replace(tagline_target, tagline_replacement)

# Oh wait, the video might hide the main content Container entirely:
# `{!isVideoLoaded && (` -> The text is hidden if video loads. 
# But wait, we want the text to always show or just the normal behavior? 
# If they uploaded a video, `!isVideoLoaded` hides the text. The user says "jo hamne video animation text lagaye hain".
# Ah, the "brand-torch-text" is what they mean by "video animation text" maybe? Since it has an animated shine?

with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(splash)

print("Done")
