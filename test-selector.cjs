const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('dist/index.html', 'utf-8');
const dom = new JSDOM(html);
const el1 = dom.window.document.querySelector("div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > main:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(4)");
const el2 = dom.window.document.querySelector("div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > main:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1)");
console.log("Element 1:", el1 ? el1.outerHTML.substring(0, 500) : "Element not found");
console.log("Element 2:", el2 ? el2.outerHTML.substring(0, 500) : "Element not found");
