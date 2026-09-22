import { state, setState, showToast } from "../store.js";
import { saveData } from "../api.js";
import {
  calculateServerForPoint,
  calculateScoreForPoint,
  recalculateGame,
} from "../logic.js";

let isSavingRally = false;
let rallyState = {
  touches: 3,
  inputMode: "forward",
  pointWinner: "",
  pointType: "winner",
  strokes: {
    server: { technique: "", dropX: "", dropY: "", player: "", spin: "", skipped: false },
    n2: { technique: "", dropX: "", dropY: "", player: "", spin: "", skipped: false },
    n1: { technique: "", dropX: "", dropY: "", player: "", spin: "", skipped: false },
    n0: { technique: "", dropX: "", dropY: "", player: "", spin: "", skipped: false, netOut: "" },
  },
  editingPointIndex: -1,
};

const isErrorType = (type) =>
  type === "unforced_error" || type === "forced_error" || (type && type !== "winner");

const resetForm = () => {
  rallyState = {
    touches: 3,
    inputMode: "forward",
    pointWinner: "",
    pointType: "winner",
    strokes: {
      server: { technique: "", dropX: "", dropY: "", player: "", spin: "", skipped: false },
      n2: { technique: "", dropX: "", dropY: "", player: "", spin: "", skipped: false },
      n1: { technique: "", dropX: "", dropY: "", player: "", spin: "", skipped: false },
      n0: { technique: "", dropX: "", dropY: "", player: "", spin: "", skipped: false, netOut: "" },
    },
    editingPointIndex: -1,
  };
};

