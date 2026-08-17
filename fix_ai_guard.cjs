const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const formattedContents = contents\.map\(c => typeof c === 'string' \? \{ text: c \} : c\);[\s\S]*?aiPromise = ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-2\.5-flash',[\s\S]*?contents: formattedContents[\s\S]*?\}\);/g;

const replacement = `        // Ensure contents array has proper text/inlineData structure
        const formattedParts = contents.map(c => {
          if (typeof c === 'string') return { text: c };
          if (c.inlineData) return { inlineData: c.inlineData };
          if (c.text) return { text: c.text };
          return c;
        });
        
        aiPromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: formattedParts }]
        });`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Updated AI formatting for genai SDK");
} else {
    console.log("Could not find the target code in server.ts");
}
