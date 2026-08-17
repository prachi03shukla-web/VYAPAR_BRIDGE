const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/Tileance India/g, 'Vyapar Bridge');
code = code.replace(/Tileance/g, 'Vyapar Bridge');
code = code.replace(/#1 B2B Tiles & Sanitaryware Network \| Morbi Hub to All India Dealers/g, "India's Universal B2B Marketplace | Connect Wholesale & Retail");
code = code.replace(/India's leading B2B marketplace & social network connecting Morbi Gujarat ceramic tile factories and sanitaryware manufacturers directly with dealers, wholesalers, and showrooms across India/g, "India's leading universal B2B marketplace connecting manufacturers, dealers, and wholesalers across hardware, paint, plywood, and more.");
code = code.replace(/Morbi Tiles, Sanitaryware India, Tile Factories Gujarat, Morbi Ceramic Hub, Ceramic Tiles Manufacturer, Sanitaryware Manufacturer Morbi, B2B Tiles Directory, GVT PGVT Tiles, Wall Tiles, Floor Tiles, Sanitary Ware Dealers India, Ceramic Manufacturers Morbi/g, "India B2B, Wholesale India, Hardware Network, Traders Hub, Vyapar Bridge App, Indian Wholesale Market");
code = code.replace(/India's #1 B2B Tiles & Sanitaryware Platform/g, "India's Universal B2B Platform");
code = code.replace(/B2B Tiles & Sanitaryware Hub/g, "Universal B2B Hub");

fs.writeFileSync('index.html', code);
console.log('index.html updated');
