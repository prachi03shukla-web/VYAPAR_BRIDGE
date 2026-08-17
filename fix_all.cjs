const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                            className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                          />
                        </div>
                        </div>
                        </div>
                        {adVideoPreview && (`;

const replacement = `                            className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                          />
                        </div>
                        </div>
                        {adVideoPreview && (`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed syntax by reducing one div');
