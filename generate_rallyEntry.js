const fs = require('fs');

const content = `import { state, setState, showToast } from '../store.js';
import { calculateServerForPoint, calculateScoreForPoint, recalculateGame } from '../logic.js';

let rallyState = {
    touches: 3,
    inputMode: 'forward', // 'forward' | 'backward'
    pointWinner: '',
    pointType: 'winner', // 'winner', 'unforced_error', 'forced_error'
    strokes: {
        server: { technique: '', dropX: '', dropY: '', player: '' },
        n2: { technique: '', dropX: '', dropY: '', player: '' },
        n1: { technique: '', dropX: '', dropY: '', player: '' },
        n0: { technique: '', dropX: '', dropY: '', player: '', netOut: '' },
    },
    editingPointIndex: -1 // -1 means new
};

const resetForm = () => {
    rallyState = {
        touches: 3,
        inputMode: 'forward',
        pointWinner: '',
        pointType: 'winner',
        strokes: {
            server: { technique: '', dropX: '', dropY: '', player: '' },
            n2: { technique: '', dropX: '', dropY: '', player: '' },
            n1: { technique: '', dropX: '', dropY: '', player: '' },
            n0: { technique: '', dropX: '', dropY: '', player: '', netOut: '' },
        },
        editingPointIndex: -1
    };
};

window.app.actions.rally = {
    setTouches: (val) => {
        rallyState.touches = parseInt(val);
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
        window.app.setState({});
    },
    saveRally: () => {
        // Build rally object
        const match = state.matches.find(m => m.id === state.selectedMatchId);
        const game = match.danh_sach_game.find(g => g.id_game === state.selectedGameId);
        
        // Validation (basic)
        if (!rallyState.pointWinner) {
            showToast('Vui lòng chọn người ghi điểm!', 'error');
            return;
        }

        const p1 = match.thong_tin_tran_dau.doi_thu_1;
        const p2 = match.thong_tin_tran_dau.doi_thu_2;
        
        const totalPointsBefore = game.danh_sach_diem.length;
        const currentServer = calculateServerForPoint(totalPointsBefore, game.nguoi_giao_bong_truoc, p1, p2);
        
        const newPoint = {
            thu_tu_diem: totalPointsBefore + 1,
            ty_so_hien_tai: "", // calculated below
            loai_diem: rallyState.pointType === 'winner' ? 'thang' : 'thua',
            nguoi_ghi_diem: rallyState.pointWinner,
            tong_so_cham: rallyState.touches,
            khoi_nguon_giao_bong: rallyState.touches >= 1 ? {
                nguoi_thuc_hien: currentServer,
                ky_thuat: rallyState.strokes.server.technique || null,
                dac_tinh: { 
                    diem_roi_ngang: rallyState.strokes.server.dropX || null, 
                    do_dai: rallyState.strokes.server.dropY || null, 
                    do_xoay: null, 
                    vi_tri_hong: null 
                }
            } : null,
            cu_tao_loi_the_N_2: rallyState.touches >= 3 ? {
                nguoi_thuc_hien: currentServer, // Simplified for now, should calculate properly
                ky_thuat: rallyState.strokes.n2.technique || null,
                dac_tinh: { 
                    diem_roi_ngang: rallyState.strokes.n2.dropX || null, 
                    do_dai: rallyState.strokes.n2.dropY || null, 
                    do_xoay: null, 
                    vi_tri_hong: null 
                }
            } : null,
            cu_dap_tra_N_1: rallyState.touches >= 2 ? {
                nguoi_thuc_hien: currentServer === p1 ? p2 : p1, // Simplified
                ky_thuat: rallyState.strokes.n1.technique || null,
                dac_tinh: { 
                    diem_roi_ngang: rallyState.strokes.n1.dropX || null, 
                    do_dai: rallyState.strokes.n1.dropY || null, 
                    do_xoay: null, 
                    vi_tri_hong: null 
                }
            } : null,
            cu_ket_thuc_N: {
                tinh_chat: rallyState.pointType,
                nguoi_thuc_hien: rallyState.pointWinner, // Simplified, actually it's who made the stroke
                ky_thuat: rallyState.strokes.n0.technique || null,
                dac_tinh: { 
                    diem_roi_ngang: rallyState.strokes.n0.dropX || null, 
                    do_dai: rallyState.strokes.n0.dropY || null, 
                    do_xoay: null, 
                    vi_tri_hong: rallyState.strokes.n0.netOut || null 
                }
            }
        };

        // Needs proper player alternation calculation:
        // Touches 1: Server hits N
        // Touches 2: Server -> Receiver(N)
        // Touches 3: Server -> Receiver(N-1) -> Server(N)
        const isServer = (t) => (t % 2 !== 0);
        
        if (rallyState.touches >= 3) {
            newPoint.cu_tao_loi_the_N_2.nguoi_thuc_hien = isServer(rallyState.touches - 2) ? currentServer : (currentServer === p1 ? p2 : p1);
        }
        if (rallyState.touches >= 2) {
            newPoint.cu_dap_tra_N_1.nguoi_thuc_hien = isServer(rallyState.touches - 1) ? currentServer : (currentServer === p1 ? p2 : p1);
        }
        newPoint.cu_ket_thuc_N.nguoi_thuc_hien = isServer(rallyState.touches) ? currentServer : (currentServer === p1 ? p2 : p1);

        if (rallyState.editingPointIndex !== -1) {
            game.danh_sach_diem[rallyState.editingPointIndex] = newPoint;
        } else {
            game.danh_sach_diem.push(newPoint);
        }

        // Recalculate game scores
        const newGame = recalculateGame(game, p1, p2);
        Object.assign(game, newGame);
        
        resetForm();
        showToast('Đã lưu Rally!');
        window.app.setState({});
    },
    deleteRally: (index) => {
        if (!confirm('Xóa rally này?')) return;
        const match = state.matches.find(m => m.id === state.selectedMatchId);
        const game = match.danh_sach_game.find(g => g.id_game === state.selectedGameId);
        game.danh_sach_diem.splice(index, 1);
        const newGame = recalculateGame(game, match.thong_tin_tran_dau.doi_thu_1, match.thong_tin_tran_dau.doi_thu_2);
        Object.assign(game, newGame);
        window.app.setState({});
    },
    editRally: (index) => {
        const match = state.matches.find(m => m.id === state.selectedMatchId);
        const game = match.danh_sach_game.find(g => g.id_game === state.selectedGameId);
        const point = game.danh_sach_diem[index];
        rallyState.touches = point.tong_so_cham;
        rallyState.pointWinner = point.nguoi_ghi_diem;
        rallyState.pointType = point.cu_ket_thuc_N?.tinh_chat || 'winner';
        rallyState.editingPointIndex = index;
        // Populate strokes... (to do)
        window.app.setState({});
    },
    cancelEdit: () => {
        resetForm();
        window.app.setState({});
    }
};

export function renderRallyEntry() {
    if (!state.selectedMatchId || !state.selectedGameId) return \`<p>Vui lòng chọn trận đấu</p>\`;
    
    const match = state.matches.find(m => m.id === state.selectedMatchId);
    const game = match.danh_sach_game.find(g => g.id_game === state.selectedGameId);
    if (!match || !game) return \`<p>Lỗi: Không tìm thấy dữ liệu</p>\`;

    const p1 = match.thong_tin_tran_dau.doi_thu_1;
    const p2 = match.thong_tin_tran_dau.doi_thu_2;
    
    const dict = state.dictionary || {};
    const techniques = dict.ky_thuat || {};
    const techOptions = Object.entries(techniques).map(([k, v]) => \`<option value="\${k}">\${v}</option>\`).join('');

    const renderGrid = (strokeKey, receiverPlayer) => {
        // Perspective logic
        const isP1Receiver = receiverPlayer === p1;
        const topLabel = isP1Receiver ? 'ngan' : 'dai';
        const bottomLabel = isP1Receiver ? 'dai' : 'ngan';
        const topDisplay = isP1Receiver ? 'Ngắn' : 'Dài';
        const bottomDisplay = isP1Receiver ? 'Dài' : 'Ngắn';

        // Columns: P1 receiver (near) -> left is trai. P2 receiver (far) -> left is phai.
        const leftLabel = isP1Receiver ? 'trai' : 'phai';
        const rightLabel = isP1Receiver ? 'phai' : 'trai';

        const stroke = rallyState.strokes[strokeKey];
        const isActive = (x, y) => stroke.dropX === x && stroke.dropY === y;
        const cellClass = (x, y) => \`cursor-pointer border border-slate-300 p-2 text-center text-sm rounded transition \${isActive(x, y) ? 'bg-primary text-white font-bold' : 'hover:bg-slate-100 bg-white'}\`;
        const onClick = (x, y) => \`window.app.actions.rally.setStrokeProp('\${strokeKey}', 'dropX', '\${x}'); window.app.actions.rally.setStrokeProp('\${strokeKey}', 'dropY', '\${y}')\`;

        return \`
            <div class="grid grid-cols-3 gap-1 mt-2">
                <div class="\${cellClass(leftLabel, topLabel)}" onclick="\${onClick(leftLabel, topLabel)}">\${topDisplay}<br>(\${leftLabel})</div>
                <div class="\${cellClass('giua', topLabel)}" onclick="\${onClick('giua', topLabel)}">\${topDisplay}<br>Giữa</div>
                <div class="\${cellClass(rightLabel, topLabel)}" onclick="\${onClick(rightLabel, topLabel)}">\${topDisplay}<br>(\${rightLabel})</div>
                
                <div class="\${cellClass(leftLabel, bottomLabel)}" onclick="\${onClick(leftLabel, bottomLabel)}">\${bottomDisplay}<br>(\${leftLabel})</div>
                <div class="\${cellClass('giua', bottomLabel)}" onclick="\${onClick('giua', bottomLabel)}">\${bottomDisplay}<br>Giữa</div>
                <div class="\${cellClass(rightLabel, bottomLabel)}" onclick="\${onClick(rightLabel, bottomLabel)}">\${bottomDisplay}<br>(\${rightLabel})</div>
            </div>
        \`;
    };

    const renderStrokeBlock = (title, strokeKey, playerLabel, receiverLabel, showGrid = true) => {
        return \`
        <div class="border rounded-xl p-4 bg-slate-50 relative">
            <h4 class="font-bold text-slate-700 mb-2">\${title} - \${playerLabel}</h4>
            <div class="mb-3">
                <label class="block text-xs font-semibold text-slate-500 mb-1">Kỹ thuật</label>
                <select class="w-full p-2 border rounded-lg bg-white" onchange="window.app.actions.rally.setStrokeProp('\${strokeKey}', 'technique', this.value)">
                    <option value="">-- Chọn kỹ thuật --</option>
                    \${techOptions.replace(\`value="\${rallyState.strokes[strokeKey].technique}"\`, \`value="\${rallyState.strokes[strokeKey].technique}" selected\`)}
                </select>
            </div>
            \${showGrid ? \`
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Điểm rơi (Góc nhìn: \${receiverLabel})</label>
                \${renderGrid(strokeKey, receiverLabel)}
            </div>
            \` : ''}
            \${strokeKey === 'n0' ? \`
            <div class="mt-3 grid grid-cols-2 gap-2">
                <button onclick="window.app.actions.rally.setStrokeProp('n0', 'netOut', 'luoi')" class="\${rallyState.strokes.n0.netOut === 'luoi' ? 'bg-danger text-white' : 'bg-white border text-slate-600'} p-2 rounded-lg text-sm font-bold">Rúc lưới</button>
                <button onclick="window.app.actions.rally.setStrokeProp('n0', 'netOut', 'ra_ngoai')" class="\${rallyState.strokes.n0.netOut === 'ra_ngoai' ? 'bg-danger text-white' : 'bg-white border text-slate-600'} p-2 rounded-lg text-sm font-bold">Ra ngoài</button>
            </div>
            \` : ''}
        </div>
        \`;
    };

    // Calculate players
    const totalPointsBefore = rallyState.editingPointIndex !== -1 ? rallyState.editingPointIndex : game.danh_sach_diem.length;
    const currentServer = calculateServerForPoint(totalPointsBefore, game.nguoi_giao_bong_truoc, p1, p2);
    const isServer = (t) => (t % 2 !== 0);
    
    let blocks = [];
    const serverLabel = currentServer;
    const receiverLabel = currentServer === p1 ? p2 : p1;

    // Build the ordered array of touches based on InputMode
    const touchesOrdered = [];
    if (rallyState.touches >= 1) touchesOrdered.push({ key: 'server', title: 'Khởi nguồn (Giao bóng)', p: serverLabel, r: receiverLabel });
    if (rallyState.touches >= 3) touchesOrdered.push({ key: 'n2', title: 'N-2 (Tạo lợi thế)', p: isServer(rallyState.touches - 2) ? serverLabel : receiverLabel, r: isServer(rallyState.touches - 2) ? receiverLabel : serverLabel });
    if (rallyState.touches >= 2) touchesOrdered.push({ key: 'n1', title: 'N-1 (Đáp trả)', p: isServer(rallyState.touches - 1) ? serverLabel : receiverLabel, r: isServer(rallyState.touches - 1) ? receiverLabel : serverLabel });
    touchesOrdered.push({ key: 'n0', title: 'N (Kết thúc)', p: isServer(rallyState.touches) ? serverLabel : receiverLabel, r: isServer(rallyState.touches) ? receiverLabel : serverLabel });

    // Only keep unique or necessary ones (server might overlap with N if touches=1)
    let finalBlocks = [];
    if (rallyState.touches === 1) {
        finalBlocks.push({ key: 'n0', title: 'Giao bóng lỗi (N)', p: serverLabel, r: receiverLabel });
    } else {
        if (rallyState.inputMode === 'forward') {
            finalBlocks = touchesOrdered;
        } else {
            // backward
            finalBlocks = [...touchesOrdered].reverse();
        }
    }

    const htmlBlocks = finalBlocks.map(b => renderStrokeBlock(b.title, b.key, b.p, b.r, true)).join('');

    return \`
    <div class="flex flex-col h-full bg-slate-100">
        <!-- Header -->
        <div class="bg-white p-4 shadow-sm flex items-center justify-between z-10 sticky top-0">
            <button onclick="window.app.navigate('matchDetail', {selectedMatchId: '\${match.id}'})" class="p-2 text-slate-500 hover:text-slate-800 transition"><i data-lucide="arrow-left"></i> Quay lại</button>
            <div class="text-center">
                <div class="text-sm font-semibold text-slate-500">Game \${game.game_so}</div>
                <div class="text-xl font-bold font-mono text-primary">\${game.ty_so_chung_cuoc || '0-0'}</div>
            </div>
            <div class="w-10"></div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-6">
            <!-- Left: Timeline -->
            <div class="lg:w-1/3 space-y-4">
                <h3 class="font-bold text-slate-700 flex justify-between items-center">
                    Timeline Điểm Số
                    <span class="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">\${game.danh_sach_diem.length} Rally</span>
                </h3>
                <div class="bg-white rounded-xl shadow-sm border p-4 max-h-[40vh] lg:max-h-none overflow-y-auto space-y-2">
                    \${game.danh_sach_diem.length === 0 ? '<p class="text-slate-400 text-sm italic text-center py-4">Chưa có dữ liệu</p>' : ''}
                    \${game.danh_sach_diem.map((pt, idx) => \`
                        <div class="p-3 border rounded-lg hover:bg-slate-50 transition relative group \${rallyState.editingPointIndex === idx ? 'ring-2 ring-primary bg-primary/5' : ''}">
                            <div class="flex justify-between items-start mb-1">
                                <div class="font-mono font-bold \${pt.nguoi_ghi_diem === p1 ? 'text-primary' : 'text-danger'}">\${pt.ty_so_hien_tai}</div>
                                <div class="text-xs text-slate-500">\${pt.tong_so_cham} chạm</div>
                            </div>
                            <div class="text-sm font-semibold text-slate-700">\${pt.nguoi_ghi_diem} <span class="text-xs font-normal text-slate-500">(\${pt.loai_diem})</span></div>
                            <div class="text-xs text-slate-500 mt-1 line-clamp-1">\${pt.cu_ket_thuc_N?.ky_thuat ? dict.ky_thuat[pt.cu_ket_thuc_N.ky_thuat] : 'Lỗi'}</div>
                            
                            <div class="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                <button onclick="window.app.actions.rally.editRally(\${idx})" class="p-1 bg-white border text-primary rounded shadow-sm hover:bg-slate-100"><i data-lucide="edit-2" class="w-3 h-3"></i></button>
                                <button onclick="window.app.actions.rally.deleteRally(\${idx})" class="p-1 bg-white border text-danger rounded shadow-sm hover:bg-slate-100"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                            </div>
                        </div>
                    \`).join('')}
                </div>
            </div>

            <!-- Right: Entry Form -->
            <div class="lg:w-2/3 bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                <h3 class="font-bold text-slate-800 text-lg mb-4">
                    \${rallyState.editingPointIndex !== -1 ? \`Chỉnh sửa điểm #\${rallyState.editingPointIndex + 1}\` : 'Nhập điểm mới'}
                </h3>

                <!-- General Props -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Số chạm</label>
                        <input type="number" min="1" max="20" value="\${rallyState.touches}" onchange="window.app.actions.rally.setTouches(this.value)" class="w-full p-2 border rounded-lg bg-slate-50 font-bold text-center">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Chiều nhập</label>
                        <select class="w-full p-2 border rounded-lg bg-slate-50" onchange="window.app.actions.rally.setMode(this.value)">
                            <option value="forward" \${rallyState.inputMode === 'forward' ? 'selected' : ''}>Xuôi (Serve -> N)</option>
                            <option value="backward" \${rallyState.inputMode === 'backward' ? 'selected' : ''}>Ngược (N -> Serve)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Người thắng điểm</label>
                        <select class="w-full p-2 border rounded-lg bg-slate-50" onchange="window.app.actions.rally.setWinner(this.value)">
                            <option value="">-- Chọn --</option>
                            <option value="\${p1}" \${rallyState.pointWinner === p1 ? 'selected' : ''}>\${p1}</option>
                            <option value="\${p2}" \${rallyState.pointWinner === p2 ? 'selected' : ''}>\${p2}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Tính chất</label>
                        <select class="w-full p-2 border rounded-lg bg-slate-50" onchange="window.app.actions.rally.setType(this.value)">
                            <option value="winner" \${rallyState.pointType === 'winner' ? 'selected' : ''}>Winner</option>
                            <option value="unforced_error" \${rallyState.pointType === 'unforced_error' ? 'selected' : ''}>Unforced Error</option>
                            <option value="forced_error" \${rallyState.pointType === 'forced_error' ? 'selected' : ''}>Forced Error</option>
                        </select>
                    </div>
                </div>

                <!-- Strokes Grid -->
                <div class="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                    \${htmlBlocks}
                </div>

                <!-- Actions -->
                <div class="pt-4 border-t flex gap-3">
                    \${rallyState.editingPointIndex !== -1 ? \`<button onclick="window.app.actions.rally.cancelEdit()" class="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl transition hover:bg-slate-200">Hủy</button>\` : ''}
                    <button onclick="window.app.actions.rally.saveRally()" class="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-sm transition hover:bg-primary-hover hover:shadow flex items-center justify-center gap-2">
                        <i data-lucide="save" class="w-5 h-5"></i> Lưu Rally
                    </button>
                </div>
            </div>
        </div>
    </div>
    \`;
}
