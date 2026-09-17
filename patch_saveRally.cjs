const fs = require('fs');
let code = fs.readFileSync('js/views/rallyEntry.js', 'utf8');

// Insert isSavingRally
code = code.replace(/let rallyState = \{/, 'let isSavingRally = false;\nlet rallyState = {');

// Rewrite saveRally
const saveRallyRegex = /saveRally: async \(\) => \{[\s\S]*?deleteRally: async \(index\) => \{/;
const saveRallyReplacement = `saveRally: async () => {
    if (isSavingRally) {
      showToast("Đang lưu dữ liệu, vui lòng chờ...", "info");
      return;
    }
    isSavingRally = true;
    try {
      await window.app.actions.rally.performSaveRally();
    } finally {
      isSavingRally = false;
    }
  },
  performSaveRally: async () => {
    let retryCount = 0;
    while (retryCount < 3) {
      const match = state.matches.find(
        (m) => m.id_tran_dau === state.selectedMatchId,
      );
      const game = (match.chi_tiet_game || []).find(
        (g) =>
          g.id_game === state.selectedGameId ||
          (g.game_so && g.game_so.toString() === state.selectedGameId.toString()),
      );
      if (!rallyState.pointWinner) {
        showToast("Vui lòng chọn người ghi điểm!", "error");
        return;
      }
      const p1 = match.thong_tin.doi_thu_1;
      const p2 = match.thong_tin.doi_thu_2;

      const isEditing = rallyState.editingPointIndex !== -1;
      let nextId;
      if (isEditing) {
          nextId = game.danh_sach_diem[rallyState.editingPointIndex].thu_tu_diem;
      } else {
          const maxId = game.danh_sach_diem.reduce((max, p) => Math.max(max, p.thu_tu_diem || 0), 0);
          nextId = maxId + 1;
      }
      const totalPointsBefore = game.danh_sach_diem.length;
      const currentServer = calculateServerForPoint(
        totalPointsBefore,
        game.nguoi_giao_bong_truoc,
        p1,
        p2,
      );
      const isServer = (t) => t % 2 !== 0;

      const newPoint = {
        thu_tu_diem: nextId,
        ty_so_hien_tai: "",
        loai_diem: rallyState.pointType === "winner" ? "thang" : "thua",
        nguoi_ghi_diem: rallyState.pointWinner,
        tong_so_cham: rallyState.touches,
        nguoi_giao_bong: currentServer,
        khoi_nguon_giao_bong:
          rallyState.touches >= 1
            ? {
                nguoi_thuc_hien: currentServer,
                ky_thuat: rallyState.strokes.server.technique || null,
                dac_tinh: {
                  diem_roi_ngang: rallyState.strokes.server.dropX || null,
                  do_dai: rallyState.strokes.server.dropY || null,
                  do_xoay: rallyState.strokes.server.spin || null,
                  vi_tri_hong: null,
                },
              }
            : null,
        cu_tao_loi_the_N_2:
          rallyState.touches >= 3 && !rallyState.strokes.n2.skipped
            ? {
                nguoi_thuc_hien: isServer(rallyState.touches - 2)
                  ? currentServer
                  : currentServer === p1
                    ? p2
                    : p1,
                ky_thuat: rallyState.strokes.n2.technique || null,
                dac_tinh: {
                  diem_roi_ngang: rallyState.strokes.n2.dropX || null,
                  do_dai: rallyState.strokes.n2.dropY || null,
                  do_xoay: rallyState.strokes.n2.spin || null,
                  vi_tri_hong: null,
                },
              }
            : null,
        cu_dap_tra_N_1:
          rallyState.touches >= 2 && !rallyState.strokes.n1.skipped
            ? {
                nguoi_thuc_hien: isServer(rallyState.touches - 1)
                  ? currentServer
                  : currentServer === p1
                    ? p2
                    : p1,
                ky_thuat: rallyState.strokes.n1.technique || null,
                dac_tinh: {
                  diem_roi_ngang: rallyState.strokes.n1.dropX || null,
                  do_dai: rallyState.strokes.n1.dropY || null,
                  do_xoay: rallyState.strokes.n1.spin || null,
                  vi_tri_hong: null,
                },
              }
            : null,
        cu_ket_thuc_N: {
          tinh_chat: rallyState.pointType,
          nguoi_thuc_hien: isServer(rallyState.touches)
            ? currentServer
            : currentServer === p1
              ? p2
              : p1,
          ky_thuat: rallyState.strokes.n0.technique || null,
          dac_tinh: {
            diem_roi_ngang: rallyState.strokes.n0.dropX || null,
            do_dai: rallyState.strokes.n0.dropY || null,
            do_xoay: rallyState.strokes.n0.spin || null,
            vi_tri_hong: rallyState.strokes.n0.netOut || null,
          },
        },
      };

      // Create a backup of the original game point in case we need to rollback
      let originalPointBackup = null;
      if (isEditing) {
        originalPointBackup = JSON.parse(JSON.stringify(game.danh_sach_diem[rallyState.editingPointIndex]));
        game.danh_sach_diem[rallyState.editingPointIndex] = newPoint;
      } else {
        game.danh_sach_diem.push(newPoint);
      }
      
      const newGame = recalculateGame(game, p1, p2);
      Object.assign(game, newGame);
      
      try {
        const success = await saveData();
        if (success) {
          resetForm();
          showToast("Đã lưu Rally!");
          window.app.setState({});
          return;
        } else {
            // This is the false path from saveData not due to error throwing but maybe something else
            throw new Error("Lỗi khi lưu file");
        }
      } catch (err) {
        if (err.status === 409 || (err.message && err.message.includes('Lỗi khi lưu file'))) {
          // Rollback local changes
          if (isEditing) {
            game.danh_sach_diem[rallyState.editingPointIndex] = originalPointBackup;
          } else {
            game.danh_sach_diem.pop();
          }
          // Fetch latest
          const { loadData } = await import('../api.js');
          await loadData();
          retryCount++;
          showToast(\`Dữ liệu bị lệch (Conflict). Đang thử lại l\${retryCount}/3...\`, "info");
          continue;
        } else {
          showToast(\`Lưu dữ liệu thất bại: \${err.message}\`, "error");
          return;
        }
      }
    }
    showToast("Không thể lưu dữ liệu sau 3 lần thử.", "error");
  },
  deleteRally: async (index) => {`;

code = code.replace(saveRallyRegex, saveRallyReplacement);
fs.writeFileSync('js/views/rallyEntry.js', code);
console.log("saveRally patched.");
