const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace('database2.json', 'database3.json');
fs.writeFileSync('server.ts', serverCode);

let dbCode = fs.readFileSync('database2.json', 'utf8');
dbCode = dbCode.replace(/TILEANCE INDIA/g, 'VYAPAR BRIDGE');
dbCode = dbCode.replace(/Tileance India/g, 'Vyapar Bridge');
dbCode = dbCode.replace(/Tileance/g, 'Vyapar Bridge');
dbCode = dbCode.replace(/tileance/g, 'vyaparbridge');
dbCode = dbCode.replace(/TILEANCE/g, 'VYAPAR BRIDGE');
fs.writeFileSync('database3.json', dbCode);
console.log('Migrated to database3.json');
