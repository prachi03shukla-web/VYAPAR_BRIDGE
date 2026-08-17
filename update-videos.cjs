const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/<video /g, '<video preload="auto" ');
fs.writeFileSync('src/App.tsx', code);
