const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const postItemIndex = code.indexOf('function PostItem({');
if (postItemIndex !== -1) {
  const nextFuncIndex = code.indexOf('function ', postItemIndex + 10);
  const snippet = code.substring(postItemIndex, nextFuncIndex !== -1 ? nextFuncIndex : postItemIndex + 3000);
  fs.writeFileSync('postitem_snippet.txt', snippet);
  console.log("Extracted PostItem snippet.");
} else {
  console.log("PostItem not found.");
}
