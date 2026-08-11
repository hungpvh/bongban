const fs = require('fs');

const appFile = fs.readFileSync('js/app.js', 'utf8');
if (!appFile.includes('window.app.logic = logic;')) {
    const code = appFile.replace("import { renderDashboard } from './views/dashboard.js';", "import { renderDashboard } from './views/dashboard.js';\nimport * as logic from './logic.js';\nwindow.app.logic = logic;");
    fs.writeFileSync('js/app.js', code);
}
