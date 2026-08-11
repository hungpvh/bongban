const fs = require('fs');
let code = fs.readFileSync('js/logic.js', 'utf8');

// Rename calculateServer to calculateServerForPoint
code = code.replace(/export const calculateServer =/, 'export const calculateServerForPoint =');
code = code.replace(/calculateServer\(/g, 'calculateServerForPoint(');

fs.writeFileSync('js/logic.js', code);
