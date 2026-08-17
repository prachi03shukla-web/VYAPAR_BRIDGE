import fs from 'fs';
let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('touch-action: manipulation;')) {
    css += `\n\n/* Mobile tap delay fix */\n* {\n  touch-action: manipulation;\n}\n`;
    fs.writeFileSync('src/index.css', css);
    console.log("Added touch-action: manipulation to CSS");
}
