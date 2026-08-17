const fs = require('fs');

const updateTextColors = (file) => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace text-slate colors with text-black for better contrast on #E6C76C
    code = code.replace(/text-slate-900/g, 'text-black');
    code = code.replace(/text-slate-800/g, 'text-black');
    code = code.replace(/text-slate-700/g, 'text-black');
    // text-slate-600 and 500 might be used for subtitles, let's make them text-black/80 or text-black/70 or just text-black
    code = code.replace(/text-slate-600/g, 'text-black/80');
    code = code.replace(/text-slate-500/g, 'text-black/70');
    code = code.replace(/text-slate-400/g, 'text-black/60');
    
    // Also change hover:text-slate-* to something sensible for light theme
    code = code.replace(/hover:text-slate-500/g, 'hover:text-black/50');
    
    fs.writeFileSync(file, code);
  }
}

updateTextColors('src/App.tsx');
updateTextColors('src/components/TermsPage.tsx');
updateTextColors('src/components/TileCalculatorDrawer.tsx');

console.log('Text colors updated for light theme contrast.');
