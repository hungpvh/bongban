const fs = require('fs');
let code = fs.readFileSync('js/api.js', 'utf8');

// replace the catch block
const regex = /\} catch\(e\) \{\s*console\.error\(e\);\s*showToast\(\`Lưu dữ liệu thất bại: \$\{e\.message\}\`, 'error'\);\s*return false;\s*\}/;
const replacement = `} catch(e) {
        console.error(e);
        // Do not show error toast here since we might retry
        throw e;
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('js/api.js', code);
console.log("api.js patched 3.");
