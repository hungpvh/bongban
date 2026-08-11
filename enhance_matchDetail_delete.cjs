const fs = require('fs');
let code = fs.readFileSync('js/views/matchDetail.js', 'utf8');

code = code.replace(
    /let isAddingGame = false;\nlet editingGame = null;/,
    `let isAddingGame = false;\nlet editingGame = null;\nlet gameToDelete = null;`
);

code = code.replace(
    /deleteGame:\s*async\s*\(\w+\)\s*=>\s*\{[\s\S]*?await saveData\(\);\s*\}\s*\}/,
    `confirmDeleteGame: (gameId) => {
        gameToDelete = gameId;
        window.app.render();
    },
    cancelDeleteGame: () => {
        gameToDelete = null;
        window.app.render();
    },
    deleteGame: async () => {
        if (!gameToDelete) return;
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        if (m) {
            m.chi_tiet_game = m.chi_tiet_game.filter(g => g.id_game !== gameToDelete);
            gameToDelete = null;
            window.app.render();
            await saveData();
        }
    }
}`
);

code = code.replace(
    /<button onclick="event\.stopPropagation\(\); window\.app\.actions\.matchDetail\.deleteGame\('\\$\{g\.id_game\}'\)"/,
    `<button onclick="event.stopPropagation(); window.app.actions.matchDetail.confirmDeleteGame('\${g.id_game}')"`
);

// Add the modal HTML if gameToDelete is set
code = code.replace(
    /return html;/,
    `if (gameToDelete) {
        const delG = m.chi_tiet_game.find(g => g.id_game === gameToDelete);
        html += \`
        <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                <div class="flex items-center gap-3 text-danger mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8"></i>
                    <h3 class="text-xl font-bold">Xác nhận xóa Game</h3>
                </div>
                <p class="text-slate-800 font-medium mb-2">Bạn có chắc chắn muốn xóa Game \${delG ? delG.game_so : ''} không?</p>
                <p class="text-slate-500 text-sm mb-6">Tất cả dữ liệu rally và timeline của Game này sẽ bị xóa. Hành động này không thể hoàn tác.</p>
                <div class="flex gap-3 justify-end">
                    <button onclick="window.app.actions.matchDetail.cancelDeleteGame()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">Hủy</button>
                    <button onclick="window.app.actions.matchDetail.deleteGame()" class="px-4 py-2 bg-danger hover:bg-red-600 text-white font-bold rounded-lg transition-colors">Xóa Game</button>
                </div>
            </div>
        </div>
        \`;
    }
    return html;`
);

fs.writeFileSync('js/views/matchDetail.js', code);
