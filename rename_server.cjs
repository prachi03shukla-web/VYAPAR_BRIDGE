const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// App name changes
code = code.replace(/Tileance India/g, 'Vyapar Bridge');
code = code.replace(/Tileance/g, 'Vyapar Bridge');
code = code.replace(/tileanceb2b@upi/g, 'vyaparbridge@upi');
code = code.replace(/admin@tileance\.com/g, 'admin@vyaparbridge.com');
code = code.replace(/#tileance/g, '#vyaparbridge');
code = code.replace(/#Tileance/g, '#VyaparBridge');

// Specific text changes based on search
code = code.replace(/Tiles, Vitrified Slabs, Marble, GVT\/PGVT & Sanitaryware/g, 'Hardware, Paint, Plywood, Electronics, & Generic B2B');
code = code.replace(/Morbi's Tile & Sanitaryware Industry/g, 'Indian B2B Wholesale Industry');
code = code.replace(/Ceramic Tiles, Marble, Sanitaryware/g, 'Hardware, Paint, Plywood, Electronics');

// Prompt replacements
code = code.replace(/#tileance #morbitiles #ceramicexports #sanitaryware #floortiles #architecturaldesign #interiordesign #constructionindia/g, '#vyaparbridge #b2bindia #wholesalemarket #hardware #electronics #business #tradesindia #bulkorders');
code = code.replace(/#tileance #tiles #ceramic #morbi/g, '#vyaparbridge #b2b #wholesale #business');
code = code.replace(/#tileance #tiles #sanitaryware #morbi #ceramic/g, '#vyaparbridge #b2b #trade #business #india');
code = code.replace(/Local Customer looking for tiles and sanitaryware/g, 'Local Customer looking for wholesale products and business deals');

fs.writeFileSync('server.ts', code);
console.log('server.ts updated');
