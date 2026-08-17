const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/bg-white dark:bg-black/g, 'bg-[#E6C76C] dark:bg-black');
code = code.replace(/bg-white\/80 dark:bg-black\/80/g, 'bg-[#E6C76C]/80 dark:bg-black/80');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx theme updated');
