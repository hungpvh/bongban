const fs = require('fs');
let code = fs.readFileSync('js/api.js', 'utf8');

// Replace the GET request before PUT in saveData
const regex = /let getRes = await fetch\(\`\$\{baseUrl\}\/dulieubongban_v2\.json\?ref=\$\{state\.github\.branch\}\`, \{headers: headersGet\}\);\s*if \(\!getRes\.ok\) throw new Error\('Không thể lấy SHA mới nhất của file'\);\s*const getData = await getRes\.json\(\);\s*const currentSha = getData\.sha;/;

const replacement = `const currentSha = state.files.matchesSha;
        if (!currentSha) throw new Error('Missing SHA');`;

code = code.replace(regex, replacement);

fs.writeFileSync('js/api.js', code);
console.log("api.js patched.");
