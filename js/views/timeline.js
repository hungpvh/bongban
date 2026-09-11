import { state, setState } from '../store.js';


window.app = window.app || {};
window.app.actions = window.app.actions || {};

window.app.actions.timeline = {
    setFilter: (f) => {
        state.timelineFilter = f;
        window.app.render();
    },
    toggleExpand: (ptIdx) => {
        if (state.timelineExpandedIdx === ptIdx) {
            state.timelineExpandedIdx = null;
        } else {
            state.timelineExpandedIdx = ptIdx;
        }
        window.app.render();
    }
};

export function renderTimeline() {
    if (!state.selectedMatchId) return `<p class="p-6 text-center text-slate-500">Vui lòng chọn trận đấu.</p>`;
    
    
    
    const match = state.matches.find(m => m.id_tran_dau === state.selectedMatchId);
    if (!match) return `<p class="p-6 text-center text-slate-500">Không tìm thấy trận đấu.</p>`;

    if (!state.selectedGameId) {
        return `
        <div class="flex flex-col h-full bg-slate-100">
            <div class="bg-white p-4 shadow-sm flex items-center justify-between z-20 sticky top-0 border-b">
                <button onclick="window.app.navigate('matchList')" class="p-2 text-slate-500 hover:text-slate-800 transition flex items-center gap-1"><i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại</button>
                <h2 class="font-black text-slate-800 text-lg hidden sm:block">TIMELINE TRẬN ĐẤU</h2>
                <div class="w-20"></div>
            </div>
            <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div class="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <i data-lucide="inbox" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-700 mb-2">Trận đấu chưa có Game nào</h3>
                <p class="text-slate-500 mb-6">Vui lòng thêm game để bắt đầu ghi nhận điểm số và xem timeline.</p>
                <button onclick="window.app.navigate('matchDetail', {selectedMatchId: '${match.id_tran_dau}'})" class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-sm transition">
                    Cấu hình Trận đấu & Thêm Game
                </button>
            </div>
        </div>
        `;
    }
    
    
    
    const p1 = match.thong_tin.doi_thu_1;
    const p2 = match.thong_tin.doi_thu_2;
    
    // We will render game tabs here
    let gamesHtml = `<div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">`;
    (match.chi_tiet_game || []).forEach(g => {
        const gameId = g.id_game || g.game_so.toString();
        const isSelected = gameId === state.selectedGameId;
        gamesHtml += `
            <button onclick="window.app.navigate('timeline', {selectedMatchId: '${match.id_tran_dau}', selectedGameId: '${gameId}'})" 
                    class="px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border shadow-sm'}">
                Game ${g.game_so}
            </button>
        `;
    });
    gamesHtml += `</div>`;
    
    const game = (match.chi_tiet_game || []).find(g => g.id_game === state.selectedGameId || (g.game_so && g.game_so.toString() === state.selectedGameId.toString()));
    
    if (!game) return `<p class="p-6 text-center text-slate-500">Không tìm thấy game.</p>`;
    
    const dict = state.dictionary || {};
    const getTechName = (k) => dict.ky_thuat?.[k] || k;
    
    const renderCompactPoint = (pt, isExpanded) => {
        let serveHtml = '', n2Html = '', n1Html = '', n0Html = '';
        
        const renderBadge = (player) => {
            if (!player) return '';
            const badgeClasses = "inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-slate-200/80 border border-slate-300 text-[11px] font-bold text-slate-700 mr-1.5 align-middle";
            if (player === p1) return `<span class="${badgeClasses}">1</span>`;
            if (player === p2) return `<span class="${badgeClasses}">2</span>`;
            return '';
        };
        const serveInfo = pt.khoi_nguon_giao_bong;
        const sn2 = pt.cu_tao_loi_the_N_2;
        const sn1 = pt.cu_dap_tra_N_1;
        const sn0 = pt.cu_ket_thuc_N;
        
        const renderAttr = (s) => {
            let parts = [];
            if(s.ky_thuat) parts.push(getTechName(s.ky_thuat));
            if(s.dac_tinh?.diem_roi_ngang) parts.push(`🎯 ${dict.thuoc_tinh_bong?.diem_roi_ngang?.[s.dac_tinh.diem_roi_ngang] || s.dac_tinh.diem_roi_ngang}`);
            if(s.dac_tinh?.do_dai) parts.push(dict.thuoc_tinh_bong?.do_dai?.[s.dac_tinh.do_dai] || s.dac_tinh.do_dai);
            if(s.dac_tinh?.do_xoay) parts.push(dict.thuoc_tinh_bong?.do_xoay?.[s.dac_tinh.do_xoay] || s.dac_tinh.do_xoay);
            return parts.join(' · ');
        };
        
        if (serveInfo) serveHtml = `<div class="text-xs text-slate-600 mb-0.5">${renderBadge(serveInfo.nguoi_thuc_hien)}<span class="font-bold w-6 inline-block align-middle">1</span> <span class="align-middle">${renderAttr(serveInfo)}</span></div>`;
        else serveHtml = `<div class="text-[10px] text-slate-400 mb-0.5 italic"><span class="font-bold w-6 inline-block not-italic text-slate-400 ml-[28px] align-middle">1</span> <span class="align-middle">Không ghi nhận</span></div>`;
        
        if (sn2) n2Html = `<div class="text-xs text-slate-600 mb-0.5">${renderBadge(sn2.nguoi_thuc_hien)}<span class="font-bold w-6 inline-block align-middle">N-2</span> <span class="align-middle">${renderAttr(sn2)}</span></div>`;
        else n2Html = `<div class="text-[10px] text-slate-400 mb-0.5 italic"><span class="font-bold w-6 inline-block not-italic text-slate-400 ml-[28px] align-middle">N-2</span> <span class="align-middle">Không ghi nhận</span></div>`;
        
        if (sn1) n1Html = `<div class="text-xs text-slate-600 mb-0.5">${renderBadge(sn1.nguoi_thuc_hien)}<span class="font-bold w-6 inline-block align-middle">N-1</span> <span class="align-middle">${renderAttr(sn1)}</span></div>`;
        else n1Html = `<div class="text-[10px] text-slate-400 mb-0.5 italic"><span class="font-bold w-6 inline-block not-italic text-slate-400 ml-[28px] align-middle">N-1</span> <span class="align-middle">Không ghi nhận</span></div>`;
        
        if (sn0) {
            let resIcon = '';
            if (sn0.tinh_chat === 'winner') resIcon = '<span class="text-success font-bold">✓ Winner</span>';
            else if (sn0.tinh_chat === 'unforced_error') resIcon = '<span class="text-danger font-bold">✕ Lỗi tự đánh hỏng</span>';
            else if (sn0.tinh_chat === 'forced_error') resIcon = '<span class="text-danger font-bold">✕ Lỗi bị ép hỏng</span>';
            
            if ((sn0.tinh_chat === 'unforced_error' || sn0.tinh_chat === 'forced_error') && sn0.dac_tinh?.vi_tri_hong) {
                resIcon += ` <span class="text-danger font-medium text-[10px]">(${dict.thuoc_tinh_loi?.vi_tri_hong?.[sn0.dac_tinh.vi_tri_hong] || sn0.dac_tinh.vi_tri_hong})</span>`;
            }
            
            n0Html = `<div class="text-xs text-slate-800 mb-0.5">${renderBadge(sn0.nguoi_thuc_hien)}<span class="font-bold w-6 inline-block text-primary align-middle">N</span> <span class="align-middle">${renderAttr(sn0)} ${resIcon ? '· ' + resIcon : ''}</span></div>`;
        }
        
        
        if (isExpanded) {
            const renderExpandedAttr = (title, s) => {
                if (!s) return `<div class="text-sm text-slate-400 italic mb-2"><span class="font-bold w-12 inline-block not-italic text-slate-400">${title}</span> Không ghi nhận</div>`;
                let parts = [];
                if(s.ky_thuat) parts.push(`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Kỹ thuật</span><span class="font-bold">${getTechName(s.ky_thuat)}</span></div>`);
                if(s.dac_tinh?.diem_roi_ngang) parts.push(`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Điểm rơi ngang</span><span class="font-bold">${dict.thuoc_tinh_bong?.diem_roi_ngang?.[s.dac_tinh.diem_roi_ngang] || s.dac_tinh.diem_roi_ngang}</span></div>`);
                if(s.dac_tinh?.do_dai) parts.push(`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Độ dài</span><span class="font-bold">${dict.thuoc_tinh_bong?.do_dai?.[s.dac_tinh.do_dai] || s.dac_tinh.do_dai}</span></div>`);
                if(s.dac_tinh?.do_xoay) parts.push(`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Độ xoáy</span><span class="font-bold">${dict.thuoc_tinh_bong?.do_xoay?.[s.dac_tinh.do_xoay] || s.dac_tinh.do_xoay}</span></div>`);
                if(s.tinh_chat) {
                    let resIcon = s.tinh_chat === 'winner' ? 'Điểm trực tiếp (Winner)' : (s.tinh_chat === 'unforced_error' ? 'Lỗi tự đánh hỏng' : 'Lỗi bị ép hỏng');
                    parts.push(`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Kết quả N</span><span class="font-bold ${s.tinh_chat==='winner'?'text-success':'text-danger'}">${resIcon}</span></div>`);
                }
                if(s.dac_tinh?.vi_tri_hong) {
                    parts.push(`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Vị trí hỏng</span><span class="font-bold text-danger">${dict.thuoc_tinh_loi?.vi_tri_hong?.[s.dac_tinh.vi_tri_hong] || s.dac_tinh.vi_tri_hong}</span></div>`);
                }
                return `<div class="mb-3 bg-white p-3 rounded shadow-sm border border-slate-200">
                    <h4 class="font-black text-slate-700 text-xs mb-2 uppercase border-b pb-1">${title} <span class="font-normal text-slate-500 normal-case ml-2">${s.nguoi_thuc_hien || ''}</span></h4>
                    ${parts.join('')}
                </div>`;
            };
            return `
                <div class="mt-3 pt-3 border-t border-slate-200">
                    ${renderExpandedAttr('Khởi nguồn (Giao bóng)', pt.khoi_nguon_giao_bong)}
                    ${renderExpandedAttr('N-2 (Tạo lợi thế)', sn2)}
                    ${renderExpandedAttr('N-1 (Đáp trả)', sn1)}
                    ${renderExpandedAttr('N (Kết thúc)', sn0)}
                </div>
            `;
        }

        return `
            <div class="mt-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                ${serveHtml}
                ${n2Html}
                ${n1Html}
                ${n0Html}
            </div>
        `;
    };


    let timelineHtml = `<div class="relative py-4">`;
    // Central line for desktop
    timelineHtml += `<div class="absolute left-1/2 top-4 bottom-4 w-0.5 bg-slate-200 -translate-x-1/2 z-0 hidden md:block"></div>`;
    
    if (!game.danh_sach_diem || game.danh_sach_diem.length === 0) {
        timelineHtml += `<div class="text-center py-10 bg-slate-50 border border-dashed rounded-xl text-slate-500 font-medium">Chưa có dữ liệu.</div>`;
    } else {
        
        const filteredPoints = game.danh_sach_diem.filter(pt => {
            const server = pt.khoi_nguon_giao_bong?.nguoi_thuc_hien || p1;
            const f = state.timelineFilter || 'all';
            if (f === 'me_serve') return server === p1;
            if (f === 'opp_serve') return server !== p1;
            if (f === 'me_win') return pt.nguoi_ghi_diem === p1;
            if (f === 'opp_win') return pt.nguoi_ghi_diem !== p1;
            return true;
        });
        
        if (filteredPoints.length === 0) {
            timelineHtml += `<div class="text-center py-10 bg-slate-50 border border-dashed rounded-xl text-slate-500 font-medium">Không có dữ liệu phù hợp với bộ lọc.</div>`;
        }
        
        filteredPoints.forEach((pt, filteredIdx) => {
            const idx = game.danh_sach_diem.indexOf(pt);

            const server = pt.khoi_nguon_giao_bong?.nguoi_thuc_hien || p1; // fallback
            const isServerP1 = server === p1;
            
            const alignClass = isServerP1 ? 'md:items-end md:text-right md:mr-auto' : 'md:items-start md:text-left md:ml-auto';
            const textBgClass = pt.nguoi_ghi_diem === p1 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-800';
            const winnerText = pt.nguoi_ghi_diem === p1 ? 'Tôi thắng' : 'Đối thủ thắng';
            
            timelineHtml += `
            <div class="relative z-10 w-full md:w-[calc(50%-1.5rem)] flex flex-col mb-4 ${alignClass}">
                <div class="bg-white p-4 rounded-xl border shadow-sm w-full transition group relative text-left cursor-pointer hover:shadow-md hover:border-blue-300" onclick="window.app.actions.timeline.toggleExpand(${idx})">
                    <div class="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                        <div class="flex gap-2 items-center">
                            <span class="w-8 h-8 flex items-center justify-center bg-slate-800 text-white font-black rounded-lg shadow-sm">#${pt.thu_tu_diem}</span>
                            <div>
                                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tỷ số</div>
                                <div class="text-lg font-black font-mono leading-none ${pt.nguoi_ghi_diem === p1 ? 'text-blue-600' : 'text-red-600'}">${pt.ty_so_hien_tai}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-bold text-slate-500 uppercase">Giao: ${server === p1 ? 'Tôi' : 'Đối thủ'}</div>
                            <div class="text-[10px] font-bold text-slate-400">Đỡ: ${server === p1 ? 'Đối thủ' : 'Tôi'}</div>
                            <div class="text-[10px] font-black px-1.5 py-0.5 mt-1 rounded border ${textBgClass} inline-block">${winnerText}</div>
                        </div>
                    </div>
                    ${renderCompactPoint(pt, state.timelineExpandedIdx === idx)}
                    <div class="mt-2 pt-2 border-t border-slate-100 flex gap-2 justify-end">
                        <button onclick="event.stopPropagation(); window.app.actions.rally.editRally(${idx}); window.app.navigate('rallyEntry', {selectedMatchId: '${match.id_tran_dau}', selectedGameId: '${state.selectedGameId}'})" class="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100 transition">✏ Sửa</button>
                        <button onclick="event.stopPropagation(); window.app.actions.rally.deleteRally(${idx})" class="px-3 py-1 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-100 transition">🗑 Xóa</button>
                    </div>
                </div>
            </div>
            `;
        });
    }
    timelineHtml += `</div>`;
    timelineHtml += `
        <div class="mt-8 mb-20 text-center">
            <button onclick="window.app.navigate('rallyEntry', {selectedMatchId: '${match.id_tran_dau}', selectedGameId: '${state.selectedGameId}'})" class="px-8 py-4 bg-primary text-white font-black text-lg rounded-2xl shadow-lg hover:shadow-xl hover:bg-primary-hover hover:-translate-y-1 transition transform flex items-center gap-3 mx-auto">
                <i data-lucide="plus-circle" class="w-6 h-6"></i> NHẬP ĐIỂM MỚI
            </button>
        </div>
    `;

    
    return `
    <div class="flex flex-col h-full bg-slate-100">
        <div class="bg-white p-4 shadow-sm flex items-center justify-between z-20 sticky top-0 border-b">
            <button onclick="window.app.navigate('matchList')" class="p-2 text-slate-500 hover:text-slate-800 transition flex items-center gap-1"><i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại</button>
            <h2 class="font-black text-slate-800 text-lg hidden sm:block">TIMELINE TRẬN ĐẤU</h2>
            <div class="flex gap-3 items-center">
                <button onclick="window.app.navigate('matchDetail', {selectedMatchId: '${match.id_tran_dau}'})" class="hidden md:flex px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm items-center gap-1.5 transition">
                    <i data-lucide="settings" class="w-4 h-4"></i> Cấu hình
                </button>
                <div class="font-bold font-mono text-xl text-primary bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                    ${game.ty_so_chung_cuoc || '0-0'}
                </div>
            </div>
        </div>
        
        <div class="p-4 md:p-6 overflow-y-auto flex-1">
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div class="text-sm font-bold text-slate-500">TÔI</div>
                        <div class="text-lg font-black text-slate-800">${p1}</div>
                    </div>
                    <div class="text-2xl font-black text-slate-300 hidden md:block">VS</div>
                    <div class="md:text-right">
                        <div class="text-sm font-bold text-slate-500">ĐỐI THỦ</div>
                        <div class="text-lg font-black text-slate-800">${p2}</div>
                    </div>
                </div>
                
                ${gamesHtml}
                
                <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                    <button onclick="window.app.actions.timeline.setFilter('all')" class="px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition ${(!state.timelineFilter || state.timelineFilter === 'all') ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border'}">Tất cả</button>
                    <button onclick="window.app.actions.timeline.setFilter('me_serve')" class="px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition ${state.timelineFilter === 'me_serve' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border'}">Tôi giao</button>
                    <button onclick="window.app.actions.timeline.setFilter('opp_serve')" class="px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition ${state.timelineFilter === 'opp_serve' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border'}">Đối thủ giao</button>
                    <button onclick="window.app.actions.timeline.setFilter('me_win')" class="px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition ${state.timelineFilter === 'me_win' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border'}">Tôi thắng</button>
                    <button onclick="window.app.actions.timeline.setFilter('opp_win')" class="px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition ${state.timelineFilter === 'opp_win' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border'}">Tôi thua</button>
                </div>

                
                <div class="flex justify-between items-center mb-2 px-1">
                    <div class="text-sm font-bold text-slate-500 uppercase tracking-wider hidden md:block w-1/2">Phía ${p1} (Tôi)</div>
                    <div class="text-sm font-bold text-slate-500 uppercase tracking-wider hidden md:block w-1/2 text-right">Phía ${p2} (Đối thủ)</div>
                </div>
                
                ${timelineHtml}
            </div>
        </div>
        
        <button onclick="window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})" class="fixed bottom-6 right-6 w-12 h-12 bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-700 transition z-50">
            <i data-lucide="arrow-down" class="w-5 h-5"></i>
        </button>
    </div>
    `;
}
