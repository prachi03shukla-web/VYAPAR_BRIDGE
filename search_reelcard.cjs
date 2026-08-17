const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const reelCardIndex = code.indexOf('function ReelCard({');
if (reelCardIndex !== -1) {
  const nextFuncIndex = code.indexOf('function ', reelCardIndex + 10);
  const snippet = code.substring(reelCardIndex, nextFuncIndex !== -1 ? nextFuncIndex : reelCardIndex + 8000);
  fs.writeFileSync('reelcard_snippet.txt', snippet);
  console.log("Extracted ReelCard snippet.");
} else {
  console.log("ReelCard not found.");
}
