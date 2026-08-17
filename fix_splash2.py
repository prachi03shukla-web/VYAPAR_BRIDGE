import re

with open('src/components/FootballIntroSplash.tsx', 'r') as f:
    content = f.read()

fixed = """    // After textDuration, switch to video if available, else complete
    phaseTimerRef.current = setTimeout(() => {
      if (!hasVideoError) {
        setPhase('video');
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(()=>{});
        }
        // Set timer for video to finish
        const vDur = videoDuration > 0 ? videoDuration : 5000; // fallback 5s
        fadeTimerRef.current = setTimeout(() => setIsFadingOut(true), vDur - 500);
        completeTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, vDur);
      } else {
        // No video, just complete
        setIsFadingOut(true);
        completeTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, 500);
      }
    }, textDuration);"""

content = re.sub(r'// After textDuration, switch to video if available, else complete.*?}, textDuration\);', fixed, content, flags=re.DOTALL)

with open('src/components/FootballIntroSplash.tsx', 'w') as f:
    f.write(content)

