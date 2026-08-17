import re

with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    content = f.read()

# Make it wait or not require isVideoLoaded, and add preload/autoplay
replacement = """
    // After textDuration, switch to video if available, else complete
    phaseTimerRef.current = setTimeout(() => {
      if (!hasVideoError) {
        setPhase('video');
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(()=>{});
        }
        // Set timer for video to finish
        const vDur = videoDuration > 0 ? videoDuration : 4000; // fallback 4s
        fadeTimerRef.current = setTimeout(() => setIsFadingOut(true), vDur - 500);
        completeTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, vDur);
      } else {
"""

content = content.replace("""    // After textDuration, switch to video if available, else complete
    phaseTimerRef.current = setTimeout(() => {
      if (isVideoLoaded && !hasVideoError) {""", replacement)

# Add preload and autoPlay
content = content.replace("""          muted
          playsInline
          className=""", """          muted
          playsInline
          autoPlay
          preload="auto"
          className=""")

with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(content)

print("Splash fixed")
