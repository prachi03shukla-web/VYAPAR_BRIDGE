with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    splash = f.read()

splash = splash.replace("Digital India Initiative for Tiles & Marble", "Digital India Initiative for Trade & Commerce")

with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(splash)

with open('src/App.tsx', 'r') as f:
    app = f.read()

app = app.replace("like Ceramic Tiles, Marble, Sanitaryware, and Architectural products.", "like products, professional services, machinery, and trade materials.")
app = app.replace("B2B & B2C Tile & Sanitaryware Network", "B2B & B2C Trade & Commerce Network")

with open('src/App.tsx', 'w') as f:
    f.write(app)

print("Done")
