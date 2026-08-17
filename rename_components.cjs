const fs = require('fs');

const replaceInFile = (file, replacements) => {
  let code = fs.readFileSync(file, 'utf8');
  let originalCode = code;
  replacements.forEach(([search, replace]) => {
    code = code.split(search).join(replace); // Simple string replace all
  });
  if (code !== originalCode) {
    fs.writeFileSync(file, code);
    console.log(file + ' updated');
  }
};

replaceInFile('src/components/TermsPage.tsx', [
  ['Tileance India', 'Vyapar Bridge'],
  ['Tileance', 'Vyapar Bridge'],
  ['Ceramic Tiles, Marble, Sanitaryware, and Architectural products', 'Hardware, Paint, Plywood, Electronics, & Generic B2B']
]);

replaceInFile('src/components/AIChatbotWidget.tsx', [
  ['Tileance India', 'Vyapar Bridge']
]);

replaceInFile('src/components/PlatformRatingWidget.tsx', [
  ['Tileance India', 'Vyapar Bridge'],
  ['Tileance Member', 'Vyapar Member']
]);

replaceInFile('src/components/StealthLockoutScreen.tsx', [
  ['Tileance core server', 'Vyapar Bridge core server'],
  ['Tileance B2B Platform', 'Vyapar Bridge B2B Platform']
]);

