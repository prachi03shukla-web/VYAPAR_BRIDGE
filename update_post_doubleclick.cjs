const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// For <video>
code = code.replace(
  /onClick=\{handleMediaInteraction\} ref=\{\(el\)/g,
  `onClick={handleMediaInteraction} onDoubleClick={(e) => { e.stopPropagation(); if (clickTimeout.current) { clearTimeout(clickTimeout.current); clickTimeout.current = null; } handleDoubleClickImage(); }} ref={(el)`
);

// For <img>
code = code.replace(
  /onClick=\{handleMediaInteraction\}\s*onError/g,
  `onClick={handleMediaInteraction}\n              onDoubleClick={(e) => { e.stopPropagation(); if (clickTimeout.current) { clearTimeout(clickTimeout.current); clickTimeout.current = null; } handleDoubleClickImage(); }}\n              onError`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated PostItem with native onDoubleClick");
