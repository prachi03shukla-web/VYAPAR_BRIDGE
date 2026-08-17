const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will just remove the two new divs I added and put the UI correctly.
// Let's replace the whole section to be safe.

const target = /<div className="flex flex-col gap-2 w-full">.*?<input\s+type="file"\s+accept=\{adMediaType === 'video'\s*\?\s*'video\/\*,video\/mp4,video\/webm,video\/quicktime,\.mp4,\.webm,\.mov,\.m4v,\.avi,\.mkv'\s*:\s*'image\/\*'\}/s;

const replacement = `<div className="flex flex-col gap-2 w-full">
                          <input 
                            type="url"
                            value={adExternalMediaUrl}
                            onChange={(e) => {
                               setAdExternalMediaUrl(e.target.value);
                               if(e.target.value) setAdVideoPreview(e.target.value);
                            }}
                            placeholder={adMediaType === 'video' ? "Paste External Video URL (e.g. YouTube, MP4 link) to skip upload delay" : "Paste External Image URL"}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex items-center gap-2 w-full justify-center text-xs font-bold text-slate-500">OR UPLOAD FILE</div>
                          <input 
                            type="file" 
                            accept={adMediaType === 'video' ? 'video/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v,.avi,.mkv' : 'image/*'}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
