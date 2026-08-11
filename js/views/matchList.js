import { state, setState, showToast } from '../store.js';
import { saveData } from '../api.js';

let isAdding = false;
let editingMatchId = null;
let matchToDelete = null;

let formData = {
    ngay_thi_dau: '',
    loai_hinh: 'Giao hữu',
    doi_thu_1: 'Hungpv',
    doi_thu_2: '',
    chap_bong: 'Không chấp',
    ket_qua: '0-0',
    mo_ta: '',
    link_youtube: '',
    link_facebook: '',
    link_khac: ''
};

function resetForm() {
    formData = {
        ngay_thi_dau: new Date().toISOString().split('T')[0],
        loai_hinh: 'Giao hữu',
        doi_thu_1: 'Hungpv',
        doi_thu_2: '',
        chap_bong: 'Không chấp',
        ket_qua: '0-0',
        mo_ta: '',
        link_youtube: '',
        link_facebook: '',
        link_khac: ''
    };
    isAdding = false;
    editingMatchId = null;
}

window.app = window.app || {};
window.app.actions = window.app.actions || {};
window.app.actions.matchList = {
    toggleAdd: () => {
        resetForm();
        isAdding = true;
        window.app.render();
    },
    cancelEdit: () => {
        resetForm();
        window.app.render();
    },
    editMatch: (id) => {
        const m = state.matches.find(x => x.id_tran_dau === id);
        if (m) {
            formData = { ...m.thong_tin };
            editingMatchId = id;
            isAdding = true;
            window.app.render();
        }
    },
    updateForm: (field, value) => {
        formData[field] = value;
    },
    saveMatch: async () => {
        if (!formData.doi_thu_2) {
            showToast('Vui lòng nhập tên đối thủ', 'error');
            return;
        }
        
        if (editingMatchId) {
            const m = state.matches.find(x => x.id_tran_dau === editingMatchId);
            if (m) {
                m.thong_tin = { ...formData };
            }
        } else {
            state.matches.push({
                id_tran_dau: `match_${Date.now()}`,
                thong_tin: { ...formData },
                chi_tiet_game: []
            });
        }
        
        resetForm();
        window.app.render();
        await saveData();
    },
    confirmDelete: (id) => {
        matchToDelete = id;
        window.app.render();
    },
    cancelDelete: () => {
        matchToDelete = null;
        window.app.render();
    },
    deleteMatch: async () => {
        if (!matchToDelete) return;
        state.matches = state.matches.filter(m => m.id_tran_dau !== matchToDelete);
        matchToDelete = null;
        window.app.render();
        await saveData();
    },
    openMatch: (id) => {
        const match = state.matches.find(m => m.id_tran_dau === id);
        let firstGameId = null;
        if (match && match.chi_tiet_game && match.chi_tiet_game.length > 0) {
            firstGameId = match.chi_tiet_game[0].id_game || match.chi_tiet_game[0].game_so.toString();
        }
        setState({ view: 'timeline', selectedMatchId: id, selectedGameId: firstGameId });
    }
};

