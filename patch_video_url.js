const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/const \[adVideoUrl, setAdVideoUrl\] = useState\(''\);\n/, '');
code = code.replace(/formData\.append\('mediaUrl', adVideoUrl\);\n/, '');
code = code.replace(/mediaUrl: adVideoUrl \|\| '',/g, "mediaUrl: '',");
code = code.replace(/<span className="text-xs text-slate-500 font-bold">OR<\/span>\s*<input[^>]*value=\{adVideoUrl\}[^>]*\/>/s, '');
code = code.replace(/\(adVideoPreview \|\| adVideoUrl\)/g, 'adVideoPreview');
fs.writeFileSync('src/App.tsx', code);
