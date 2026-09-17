const fs = require('fs');
let code = fs.readFileSync('js/views/rallyEntry.js', 'utf8');

const regex = /deleteRally: async \(index\) => \{[\s\S]*?await saveData\(\);\s*\}/;
const replacement = `deleteRally: async (index) => {
    if (!confirm("Xóa rally này?")) return;
    if (isSavingRally) {
      showToast("Đang thao tác, vui lòng chờ...", "info");
      return;
    }
    isSavingRally = true;
    try {
        const match = state.matches.find(
          (m) => m.id_tran_dau === state.selectedMatchId,
        );
        const game = (match.chi_tiet_game || []).find(
          (g) =>
            g.id_game === state.selectedGameId ||
            (g.game_so && g.game_so.toString() === state.selectedGameId.toString()),
        );
        game.danh_sach_diem.splice(index, 1);
        const newGame = recalculateGame(
          game,
          match.thong_tin.doi_thu_1,
          match.thong_tin.doi_thu_2,
        );
        Object.assign(game, newGame);
        window.app.setState({});
        const result = await saveData();
        if (result !== true && (!result || !result.success)) {
            showToast("Lưu dữ liệu xóa thất bại", "error");
        }
    } finally {
        isSavingRally = false;
    }
  }`;

code = code.replace(regex, replacement);
fs.writeFileSync('js/views/rallyEntry.js', code);
console.log("deleteRally patched.");
