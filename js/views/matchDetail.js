import { state, setState, showToast } from '../store.js';
import { saveData } from '../api.js';
import { recalculateGame } from '../logic.js';

let isAddingGame = false;
let editingGame = null;
let gameToDelete = null;

let gameFormData = {
    game_so: 1,
    ty_so_bat_dau: '0-0',
    nguoi_giao_bong_truoc: ''
};

window.app = window.app || {};
window.app.actions = window.app.actions || {};
window.app.actions.matchDetail = {
    goBack: () => {
        setState({ view: 'matchList', selectedMatchId: null });
    },
    toggleAddGame: (player1) => {
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        const nextGameNum = m && m.chi_tiet_game ? m.chi_tiet_game.length + 1 : 1;
        
        isAddingGame = true;
        editingGame = null;
        gameFormData = {
            game_so: nextGameNum,
            ty_so_bat_dau: '0-0',
            nguoi_giao_bong_truoc: player1
        };
        window.app.render();
    },
    cancelEdit: () => {
        isAddingGame = false;
        editingGame = null;
        window.app.render();
    },
    editGame: (gameId) => {
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        if(!m) return;
        const g = m.chi_tiet_game.find(x => x.id_game === gameId || (x.game_so && x.game_so.toString() === gameId.toString()));
        if(!g) return;
        
        isAddingGame = true;
        editingGame = g;
        gameFormData = {
            game_so: g.game_so,
            ty_so_bat_dau: g.ty_so_bat_dau || '0-0',
            nguoi_giao_bong_truoc: g.nguoi_giao_bong_truoc || m.thong_tin.doi_thu_1
        };
        window.app.render();
    },
    updateGameForm: (field, value) => {
        gameFormData[field] = value;
    },
    saveGame: async () => {
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        if (!m) return;
        
        const scoreRegex = /^\s*(\d+)\s*-\s*(\d+)\s*$/;
        const match = String(gameFormData.ty_so_bat_dau).match(scoreRegex);
        if(!match) {
            showToast('Tỷ số bắt đầu không hợp lệ. Phải có định dạng SỐ-SỐ (VD: 0-0, 0-2)', 'error');
            return;
        }
        
        const gameSo = parseInt(gameFormData.game_so);
        if(isNaN(gameSo) || gameSo <= 0) {
            showToast('Số game phải là số nguyên dương', 'error');
            return;
        }
        
        const isDuplicate = m.chi_tiet_game.some(g => g.game_so === gameSo && (!editingGame || g.id_game !== editingGame.id_game));
        if (isDuplicate) {
            showToast('Số Game đã tồn tại trong trận này', 'error');
            return;
        }

        const normalizedScore = `${parseInt(match[1])}-${parseInt(match[2])}`;
        
        if (editingGame) {
            const gIndex = m.chi_tiet_game.findIndex(g => g.id_game === editingGame.id_game);
            if (gIndex > -1) {
                const oldGame = m.chi_tiet_game[gIndex];
                const updatedGame = {
                    ...oldGame,
                    game_so: gameSo,
                    ty_so_bat_dau: normalizedScore,
                    nguoi_giao_bong_truoc: gameFormData.nguoi_giao_bong_truoc
                };
                m.chi_tiet_game[gIndex] = recalculateGame(updatedGame, m.thong_tin.doi_thu_1, m.thong_tin.doi_thu_2);
            }
        } else {
            m.chi_tiet_game.push({
                id_game: 'game_' + Date.now(),
                game_so: gameSo,
                ty_so_bat_dau: normalizedScore,
                nguoi_giao_bong_truoc: gameFormData.nguoi_giao_bong_truoc,
                ty_so_chung_cuoc: normalizedScore,
                trang_thai: 'dang_danh',
                danh_sach_diem: []
            });
        }
        
        isAddingGame = false;
        editingGame = null;
        window.app.render();
        await saveData();
    },
    confirmDeleteGame: (gameId) => {
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
            m.chi_tiet_game = m.chi_tiet_game.filter(g => (g.id_game || g.game_so).toString() !== gameToDelete.toString());
            gameToDelete = null;
            window.app.render();
            await saveData();
        }
    },
    openRallyEntry: (gameId) => {
        setState({ view: 'rallyEntry', selectedGameId: gameId });
    }
};

