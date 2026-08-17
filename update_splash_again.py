with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    splash = f.read()

# Make sure the tagline was updated successfully
print(splash.count("Digital India Initiative for Trade & Commerce"))
