const fs = require('fs');
let code = fs.readFileSync('js/api.js', 'utf8');

const regex = /\} catch\(e\) \{\s*console\.error\(e\);\s*\/\/ Do not show error toast here since we might retry\s*throw e;\s*\}/;
const replacement = `} catch(e) {
        console.error(e);
        return { success: false, error: e };
    }`;

code = code.replace(regex, replacement);

// And we need to change returning true to returning { success: true }
code = code.replace(/return true;/g, 'return { success: true };');
code = code.replace(/return { success: true };/, 'return true;'); // The first one is in mockmode, let's just make it return { success: true } for everything? Wait, let's only replace the ones in saveData.

fs.writeFileSync('js/api.js', code);
console.log("api.js patched 4.");
