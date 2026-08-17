const fs = require('fs');
const glob = require('glob');

const replaceInFile = (file) => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  let originalCode = code;

  // Global app name changes
  code = code.replace(/TILEANCE INDIA/g, 'VYAPAR BRIDGE');
  code = code.replace(/Tileance India/gi, 'Vyapar Bridge');
  code = code.replace(/Tileance/gi, 'Vyapar Bridge');
  
  // Tagline fixes
  code = code.replace(/India's Universal B2B Marketplace/gi, 'Universal B2B Marketplace');
  code = code.replace(/India's Universal B2B Platform/gi, 'Universal B2B Platform');
  code = code.replace(/India's leading/gi, 'Leading');
  code = code.replace(/India's #1/gi, '#1');

  // Any leftover taglines to connect commerce
  code = code.replace(/Universal B2B Marketplace/gi, 'Connecting Commerce & Opportunity');

  if (code !== originalCode) {
    fs.writeFileSync(file, code);
    console.log(file + ' updated');
  }
};

const filesToProcess = [
  'src/utils/lockoutManager.ts',
  'src/utils/gstinValidator.ts',
  'src/components/FootballIntroSplash.tsx',
  'src/App.tsx',
  'database.json',
  'public/manifest.json',
  'public/sw.js',
  'server.ts',
  'index.html'
];

filesToProcess.forEach(replaceInFile);

// For firebase applet config, DO NOT change the firestore ID, just name/description if present
