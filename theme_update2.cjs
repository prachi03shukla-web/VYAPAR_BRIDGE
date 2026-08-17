const fs = require('fs');

const updateFile = (file) => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/bg-white dark:bg-black/g, 'bg-[#E6C76C] dark:bg-black');
    code = code.replace(/bg-white\/80 dark:bg-black\/80/g, 'bg-[#E6C76C]/80 dark:bg-black/80');
    fs.writeFileSync(file, code);
    console.log(file + ' theme updated');
  }
}

updateFile('src/components/TileCalculatorDrawer.tsx');
