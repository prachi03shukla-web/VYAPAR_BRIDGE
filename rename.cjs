const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace main brand name texts in UI
code = code.replace(/>TILEANCE INDIA</g, '>VYAPAR BRIDGE<');
code = code.replace(/> *TILEANCE INDIA *</g, '>VYAPAR BRIDGE<');
code = code.replace(/>\s*TILEANCE INDIA\s*</g, '>VYAPAR BRIDGE<');
code = code.replace(/alt="TILEANCE INDIA"/g, 'alt="VYAPAR BRIDGE"');
code = code.replace(/alt="TILEANCE INDIA Logo"/g, 'alt="VYAPAR BRIDGE Logo"');
code = code.replace(/alt="Tileance"/g, 'alt="Vyapar Bridge"');
code = code.replace(/alt="Tileance India Logo"/g, 'alt="Vyapar Bridge Logo"');

// Specifically replacing the exact strings in the header and sidebar
code = code.replace(/TILEANCE INDIA/g, 'VYAPAR BRIDGE');
code = code.replace(/Tileance India/g, 'Vyapar Bridge');
code = code.replace(/Tileance/g, 'Vyapar Bridge');
code = code.replace(/tileanceindiaicon/g, 'vyaparbridgeicon'); // In case we rename the image later, but let's keep original file path for now to not break image
code = code.replace(/vyaparbridgeicon \(2\)\.png/g, 'tileanceindiaicon (2).png');
code = code.replace(/vyaparbridgeicon\.png/g, 'tileanceindiaicon.png');

// Taglines
code = code.replace(/India's Building & Interior Business Hub/g, "India's Universal B2B Marketplace");

// Other specific texts
code = code.replace(/Tiles, Vitrified Slabs, Marble, GVT\/PGVT & Sanitaryware/g, 'Hardware, Paint, Plywood, Electronics, & Generic B2B');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
