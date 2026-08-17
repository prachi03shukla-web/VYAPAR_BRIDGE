const fs = require('fs');
let code = fs.readFileSync('database2.json', 'utf8');

code = code.replace(/TILEANCE INDIA/gi, 'VYAPAR BRIDGE');
code = code.replace(/Tileance India/gi, 'Vyapar Bridge');
code = code.replace(/Tileance/gi, 'Vyapar Bridge');
code = code.replace(/tileance/gi, 'vyaparbridge');

fs.writeFileSync('database2.json', code);
console.log('DB2 updated');
