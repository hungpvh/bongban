const fs = require('fs');
let code = fs.readFileSync('js/views/matchDetail.js', 'utf8');

code = code.replace(
/    deleteGame: async \(\) => \{\n        if \(\!gameToDelete\) return;\n        const m = state\.matches\.find\(x => x\.id_tran_dau === state\.selectedMatchId\);\n        if \(m\) \{\n            m\.chi_tiet_game = m\.chi_tiet_game\.filter\(g => g\.id_game \!== gameToDelete\);\n            gameToDelete = null;\n            window\.app\.render\(\);\n            await saveData\(\);\n        \}\n    \}\};\n/,
`    deleteGame: async () => {
        if (!gameToDelete) return;
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        if (m) {
            m.chi_tiet_game = m.chi_tiet_game.filter(g => g.id_game !== gameToDelete);
            gameToDelete = null;
            window.app.render();
            await saveData();
        }
    }
};\n`);
fs.writeFileSync('js/views/matchDetail.js', code);
