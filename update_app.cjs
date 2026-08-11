const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

code = code.replace(
    /<h1 class="text-xl font-bold text-slate-800 cursor-pointer" onclick="window\.app\.navigate\('matchList'\)">Sổ Tay Bóng Bàn<\/h1>/,
    `<div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-800 cursor-pointer" onclick="window.app.navigate('matchList')">Sổ Tay Bóng Bàn</h1>
            \${state.isMockMode ? '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full whitespace-nowrap">🟡 DỮ LIỆU MẪU</span>' : '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full whitespace-nowrap">🟢 GITHUB</span>'}
        </div>`
);

code = code.replace(/async function init\(\) \{[\s\S]*?render\(\);\s*\}/, `async function init() {
    const ok = await loadData();
    if (ok) {
        setState({ view: 'matchList' });
    }
    render();
}`);

fs.writeFileSync('js/app.js', code);
