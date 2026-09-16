const fs = require('fs');
let code = fs.readFileSync('js/views/timeline.js', 'utf8');

// We want to replace the buttons with slightly better hit areas without increasing height, using -m-1
code = code.replace(
    'class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"',
    'class="p-2 sm:p-2.5 -m-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"'
);
code = code.replace(
    'class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"',
    'class="p-2 sm:p-2.5 -m-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"'
);

fs.writeFileSync('js/views/timeline.js', code);
console.log("Patched buttons!");
