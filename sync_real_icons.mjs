import fs from 'fs';

const b64Data = fs.readFileSync('src/constants/logoBase64.ts', 'utf8');
const match = b64Data.match(/base64,([^\']+)/);
if (match) {
  const buf = Buffer.from(match[1], 'base64');
  fs.writeFileSync('public/icon.png', buf);
  fs.writeFileSync('public/ico.png', buf);
  fs.writeFileSync('public/favicon.ico', buf);
  fs.writeFileSync('public/favicon.png', buf);
  fs.writeFileSync('public/brand_logo.png', buf);
  fs.writeFileSync('public/brand_logo.jpg', buf);

  const dataUri = 'data:image/jpeg;base64,' + match[1];
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <image width="500" height="500" href="${dataUri}" />
</svg>`;
  fs.writeFileSync('public/brand_logo.svg', svgContent);
  fs.writeFileSync('public/favicon.svg', svgContent);

  console.log('All icons synchronized successfully from real official logoBase64!');
}
