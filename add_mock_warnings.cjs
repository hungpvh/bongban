const fs = require('fs');

function addWarning(file) {
    let code = fs.readFileSync(file, 'utf8');
    const warningHTML = `\${state.isMockMode ? '<div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium flex gap-2 items-center"><i data-lucide="info" class="w-5 h-5"></i> Ứng dụng đang sử dụng dữ liệu mẫu. Các thay đổi sẽ chỉ lưu tạm thời và không được ghi vào GitHub.</div>' : ''}`;
    
    // Insert after the first flex container
    code = code.replace(
        /<div class="flex justify-between items-center mb-6">/,
        warningHTML + '\n    <div class="flex justify-between items-center mb-6">'
    );
    fs.writeFileSync(file, code);
}

addWarning('js/views/matchList.js');

let mdCode = fs.readFileSync('js/views/matchDetail.js', 'utf8');
const mdWarningHTML = `\${state.isMockMode ? '<div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium flex gap-2 items-center"><i data-lucide="info" class="w-5 h-5"></i> Ứng dụng đang sử dụng dữ liệu mẫu. Các thay đổi sẽ chỉ lưu tạm thời và không được ghi vào GitHub.</div>' : ''}`;
mdCode = mdCode.replace(
    /<div class="mb-4">\s*<button onclick="window\.app\.navigate\('matchList'\)"/,
    mdWarningHTML + '\n    <div class="mb-4">\n        <button onclick="window.app.navigate(\'matchList\')"'
);
fs.writeFileSync('js/views/matchDetail.js', mdCode);

