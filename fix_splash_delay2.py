import re

with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    splash = f.read()

# Make sure it waits exactly 8 seconds EVEN if the video finishes earlier
# Before: setDuration(Math.max(8000, Math.min(15000, actualMs)));
# Let's just force the duration to always be 8000 no matter what the video says:
splash = splash.replace("setDuration(Math.max(8000, Math.min(15000, actualMs)));", "// setDuration(actualMs) - IGNORING VIDEO LENGTH, FORCING 8 SECONDS\n                setDuration(8000);")

with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(splash)
