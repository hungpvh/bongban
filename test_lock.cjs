const fs = require('fs');
const rallyPath = 'js/views/rallyEntry.js';
let code = fs.readFileSync(rallyPath, 'utf8');

// I will inject isSavingRally lock and safeSaveData in rallyEntry.js
