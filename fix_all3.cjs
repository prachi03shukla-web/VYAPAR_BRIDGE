const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "                        </div>\n                        {adVideoPreview && (",
  "                        </div>\n                        </div>\n                        </div>\n                        {adVideoPreview && ("
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed tags');
