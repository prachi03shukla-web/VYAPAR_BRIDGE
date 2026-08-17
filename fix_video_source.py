import re

with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    content = f.read()

# Replace the video tag with one using <source>
old_video = """      <video
        ref={videoRef}
        src="/welcome.mp4?v=6"
        muted
        playsInline
        autoPlay
        preload="auto"
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
          phase === 'video' ? 'opacity-100' : 'opacity-0'
        } pointer-events-none`}
      />"""

new_video = """      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        preload="auto"
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
          phase === 'video' ? 'opacity-100' : 'opacity-0'
        } pointer-events-none`}
      >
        <source src="/welcome_v6.mp4" type="video/mp4" />
      </video>"""

content = content.replace(old_video, new_video)

with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(content)