window.app = window.app || {};
window.app.actions = window.app.actions || {};
window.app.actions.rally = {
  setTouches: (val) => {
    const num = parseInt(val, 10);
    rallyState.touches = isNaN(num) || num < 1 ? 1 : num;
    window.app.setState({});
  },
  newRally: () => {
    resetForm();
    window.app.setState({});
  },
  setMode: (mode) => {
    rallyState.inputMode = mode;
    window.app.setState({});
  },
  setWinner: (player) => {
    rallyState.pointWinner = player;
    window.app.setState({});
  },
  setType: (type) => {
    rallyState.pointType = type;
    window.app.setState({});
  },
  setStrokeProp: (strokeKey, prop, val) => {
    rallyState.strokes[strokeKey][prop] = val;
    if (strokeKey === 'n0' && prop === 'netOut') {
      if (val && rallyState.pointType === 'winner') {
        rallyState.pointType = 'unforced_error';
      } else if (!val && rallyState.pointType === 'unforced_error') {
        rallyState.pointType = 'winner';
      }
    }
    window.app.setState({});
  },
  saveRally: async () => {
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
      if (!match || !game) {
        showToast("Không tìm thấy trận đấu hoặc ván đấu!", "error");
        return;
      }
      if (!rallyState.pointWinner) {
        showToast("Vui lòng chọn người ghi điểm!", "error");
        return;
      }
      const touchesNum = parseInt(rallyState.touches, 10);
      if (isNaN(touchesNum) || touchesNum < 1) {
        showToast("Số chạm không hợp lệ (tối thiểu là 1)!", "error");
        return;
      }
      rallyState.touches = touchesNum;

      const p1 = match.thong_tin.doi_thu_1;
      const p2 = match.thong_tin.doi_thu_2;

      const isEditing = rallyState.editingPointIndex !== -1;
      let nextId;
      if (isEditing) {
        nextId = game.danh_sach_diem[rallyState.editingPointIndex].thu_tu_diem;
      } else {
        const maxId = (game.danh_sach_diem || []).reduce((max, p) => Math.max(max, p.thu_tu_diem || 0), 0);
        nextId = maxId + 1;
      }
      const totalPointsBefore = isEditing ? rallyState.editingPointIndex : (game.danh_sach_diem || []).length;
      const currentServer = calculateServerForPoint(
        totalPointsBefore,
        game.nguoi_giao_bong_truoc,
        p1,
        p2,
        game,
      );
      const isServer = (t) => t % 2 !== 0;
      const receiver = currentServer === p1 ? p2 : p1;

      const isOneTouch = rallyState.touches === 1;
      let errorLocation = rallyState.strokes.n0.netOut || null;
      if (errorLocation && rallyState.pointType === "winner") {
        rallyState.pointType = "unforced_error";
      }

      const newPoint = {
        thu_tu_diem: nextId,
        ty_so_hien_tai: "",
        loai_diem: rallyState.pointWinner === p1 ? "thang" : "thua",
        nguoi_ghi_diem: rallyState.pointWinner,
        tong_so_cham: rallyState.touches,
        nguoi_giao_bong: currentServer,
        khoi_nguon_giao_bong: {
          nguoi_thuc_hien: currentServer,
          ky_thuat: rallyState.strokes.server.technique || null,
          dac_tinh: {
            diem_roi_ngang: rallyState.strokes.server.dropX || null,
            do_dai: rallyState.strokes.server.dropY || null,
            do_xoay: rallyState.strokes.server.spin || null,
            vi_tri_hong: null,
          },
        },
        cu_tao_loi_the_N_2:
          rallyState.touches >= 4 && !rallyState.strokes.n2.skipped
            ? {
                nguoi_thuc_hien: isServer(rallyState.touches - 2) ? currentServer : receiver,
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
          rallyState.touches >= 3 && !rallyState.strokes.n1.skipped
            ? {
                nguoi_thuc_hien: isServer(rallyState.touches - 1) ? currentServer : receiver,
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
          nguoi_thuc_hien: isOneTouch
            ? currentServer
            : (isServer(rallyState.touches) ? currentServer : receiver),
          ky_thuat: isOneTouch
            ? (rallyState.strokes.server.technique || null)
            : (rallyState.strokes.n0.technique || null),
          dac_tinh: {
            diem_roi_ngang: isOneTouch
              ? (rallyState.strokes.server.dropX || null)
              : (rallyState.strokes.n0.dropX || null),
            do_dai: isOneTouch
              ? (rallyState.strokes.server.dropY || null)
              : (rallyState.strokes.n0.dropY || null),
            do_xoay: isOneTouch
              ? (rallyState.strokes.server.spin || null)
              : (rallyState.strokes.n0.spin || null),
            vi_tri_hong: errorLocation,
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
      
      const result = await saveData();
      if (result === true || (result && result.success)) {
        resetForm();
        showToast("Đã lưu Rally!", "success");
        window.app.setState({});
        return;
      } else {
        const err = result.error || new Error("Lỗi khi lưu file");
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
          showToast(`Dữ liệu bị lệch (Conflict). Đang thử lại lần ${retryCount}/3...`, "info");
          continue;
        } else {
          showToast(`Lưu dữ liệu thất bại: ${err.message}`, "error");
          return;
        }
      }
    }
    showToast("Không thể lưu dữ liệu sau 3 lần thử.", "error");
  },
  deleteRally: async (index) => {
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
  },
  editRally: (index) => {
    const match = state.matches.find(
      (m) => m.id_tran_dau === state.selectedMatchId,
    );
    const game = (match.chi_tiet_game || []).find(
      (g) =>
        g.id_game === state.selectedGameId ||
        (g.game_so && g.game_so.toString() === state.selectedGameId.toString()),
    );
    if (!game || !game.danh_sach_diem || !game.danh_sach_diem[index]) return;
    const point = game.danh_sach_diem[index];
    rallyState.touches = point.tong_so_cham || 1;
    rallyState.pointWinner = point.nguoi_ghi_diem || "";
    rallyState.pointType = point.cu_ket_thuc_N?.tinh_chat || "winner";
    rallyState.editingPointIndex = index;

    if (point.khoi_nguon_giao_bong) {
      rallyState.strokes.server.technique =
        point.khoi_nguon_giao_bong.ky_thuat || "";
      rallyState.strokes.server.dropX =
        point.khoi_nguon_giao_bong.dac_tinh?.diem_roi_ngang || "";
      rallyState.strokes.server.dropY = point.khoi_nguon_giao_bong.dac_tinh?.do_dai || "";
      rallyState.strokes.server.spin = point.khoi_nguon_giao_bong.dac_tinh?.do_xoay || "";
      rallyState.strokes.server.skipped = false;
    } else {
      rallyState.strokes.server.technique = "";
      rallyState.strokes.server.dropX = "";
      rallyState.strokes.server.dropY = "";
      rallyState.strokes.server.spin = "";
      rallyState.strokes.server.skipped = false;
    }

    if (point.cu_tao_loi_the_N_2) {
      rallyState.strokes.n2.technique = point.cu_tao_loi_the_N_2.ky_thuat || "";
      rallyState.strokes.n2.dropX = point.cu_tao_loi_the_N_2.dac_tinh?.diem_roi_ngang || "";
      rallyState.strokes.n2.dropY = point.cu_tao_loi_the_N_2.dac_tinh?.do_dai || "";
      rallyState.strokes.n2.spin = point.cu_tao_loi_the_N_2.dac_tinh?.do_xoay || "";
      rallyState.strokes.n2.skipped = false;
    } else {
      rallyState.strokes.n2.technique = "";
      rallyState.strokes.n2.dropX = "";
      rallyState.strokes.n2.dropY = "";
      rallyState.strokes.n2.spin = "";
      rallyState.strokes.n2.skipped = (point.tong_so_cham || 0) >= 4;
    }

    if (point.cu_dap_tra_N_1) {
      rallyState.strokes.n1.technique = point.cu_dap_tra_N_1.ky_thuat || "";
      rallyState.strokes.n1.dropX = point.cu_dap_tra_N_1.dac_tinh?.diem_roi_ngang || "";
      rallyState.strokes.n1.dropY = point.cu_dap_tra_N_1.dac_tinh?.do_dai || "";
      rallyState.strokes.n1.spin = point.cu_dap_tra_N_1.dac_tinh?.do_xoay || "";
      rallyState.strokes.n1.skipped = false;
    } else {
      rallyState.strokes.n1.technique = "";
      rallyState.strokes.n1.dropX = "";
      rallyState.strokes.n1.dropY = "";
      rallyState.strokes.n1.spin = "";
      rallyState.strokes.n1.skipped = (point.tong_so_cham || 0) >= 3;
    }

    if (point.cu_ket_thuc_N) {
      rallyState.strokes.n0.technique = point.cu_ket_thuc_N.ky_thuat || "";
      rallyState.strokes.n0.dropX =
        point.cu_ket_thuc_N.dac_tinh?.diem_roi_ngang || "";
      rallyState.strokes.n0.dropY = point.cu_ket_thuc_N.dac_tinh?.do_dai || "";
      rallyState.strokes.n0.spin = point.cu_ket_thuc_N.dac_tinh?.do_xoay || "";
      rallyState.strokes.n0.netOut =
        point.cu_ket_thuc_N.dac_tinh?.vi_tri_hong || "";
      rallyState.strokes.n0.skipped = false;
    } else {
      rallyState.strokes.n0.technique = "";
      rallyState.strokes.n0.dropX = "";
      rallyState.strokes.n0.dropY = "";
      rallyState.strokes.n0.spin = "";
      rallyState.strokes.n0.netOut = "";
      rallyState.strokes.n0.skipped = false;
    }

    window.app.setState({});
  },
  cancelEdit: () => {
    resetForm();
    window.app.setState({});
  },
};

export function renderRallyEntry() {
  if (!state.selectedMatchId || !state.selectedGameId)
    return `<p>Vui lòng chọn trận đấu</p>`;

  const match = state.matches.find(
    (m) => m.id_tran_dau === state.selectedMatchId,
  );
  const game = (match.chi_tiet_game || []).find(
    (g) =>
      g.id_game === state.selectedGameId ||
      (g.game_so && g.game_so.toString() === state.selectedGameId.toString()),
  );
  if (!match || !game) return `<p>Lỗi: Không tìm thấy dữ liệu</p>`;

  if (!state.dictionary) {
    return `
    <div class="p-8 text-center bg-slate-50 h-full flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p class="text-slate-500 font-medium">Đang tải kỹ thuật...</p>
    </div>`;
  }
  if (Object.keys(state.dictionary).length === 0) {
    return `
    <div class="p-8 text-center bg-slate-50 h-full flex flex-col items-center justify-center">
        <p class="text-danger font-medium mb-4">Lỗi: Không tải được từ điển dữ liệu.</p>
        <button onclick="window.app.navigate('matchList')" class="px-4 py-2 bg-slate-200 rounded font-bold hover:bg-slate-300 transition">Quay lại</button>
    </div>`;
  }

  const p1 = match.thong_tin.doi_thu_1;
  const p2 = match.thong_tin.doi_thu_2;

  const dict = state.dictionary || {};
  const allTechniques = dict.ky_thuat || {};
  
  // Logic phân loại: Nếu key bắt đầu bằng "giao_bong" -> là giao bóng, ngược lại là đánh bóng/rally
  const isServeTechnique = (k) => typeof k === 'string' && k.startsWith("giao_bong");
  
  const techOptions = Object.entries(allTechniques)
    .filter(([k, v]) => !isServeTechnique(k))
    .map(([k, v]) => `<option value="${k}">${v}</option>`)
    .join("");
    
  const serveOptions = Object.entries(allTechniques)
    .filter(([k, v]) => isServeTechnique(k))
    .map(([k, v]) => `<option value="${k}">${v}</option>`)
    .join("");
    
  const spins = dict.thuoc_tinh_bong?.do_xoay || {};
  const viTriHongDict = (dict.thuoc_tinh_loi && dict.thuoc_tinh_loi.vi_tri_hong) || {
    ruc_luoi: "Rúc lưới",
    ra_ngoai_dai: "Ra ngoài cạnh đáy",
    ra_ngoai_bien: "Ra ngoài cạnh bên",
    truot_bong: "Đánh hụt",
  };

  const renderGrid = (strokeKey, receiverPlayer) => {
    const isP1Receiver = receiverPlayer === p1;
    const topLabel = isP1Receiver ? "ngan" : "dai";
    const bottomLabel = isP1Receiver ? "dai" : "ngan";
    const topDisplay = isP1Receiver ? "Ngắn" : "Dài";
    const bottomDisplay = isP1Receiver ? "Dài" : "Ngắn";

    const leftLabel = isP1Receiver ? "trai" : "phai";
    const rightLabel = isP1Receiver ? "phai" : "trai";
    const leftDisplay = isP1Receiver ? "Trái" : "Phải";
    const rightDisplay = isP1Receiver ? "Phải" : "Trái";

    const stroke = rallyState.strokes[strokeKey];
    const isActive = (x, y) => stroke.dropX === x && stroke.dropY === y;
    const cellClass = (x, y) =>
      `cursor-pointer border border-slate-300 p-2 text-center text-sm rounded transition ${isActive(x, y) ? "bg-primary text-white font-bold" : "hover:bg-slate-100 bg-white"}`;
    const onClick = (x, y) =>
      `window.app.actions.rally.setStrokeProp('${strokeKey}', 'dropX', '${x}'); window.app.actions.rally.setStrokeProp('${strokeKey}', 'dropY', '${y}')`;
    const cellId = (x, y) => `grid-${strokeKey}-${x}-${y}`;

    return `
            <div class="grid grid-cols-3 gap-1 mt-2">
                <div id="${cellId(leftLabel, topLabel)}" class="${cellClass(leftLabel, topLabel)}" onclick="${onClick(leftLabel, topLabel)}">${topDisplay}<br>(${leftLabel})</div>
                <div id="${cellId("giua", topLabel)}" class="${cellClass("giua", topLabel)}" onclick="${onClick("giua", topLabel)}">${topDisplay}<br>Giữa</div>
                <div id="${cellId(rightLabel, topLabel)}" class="${cellClass(rightLabel, topLabel)}" onclick="${onClick(rightLabel, topLabel)}">${topDisplay}<br>(${rightLabel})</div>
                
                <div id="${cellId(leftLabel, bottomLabel)}" class="${cellClass(leftLabel, bottomLabel)}" onclick="${onClick(leftLabel, bottomLabel)}">${bottomDisplay}<br>(${leftLabel})</div>
                <div id="${cellId("giua", bottomLabel)}" class="${cellClass("giua", bottomLabel)}" onclick="${onClick("giua", bottomLabel)}">${bottomDisplay}<br>Giữa</div>
                <div id="${cellId(rightLabel, bottomLabel)}" class="${cellClass(rightLabel, bottomLabel)}" onclick="${onClick(rightLabel, bottomLabel)}">${bottomDisplay}<br>(${rightLabel})</div>
            </div>
        `;
  };

  const renderStrokeBlock = (
    title,
    strokeKey,
    playerLabel,
    receiverLabel,
    showTechnical = true,
    showViTriHong = false,
  ) => {
    const selectedTech = rallyState.strokes[strokeKey].technique;
    const isServePhase = strokeKey === 'server';
    let optionsHtml = isServePhase ? serveOptions : techOptions;
    
    // Xử lý trường hợp dữ liệu cũ không còn trong từ điển
    if (selectedTech && !optionsHtml.includes(`value="${selectedTech}"`)) {
       optionsHtml += `<option value="${selectedTech}">Kỹ thuật không còn trong từ điển: ${selectedTech}</option>`;
    }

    const customTechOptions = optionsHtml.replace(
      `value="${selectedTech}"`,
      `value="${selectedTech}" selected`,
    );
    
    const selectedSpin = rallyState.strokes[strokeKey].spin;
    let spinHtml = `<div class="mt-3"><label class="block text-xs font-semibold text-slate-500 mb-1">Độ xoáy</label><div class="flex flex-wrap gap-2">`;
    Object.entries(spins).forEach(([k, v]) => {
        const isActive = selectedSpin === k;
        spinHtml += `<button type="button" id="btn-spin-${strokeKey}-${k}" onclick="window.app.actions.rally.setStrokeProp('${strokeKey}', 'spin', '${isActive ? '' : k}')" class="px-3 py-2 text-sm font-bold rounded-lg border transition ${isActive ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}">${v}</button>`;
    });
    spinHtml += `</div></div>`;
    
    const isSkipped = rallyState.strokes[strokeKey].skipped;
    if (isSkipped) {
        return `
        <div class="border rounded-xl p-4 bg-slate-50 relative opacity-50" id="block-${strokeKey}-skipped">
            <div class="flex justify-between items-center">
                <h4 class="font-bold text-slate-700 m-0">${title} - <span class="text-primary">${playerLabel}</span></h4>
                <button type="button" id="btn-unskip-${strokeKey}" onclick="window.app.actions.rally.setStrokeProp('${strokeKey}', 'skipped', false)" class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition">Nhập lại</button>
            </div>
            <div class="text-xs text-slate-400 mt-1 italic">Đã bỏ qua</div>
        </div>`;
    }

    const skipButtonHtml = (strokeKey === 'n1' || strokeKey === 'n2') ? 
        `<button type="button" id="btn-skip-${strokeKey}" onclick="window.app.actions.rally.setStrokeProp('${strokeKey}', 'skipped', true)" class="absolute top-4 right-4 text-xs font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded transition">Bỏ qua</button>` : '';

    return `
        <div class="border rounded-xl p-4 bg-slate-50 relative" id="block-${strokeKey}">
            ${skipButtonHtml}
            <h4 class="font-bold text-slate-700 mb-2">${title} - <span class="text-primary">${playerLabel}</span></h4>
            ${showTechnical ? `
            <div class="mb-3">
                <label class="block text-xs font-semibold text-slate-500 mb-1">${isServePhase ? 'Loại giao bóng' : 'Kỹ thuật'}</label>
                <select id="select-tech-${strokeKey}" class="w-full p-2 border rounded-lg bg-white" onchange="window.app.actions.rally.setStrokeProp('${strokeKey}', 'technique', this.value)">
                    <option value="">-- Chọn ${isServePhase ? 'loại giao bóng' : 'kỹ thuật'} --</option>
                    ${customTechOptions}
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Điểm rơi (Nhìn từ phía: ${receiverLabel})</label>
                ${renderGrid(strokeKey, receiverLabel)}
            </div>
            ${spinHtml}
            ` : ''}
            ${
              showViTriHong && strokeKey === "n0"
                ? `
            <div class="mt-3">
                <label class="block text-xs font-semibold text-slate-500 mb-1">Vị trí hỏng</label>
                <div class="grid grid-cols-2 gap-2">
                ${Object.entries(viTriHongDict)
                  .map(
                    ([k, v]) =>
                      `<button type="button" id="btn-netout-${k}" onclick="window.app.actions.rally.setStrokeProp('n0', 'netOut', '${rallyState.strokes.n0.netOut === k ? '' : k}')" class="${rallyState.strokes.n0.netOut === k ? "bg-danger text-white shadow-sm" : "bg-white border text-slate-600 hover:bg-slate-50"} p-2 rounded-lg text-sm font-bold transition">${v}</button>`
                  )
                  .join("")}
                </div>
            </div>
            `
                : ""
            }
        </div>
        `;
  };

  const totalPointsBefore =
    rallyState.editingPointIndex !== -1
      ? rallyState.editingPointIndex
      : game.danh_sach_diem.length;
  const currentServer = calculateServerForPoint(
    totalPointsBefore,
    game.nguoi_giao_bong_truoc,
    p1,
    p2,
    game,
  );
  const isServer = (t) => t % 2 !== 0;

  const serverLabel = currentServer || p1;
  const receiverLabel = currentServer === p1 ? p2 : p1;

  const isEditing = rallyState.editingPointIndex !== -1;
  const isOneTouch = rallyState.touches === 1;
  const showNTechnicalFields = rallyState.touches >= 2;
  const showNViTriHong = isEditing
    ? isErrorType(rallyState.pointType) || !!rallyState.strokes.n0.netOut
    : true;

  const touchesOrdered = [];
  if (rallyState.touches >= 1) {
    touchesOrdered.push({
      key: "server",
      title: "Khởi nguồn (Giao bóng)",
      p: serverLabel,
      r: receiverLabel,
      showTechnical: true,
      showViTriHong: false,
    });
  }

  if (rallyState.touches >= 4) {
    const pN2 = isServer(rallyState.touches - 2) ? serverLabel : receiverLabel;
    const rN2 = isServer(rallyState.touches - 2) ? receiverLabel : serverLabel;
    touchesOrdered.push({
      key: "n2",
      title: "N-2 (Tạo lợi thế)",
      p: pN2,
      r: rN2,
      showTechnical: true,
      showViTriHong: false,
    });
  }

  if (rallyState.touches >= 3) {
    const pN1 = isServer(rallyState.touches - 1) ? serverLabel : receiverLabel;
    const rN1 = isServer(rallyState.touches - 1) ? receiverLabel : serverLabel;
    touchesOrdered.push({
      key: "n1",
      title: "N-1 (Đáp trả)",
      p: pN1,
      r: rN1,
      showTechnical: true,
      showViTriHong: false,
    });
  }

  if (showNTechnicalFields || showNViTriHong) {
    const pN0 = isOneTouch ? serverLabel : (isServer(rallyState.touches) ? serverLabel : receiverLabel);
    const rN0 = isOneTouch ? receiverLabel : (isServer(rallyState.touches) ? receiverLabel : serverLabel);
    touchesOrdered.push({
      key: "n0",
      title: "N (Kết thúc)",
      p: pN0,
      r: rN0,
      showTechnical: showNTechnicalFields,
      showViTriHong: showNViTriHong,
    });
  }

  let finalBlocks = [];
  if (rallyState.inputMode === "forward") {
    finalBlocks = touchesOrdered;
  } else {
    finalBlocks = [...touchesOrdered].reverse();
  }

  const htmlBlocks = finalBlocks
    .map((b) => renderStrokeBlock(b.title, b.key, b.p, b.r, b.showTechnical, b.showViTriHong))
    .join("");

  return `
    <div class="flex flex-col h-full bg-slate-100">
        <div class="bg-white p-4 shadow-sm flex items-center justify-between z-10 sticky top-0">
            <button id="btn-back-timeline" onclick="window.app.actions.rally.cancelEdit(); window.app.navigate('timeline', {selectedMatchId: '${match.id_tran_dau}', selectedGameId: '${state.selectedGameId}'})" class="p-2 text-slate-500 hover:text-slate-800 transition flex items-center gap-1"><i data-lucide="arrow-left" class="w-4 h-4"></i> Timeline</button>
            <div class="text-center">
                <div class="text-sm font-semibold text-slate-500">Game ${game.game_so}</div>
                <div class="text-xl font-bold font-mono text-primary">${game.ty_so_chung_cuoc || "0-0"}</div>
            </div>
            
            <div class="flex items-center gap-2">
                <button id="btn-view-timeline" onclick="window.app.actions.rally.cancelEdit(); window.app.navigate('timeline', {selectedMatchId: '${match.id_tran_dau}', selectedGameId: '${state.selectedGameId}'})" class="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-100 transition shadow-sm border border-blue-100"><i data-lucide="list" class="w-4 h-4 inline-block mr-1"></i> Xem Timeline</button>
                <div class="w-20 text-right text-xs font-semibold text-slate-500 hidden sm:block">Giao bóng:<br><span class="text-primary">${currentServer || "Hết game"}</span></div>
            </div>

        </div>

        <div class="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-6">
            <div class="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                <h3 class="font-bold text-slate-800 text-lg mb-4">
                    ${rallyState.editingPointIndex !== -1 ? `Chỉnh sửa điểm #${rallyState.editingPointIndex + 1}` : "Nhập điểm mới"}
                </h3>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Số chạm</label>
                        <input id="input-touches" type="number" min="1" max="50" value="${rallyState.touches}" oninput="window.app.actions.rally.setTouches(this.value)" onchange="window.app.actions.rally.setTouches(this.value)" class="w-full p-2 border rounded-lg bg-slate-50 font-bold text-center">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Chiều nhập</label>
                        <select id="select-input-mode" class="w-full p-2 border rounded-lg bg-slate-50" onchange="window.app.actions.rally.setMode(this.value)">
                            <option value="forward" ${rallyState.inputMode === "forward" ? "selected" : ""}>Xuôi (Serve -> N)</option>
                            <option value="backward" ${rallyState.inputMode === "backward" ? "selected" : ""}>Ngược (N -> Serve)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Người thắng điểm</label>
                        <select id="select-winner" class="w-full p-2 border rounded-lg bg-slate-50" onchange="window.app.actions.rally.setWinner(this.value)">
                            <option value="">-- Chọn --</option>
                            <option value="${p1}" ${rallyState.pointWinner === p1 ? "selected" : ""}>${p1}</option>
                            <option value="${p2}" ${rallyState.pointWinner === p2 ? "selected" : ""}>${p2}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Tính chất</label>
                        <select id="select-point-type" class="w-full p-2 border rounded-lg bg-slate-50" onchange="window.app.actions.rally.setType(this.value)">
                            <option value="winner" ${rallyState.pointType === "winner" ? "selected" : ""}>Winner</option>
                            <option value="unforced_error" ${rallyState.pointType === "unforced_error" ? "selected" : ""}>Unforced Error</option>
                            <option value="forced_error" ${rallyState.pointType === "forced_error" ? "selected" : ""}>Forced Error</option>
                        </select>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                    ${htmlBlocks}
                </div>

                <div class="pt-4 border-t flex gap-3">
                    ${rallyState.editingPointIndex !== -1 ? `<button id="btn-cancel-edit" onclick="window.app.actions.rally.cancelEdit()" class="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl transition hover:bg-slate-200">Hủy</button>` : ""}
                    <button id="btn-save-rally" onclick="window.app.actions.rally.saveRally()" class="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-sm transition hover:bg-primary-hover hover:shadow flex items-center justify-center gap-2">
                        <i data-lucide="save" class="w-5 h-5"></i> Lưu Rally
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}
