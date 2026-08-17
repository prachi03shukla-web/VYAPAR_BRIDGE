const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacementRegex = /\{pendingReelFile\?\.type\.startsWith\('image\/'\) \? \([\s\S]*?<img src=\{reelPreviewUrl\} alt="Reel Preview" className="w-full h-full object-contain" \/>[\s\S]*?\) : \([\s\S]*?<video preload="auto"[\s\S]*?ref=\{\(el\) => \{[\s\S]*?if \(el\) \{[\s\S]*?el\.volume = selectedMusic \? reelOriginalVolume : 1;[\s\S]*?if \(el\.paused\) \{ const p = el\.play\(\); if \(p !== undefined\) p\.catch\(\(\)=>\{\}\); \}[\s\S]*?\}[\s\S]*?\}\}[\s\S]*?\/>[\s\S]*?\)\}/g;

const original = `<video preload="auto" 
                      src={reelPreviewUrl} 
                      className="w-full h-full object-contain transform-gpu will-change-transform" 
                      loop 
                      muted={selectedMusic && reelOriginalVolume === 0} 
                      playsInline
                      ref={(el) => { 
                        if (el) {
                          el.volume = selectedMusic ? reelOriginalVolume : 1;
                          if (el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); }
                        }
                      }}
                    />`;

code = code.replace(replacementRegex, original);

fs.writeFileSync('src/App.tsx', code);
console.log("Reverted the broken Reel Preview Modal");
