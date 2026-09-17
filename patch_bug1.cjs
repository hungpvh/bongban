const fs = require('fs');
let code = fs.readFileSync('js/views/rallyEntry.js', 'utf8');

const regex1 = /let optionsHtml = strokeKey === 'server' \? serveOptions : techOptions;/;
const replacement1 = `const isServePhase = strokeKey === 'server' || (strokeKey === 'n0' && parseInt(rallyState.touches) === 1);
    let optionsHtml = isServePhase ? serveOptions : techOptions;`;

const regex2 = /\$\{strokeKey === 'server' \? 'Loại giao bóng' : 'Kỹ thuật'\}/g;
const replacement2 = `\${isServePhase ? 'Loại giao bóng' : 'Kỹ thuật'}`;

const regex3 = /\$\{strokeKey === 'server' \? 'loại giao bóng' : 'kỹ thuật'\}/g;
const replacement3 = `\${isServePhase ? 'loại giao bóng' : 'kỹ thuật'}`;

code = code.replace(regex1, replacement1);
code = code.replace(regex2, replacement2);
code = code.replace(regex3, replacement3);

fs.writeFileSync('js/views/rallyEntry.js', code);
console.log("Bug 1 patched.");
