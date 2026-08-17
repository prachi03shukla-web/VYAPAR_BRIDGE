const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find the image element inside the PostItem mediaUrl block
const targetImg = `<img 
              src={post.mediaUrl} 
              alt="Post media" 
              className="w-full h-full max-h-[80vh] object-contain bg-black" 
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?auto=format&fit=crop&w=800&q=80';
              }}
            />`;

const replaceImg = `<img 
              src={post.mediaUrl} 
              alt="Post media" 
              className="w-full h-full max-h-[80vh] object-contain bg-black cursor-pointer" 
              onClick={onPostClick}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?auto=format&fit=crop&w=800&q=80';
              }}
            />`;

code = code.replace(targetImg, replaceImg);

const targetVideo = `<video preload="auto" src={post.mediaUrl} poster={post.thumbnailUrl} controls playsInline muted loop className="w-full h-full max-h-[80vh] object-contain bg-black transform-gpu will-change-transform" ref={(el) => { if (el && el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); } }} />`;

const replaceVideo = `<video preload="auto" src={post.mediaUrl} poster={post.thumbnailUrl} playsInline muted loop className="w-full h-full max-h-[80vh] object-contain bg-black transform-gpu will-change-transform cursor-pointer" onClick={onPostClick} ref={(el) => { if (el && el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); } }} />`;

code = code.replace(targetVideo, replaceVideo);

fs.writeFileSync('src/App.tsx', code);
console.log("Replaced image and video onClick handlers");
