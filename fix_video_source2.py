import re

with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    content = f.read()

# Replace the video tag using regex to be safe about spacing
content = re.sub(
    r'<video[^>]*src="/welcome\.mp4\?v=6"[^>]*className=([^>]*)/>',
    r'''<video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        preload="auto"
        className=\1
      >
        <source src="/welcome_v6.mp4" type="video/mp4" />
      </video>''',
    content,
    flags=re.DOTALL
)

with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(content)