export function renderMatchList() {
    if (!formData.ngay_thi_dau) resetForm();

    let html = `
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Danh sách trận đấu</h2>
        ${!isAdding ? `<button onclick="window.app.actions.matchList.toggleAdd()" class="px-4 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2 hover:bg-primary-hover transition"><i data-lucide="plus" class="w-5 h-5"></i> Thêm trận mới</button>` : ''}
    </div>
    `;

    if (isAdding) {
        html += `
        <div class="bg-white p-6 rounded-xl border shadow-sm mb-6">
            <h3 class="text-xl font-bold mb-4">${editingMatchId ? 'Sửa trận đấu' : 'Thêm trận mới'}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label class="block text-sm font-medium text-slate-700 mb-1">Ngày thi đấu</label><input type="date" value="${formData.ngay_thi_dau}" onchange="window.app.actions.matchList.updateForm('ngay_thi_dau', this.value)" class="w-full p-2.5 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-slate-700 mb-1">Loại hình</label>
                    <select onchange="window.app.actions.matchList.updateForm('loai_hinh', this.value)" class="w-full p-2.5 border rounded-lg bg-white">
                        <option value="Giao hữu" ${formData.loai_hinh==='Giao hữu'?'selected':''}>Giao hữu</option>
                        <option value="Đánh bia" ${formData.loai_hinh==='Đánh bia'?'selected':''}>Đánh bia</option>
                        <option value="Thi đấu giải" ${formData.loai_hinh==='Thi đấu giải'?'selected':''}>Thi đấu giải</option>
                    </select>
                </div>
                <div><label class="block text-sm font-medium text-slate-700 mb-1">Tên của bạn (Tôi)</label><input type="text" value="${formData.doi_thu_1}" onchange="window.app.actions.matchList.updateForm('doi_thu_1', this.value)" class="w-full p-2.5 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-slate-700 mb-1">Tên đối thủ</label><input type="text" value="${formData.doi_thu_2}" placeholder="Nhập tên đối thủ..." onchange="window.app.actions.matchList.updateForm('doi_thu_2', this.value)" class="w-full p-2.5 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-slate-700 mb-1">Chấp bóng</label><input type="text" value="${formData.chap_bong}" onchange="window.app.actions.matchList.updateForm('chap_bong', this.value)" class="w-full p-2.5 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-slate-700 mb-1">Kết quả chung cuộc</label><input type="text" value="${formData.ket_qua}" placeholder="VD: 3-1" onchange="window.app.actions.matchList.updateForm('ket_qua', this.value)" class="w-full p-2.5 border rounded-lg"></div>
                <div class="md:col-span-2"><label class="block text-sm font-medium text-slate-700 mb-1">Mô tả / Ghi chú</label><input type="text" value="${formData.mo_ta}" onchange="window.app.actions.matchList.updateForm('mo_ta', this.value)" class="w-full p-2.5 border rounded-lg"></div>
                <div class="md:col-span-2"><label class="block text-sm font-medium text-slate-700 mb-1">Link YouTube</label><input type="text" value="${formData.link_youtube}" placeholder="https://youtube.com/..." onchange="window.app.actions.matchList.updateForm('link_youtube', this.value)" class="w-full p-2.5 border rounded-lg"></div>
            </div>
            <div class="flex gap-3 justify-end mt-6">
                <button onclick="window.app.actions.matchList.cancelEdit()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Hủy</button>
                <button onclick="window.app.actions.matchList.saveMatch()" class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition">Lưu trận đấu</button>
            </div>
        </div>
        `;
    }

    if (!state.matches || state.matches.length === 0) {
        if (!isAdding) html += `<div class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">Chưa có trận đấu nào. Hãy thêm trận đấu đầu tiên.</div>`;
    } else {
        html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
        [...state.matches].sort((a,b) => new Date(b.thong_tin.ngay_thi_dau) - new Date(a.thong_tin.ngay_thi_dau)).forEach(m => {
            const hasVideo = m.thong_tin.link_youtube || m.thong_tin.link_facebook || m.thong_tin.link_khac;
            const gamesCount = m.chi_tiet_game ? m.chi_tiet_game.length : 0;
            const rallyCount = m.chi_tiet_game ? m.chi_tiet_game.reduce((acc, g) => acc + (g.danh_sach_diem ? g.danh_sach_diem.length : 0), 0) : 0;
            
            html += `
            <div class="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group flex flex-col h-full" onclick="if(!event.target.closest('button')) window.app.actions.matchList.openMatch('${m.id_tran_dau}')">
                <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="event.stopPropagation(); window.app.actions.matchList.editMatch('${m.id_tran_dau}')" class="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="event.stopPropagation(); window.app.actions.matchList.confirmDelete('${m.id_tran_dau}')" class="p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
                
                <div class="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">${m.thong_tin.ngay_thi_dau} • ${m.thong_tin.loai_hinh}</div>
                <div class="text-xl font-black text-slate-800 mb-1 line-clamp-1 pr-16">${m.thong_tin.doi_thu_1} vs ${m.thong_tin.doi_thu_2}</div>
                <div class="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">${m.thong_tin.mo_ta || 'Không có mô tả'}</div>
                
                <div class="mt-auto pt-4 border-t flex justify-between items-center">
                    <div class="flex gap-3 text-sm font-medium text-slate-600">
                        <span class="flex items-center gap-1"><i data-lucide="layers" class="w-4 h-4"></i> ${gamesCount}</span>
                        <span class="flex items-center gap-1"><i data-lucide="activity" class="w-4 h-4"></i> ${rallyCount}</span>
                        ${hasVideo ? '<span class="flex items-center gap-1 text-red-500"><i data-lucide="video" class="w-4 h-4"></i></span>' : ''}
                    </div>
                    <div class="font-black text-lg text-primary bg-blue-50 px-3 py-1 rounded-lg">${m.thong_tin.ket_qua || '?'}</div>
                </div>
            </div>
            `;
        });
        html += `</div>`;
    }

    if (matchToDelete) {
        html += `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <div class="flex items-center gap-3 text-danger mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8"></i>
                    <h3 class="text-xl font-bold">Xóa trận đấu?</h3>
                </div>
                <p class="text-slate-600 mb-6 leading-relaxed">Toàn bộ dữ liệu Game, Rally và thống kê của trận đấu này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.</p>
                <div class="flex gap-3 justify-end">
                    <button onclick="window.app.actions.matchList.cancelDelete()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Hủy</button>
                    <button onclick="window.app.actions.matchList.deleteMatch()" class="px-5 py-2.5 bg-danger hover:bg-red-600 text-white font-bold rounded-lg transition">Xóa vĩnh viễn</button>
                </div>
            </div>
        </div>
        `;
    }

    return html;
}
