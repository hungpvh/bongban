const fs = require('fs');
let code = fs.readFileSync('js/api.js', 'utf8');

const regex = /const err = await res\.json\(\);\s*throw new Error\(err\.message \|\| 'Lỗi khi lưu file'\);/;
const replacement = `const err = await res.json();
            const error = new Error(err.message || 'Lỗi khi lưu file');
            error.status = res.status;
            throw error;`;

code = code.replace(regex, replacement);
fs.writeFileSync('js/api.js', code);
console.log("api.js patched 2.");
