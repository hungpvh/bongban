const fs = require('fs');
let code = fs.readFileSync('js/views/rallyEntry.js', 'utf8');

code = code.replace(
    /const SHOT_TYPES = \[.*?\];/,
    "const SHOT_TYPES = state.dictionary?.kieu_danh || [];"
);

code = code.replace(
    /const SERVE_TYPES = \[.*?\];/,
    "const SERVE_TYPES = state.dictionary?.kieu_giao_bong || [];"
);

code = code.replace(
    /const ERROR_TYPES = \[.*?\];/,
    "const ERROR_TYPES = state.dictionary?.loai_loi || [];"
);

fs.writeFileSync('js/views/rallyEntry.js', code);
