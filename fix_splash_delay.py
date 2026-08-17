import re

with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    splash = f.read()

# Currently, if the video loads, `!isVideoLoaded` evaluates to false, which completely HIDES the text box immediately as soon as the video metadata is parsed.
# We need to change the condition so the text STAYS visible even after the video loads, maybe overlapping or staying on top of the video for the full duration.

# 1. Let's find the main content container condition: `{!isVideoLoaded && (`
target_1 = "{!isVideoLoaded && ("
replacement_1 = "{" + "true /* ALWAYS SHOW TEXT ON TOP OF VIDEO */" + " && ("
splash = splash.replace(target_1, replacement_1)

# 2. Add some background to the text container so it's readable if the video plays behind it.
target_2 = """<div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl w-full">"""
replacement_2 = """<div className="relative z-10 flex flex-col items-center text-center px-6 py-8 sm:px-12 sm:py-12 bg-black/40 backdrop-blur-sm rounded-3xl max-w-4xl w-full border border-white/10 shadow-2xl">"""
splash = splash.replace(target_2, replacement_2)

# Write changes back
with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(splash)

print("Done")
