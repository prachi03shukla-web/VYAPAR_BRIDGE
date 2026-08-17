with open('src/App.tsx', 'r') as f:
    app = f.read()

target = r"    if (finalSrc && (finalSrc.includes('youtube.com') || finalSrc.includes('youtu.be'))) {"

replacement = r"""    if (finalSrc && (finalSrc.includes('youtube.com') || finalSrc.includes('youtu.be'))) {
     const ytIdMatch = finalSrc.match(/(?:youtu\.be\/|v=|\/v\/|embed\/|watch\?v=|shorts\/)([^#\&\?]*).*/);
     const ytId = ytIdMatch && ytIdMatch[1];
     if (ytId) {
        return <iframe className={`w-full h-full aspect-video min-h-[300px] sm:min-h-[400px] object-cover ${className || ''}`} src={`https://www.youtube.com/embed/${ytId}?autoplay=0&mute=0&rel=0&controls=0&modestbranding=1&showinfo=0&iv_load_policy=3`} allow="encrypted-media" frameBorder="0" allowFullScreen></iframe>;
     }
  }

  if (finalSrc && (finalSrc.includes('facebook.com') || finalSrc.includes('fb.watch'))) {
      return <iframe className={`w-full h-full aspect-video min-h-[300px] sm:min-h-[400px] object-cover ${className || ''}`} src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(finalSrc)}&show_text=false&autoplay=false`} allow="encrypted-media" frameBorder="0" allowFullScreen></iframe>;
  }
"""

import re
# We need to replace the original youtube block. Let's extract it first.
original_yt_block = """    if (finalSrc && (finalSrc.includes('youtube.com') || finalSrc.includes('youtu.be'))) {
     const ytIdMatch = finalSrc.match(/(?:youtu\.be\/|v=|\/v\/|embed\/|watch\?v=|shorts\/)([^#\&\?]*).*/);
     const ytId = ytIdMatch && ytIdMatch[1];
     if (ytId) {
        return <iframe className={`w-full h-full aspect-video min-h-[300px] sm:min-h-[400px] object-cover ${className || ''}`} src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}`} allow="autoplay; encrypted-media" frameBorder="0" allowFullScreen></iframe>;
     }
  }"""

app = app.replace(original_yt_block, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(app)

print("Done")
