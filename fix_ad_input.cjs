const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                          />
                        </div>
                        {adVideoPreview && (`;

const replacement = `                          />
                        </div>
                        </div>
                        {adVideoPreview && (`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed tags');