export function renderMatchDetail() {
    const matchId = state.selectedMatchId;
    const m = state.matches.find(x => x.id_tran_dau === matchId);
    if (!m) return `<div class="p-6 text-center text-slate-500">Không tìm thấy trận đấu</div>`;
    
    if (m.chi_tiet_game) {
        m.chi_tiet_game.sort((a, b) => a.game_so - b.game_so);
    } else {
        m.chi_tiet_game = [];
    }

    let html = `
    <div class="mb-4">
        <button onclick="window.app.actions.matchDetail.goBack()" class="text-slate-500 hover:text-primary flex items-center gap-1 text-sm font-bold transition"><i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại Danh sách</button>
    </div>
    
    <div class="bg-white p-6 rounded-2xl border shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <div class="text-3xl font-black text-slate-800 mb-2">${m.thong_tin.doi_thu_1} <span class="text-slate-300 font-normal mx-2 text-xl">vs</span> ${m.thong_tin.doi_thu_2}</div>
            <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
                <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-4 h-4"></i> ${m.thong_tin.ngay_thi_dau}</span>
                <span class="flex items-center gap-1"><i data-lucide="tag" class="w-4 h-4"></i> ${m.thong_tin.loai_hinh}</span>
                ${m.thong_tin.chap_bong ? `<span class="flex items-center gap-1 text-amber-600"><i data-lucide="scale" class="w-4 h-4"></i> Chấp: ${m.thong_tin.chap_bong}</span>` : ''}
            </div>
        </div>
        <div class="px-5 py-3 bg-slate-100 rounded-xl text-center min-w-[120px]">
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kết quả</div>
            <div class="text-2xl font-black text-primary">${m.thong_tin.ket_qua || '?'}</div>
        </div>
    </div>
    
    <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-slate-800">Danh sách Game</h3>
        ${!isAddingGame ? `<button onclick="window.app.actions.matchDetail.toggleAddGame('${m.thong_tin.doi_thu_1}')" class="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 transition shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i> Thêm Game</button>` : ''}
    </div>
    `;

    if (isAddingGame) {
        html += `
        <div class="bg-white p-6 rounded-2xl border shadow-sm mb-6 border-slate-300">
            <h4 class="text-lg font-bold mb-4">${editingGame ? 'Sửa thông tin Game' : 'Thêm Game mới'}</h4>
            ${gameFormData.ty_so_bat_dau !== '0-0' ? `<div class="mb-5 text-sm font-bold text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2"><i data-lucide="info" class="w-5 h-5 shrink-0"></i><div>Game này đang sử dụng chấp điểm. <br/>Điểm bên trái = <b>Tôi (${m.thong_tin.doi_thu_1})</b><br/>Điểm bên phải = <b>Đối thủ (${m.thong_tin.doi_thu_2})</b></div></div>` : ''}
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Game số</label>
                    <input type="number" min="1" value="${gameFormData.game_so}" onchange="window.app.actions.matchDetail.updateGameForm('game_so', this.value)" class="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Tỷ số bắt đầu</label>
                    <input type="text" value="${gameFormData.ty_so_bat_dau}" onchange="window.app.actions.matchDetail.updateGameForm('ty_so_bat_dau', this.value)" placeholder="VD: 0-0, 0-2" class="w-full p-2.5 bg-slate-50 border rounded-lg font-bold font-mono tracking-wider text-center">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Người giao bóng trước</label>
                    <select onchange="window.app.actions.matchDetail.updateGameForm('nguoi_giao_bong_truoc', this.value)" class="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
                        <option value="${m.thong_tin.doi_thu_1}" ${gameFormData.nguoi_giao_bong_truoc === m.thong_tin.doi_thu_1 ? 'selected' : ''}>Tôi (${m.thong_tin.doi_thu_1})</option>
                        <option value="${m.thong_tin.doi_thu_2}" ${gameFormData.nguoi_giao_bong_truoc === m.thong_tin.doi_thu_2 ? 'selected' : ''}>Đối thủ (${m.thong_tin.doi_thu_2})</option>
                    </select>
                </div>
            </div>
            
            <div class="mt-6 flex gap-3 justify-end pt-4 border-t">
                <button onclick="window.app.actions.matchDetail.cancelEdit()" class="px-5 py-2.5 bg-slate-100 border hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Hủy</button>
                <button onclick="window.app.actions.matchDetail.saveGame()" class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition">Lưu Game</button>
            </div>
        </div>
        `;
    }

    if (m.chi_tiet_game.length === 0) {
        if (!isAddingGame) html += `<div class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">Chưa có Game nào. Bấm "Thêm Game" để bắt đầu nhập liệu.</div>`;
    } else {
        html += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;
        m.chi_tiet_game.forEach(g => {
            const rallyCount = g.danh_sach_diem ? g.danh_sach_diem.length : 0;
            const scoreParts = g.ty_so_chung_cuoc ? g.ty_so_chung_cuoc.split('-').map(Number) : [0,0];
            const p1Score = isNaN(scoreParts[0]) ? 0 : scoreParts[0];
            const p2Score = isNaN(scoreParts[1]) ? 0 : scoreParts[1];
            
            let scoreColor = 'text-slate-800';
            if (p1Score > p2Score) scoreColor = 'text-success';
            else if (p1Score < p2Score) scoreColor = 'text-danger';
            
            const isHandicap = g.ty_so_bat_dau && g.ty_so_bat_dau !== '0-0';

            html += `
            <div class="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col h-full" onclick="if(!event.target.closest('button')) window.app.actions.matchDetail.openRallyEntry('${g.id_game || g.game_so}')">
                <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="event.stopPropagation(); window.app.actions.matchDetail.editGame('${g.id_game || g.game_so}')" class="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="event.stopPropagation(); window.app.actions.matchDetail.confirmDeleteGame('${g.id_game || g.game_so}')" class="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
                
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700 shrink-0">#${g.game_so}</div>
                    <div>
                        <div class="text-sm font-bold text-slate-500 line-clamp-1">Giao bóng: ${g.nguoi_giao_bong_truoc === m.thong_tin.doi_thu_1 ? 'Tôi' : 'Đối thủ'}</div>
                        ${isHandicap ? `<div class="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 inline-block px-1.5 py-0.5 rounded mt-0.5">Xuất phát: ${g.ty_so_bat_dau}</div>` : ''}
                    </div>
                </div>
                
                <div class="mt-auto pt-4 flex items-end justify-between border-t mt-4">
                    <div class="text-sm font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">${rallyCount} rally</div>
                    <div class="text-3xl font-black font-mono tracking-tighter ${scoreColor}">${g.ty_so_chung_cuoc || '0-0'}</div>
                </div>
            </div>
            `;
        });
        html += `</div>`;
    }

    if (gameToDelete) {
        const delG = m.chi_tiet_game.find(g => (g.id_game || g.game_so).toString() === gameToDelete.toString());
        html += `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <div class="flex items-center gap-3 text-danger mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8"></i>
                    <h3 class="text-xl font-bold">Xóa Game ${delG ? delG.game_so : ''}?</h3>
                </div>
                <p class="text-slate-600 mb-6 leading-relaxed">Tất cả dữ liệu rally, timeline phân tích của Game này sẽ bị xóa. Hành động này không thể hoàn tác.</p>
                <div class="flex gap-3 justify-end">
                    <button onclick="window.app.actions.matchDetail.cancelDeleteGame()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Hủy</button>
                    <button onclick="window.app.actions.matchDetail.deleteGame()" class="px-5 py-2.5 bg-danger hover:bg-red-600 text-white font-bold rounded-lg transition">Xóa Game</button>
                </div>
            </div>
        </div>
        `;
    }

    return html;
}
