const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove the admin bypass for guardrail
code = code.replace(
  /if \(guardrailActive && !isMasterAdmin\) \{/g,
  `if (guardrailActive) {`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed admin bypass for AI guardrail.');
