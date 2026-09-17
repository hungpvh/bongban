const fs = require('fs');
let code = fs.readFileSync('js/views/rallyEntry.js', 'utf8');

const regex = /const isServeTechnique = \(k\) => k\.startsWith\("giao_bong"\);/;
const replacement = `const isServeTechnique = (k) => typeof k === 'string' && k.startsWith("giao_bong");`;

code = code.replace(regex, replacement);
fs.writeFileSync('js/views/rallyEntry.js', code);
console.log("isServeTechnique patched.");
