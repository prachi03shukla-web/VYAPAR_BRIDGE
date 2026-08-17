const fs = require('fs');
let code = fs.readFileSync('database.json', 'utf8');

code = code.replace(/TILEANCE INDIA/g, 'VYAPAR BRIDGE');
code = code.replace(/Tileance India/gi, 'Vyapar Bridge');
code = code.replace(/Tileance/gi, 'Vyapar Bridge');
code = code.replace(/tileance/gi, 'vyaparbridge');

fs.writeFileSync('database.json', code);
console.log('DB updated');
