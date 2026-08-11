const fs = require('fs');
let code = fs.readFileSync('js/views/timeline.js', 'utf8');

const regex = /window\.app\.actions\.timeline\.setFilter = \(f\) => \{[\s\S]*?window\.app\.render\(\);\n\};\n\nwindow\.app\.actions\.timeline = \{/m;

code = code.replace(regex, `window.app.actions.timeline = {
    setFilter: (f) => {
        state.timelineFilter = f;
        window.app.render();
    },`);

fs.writeFileSync('js/views/timeline.js', code, 'utf8');
