const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/                        \{adVideoPreview.*?\{adVideoPreview.*?\{adVideoPreview.*?\{adVideoPreview && \(/s, '                        {adVideoPreview && (');
fs.writeFileSync('src/App.tsx', code);
