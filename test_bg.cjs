const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Count occurrences
console.log("bg-white dark:bg-black:", (code.match(/bg-white dark:bg-black/g) || []).length);
console.log("bg-white dark:bg-zinc-950:", (code.match(/bg-white dark:bg-zinc-950/g) || []).length);
console.log("bg-white dark:bg-zinc-900:", (code.match(/bg-white dark:bg-zinc-900/g) || []).length);
console.log("bg-white/80 dark:bg-black/80:", (code.match(/bg-white\/80 dark:bg-black\/80/g) || []).length);
console.log("bg-white/50 dark:bg-black/50:", (code.match(/bg-white\/50 dark:bg-black\/50/g) || []).length);
console.log("bg-white dark:bg-transparent:", (code.match(/bg-white dark:bg-transparent/g) || []).length);
