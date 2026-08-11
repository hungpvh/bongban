import { state, setState, showToast } from '../store.js';
import { saveData } from '../api.js';
import { calculateServerForPoint, recalculateGame } from '../logic.js';

let isAddingPoint = false;
let editingPointIndex = -1;
let formDirection = 'xuoi'; 
let softWarning = null;

const defaultStroke = () => ({
    nguoi_thuc_hien: '',
    ky_thuat: '',
    diem_roi_ngang: null,
    do_dai: null,
    do_xoay: null,
    vi_tri_hong: null,
    tinh_chat: ''
});

let fd = {
    tong_so_cham: 3,
    khoi_nguon: defaultStroke(),
    N_2: defaultStroke(),
    N_1: defaultStroke(),
    N: defaultStroke()
};

function initFormData(game, p1, p2) {
    let [startP1, startP2] = (game.ty_so_bat_dau || '0-0').split('-').map(Number);
    let currentP1 = isNaN(startP1) ? 0 : startP1;
    let currentP2 = isNaN(startP2) ? 0 : startP2;
    
    (game.danh_sach_diem || []).forEach(pt => {
        if (pt.nguoi_ghi_diem === p1) currentP1++;
        if (pt.nguoi_ghi_diem === p2) currentP2++;
    });
    
    const server = calculateServerForPoint(currentP1 + currentP2, game.nguoi_giao_bong_truoc, p1, p2);
    
    fd = {
        tong_so_cham: 3,
        khoi_nguon: defaultStroke(),
        N_2: defaultStroke(),
        N_1: defaultStroke(),
        N: defaultStroke()
    };
    fd.khoi_nguon.nguoi_thuc_hien = server;
    fd.N.tinh_chat = 'winner';
    applyAlternationDefaults(p1, p2);
}

function applyAlternationDefaults(p1, p2) {
    const server = fd.khoi_nguon.nguoi_thuc_hien;
    const receiver = server === p1 ? p2 : p1;
    const touches = fd.tong_so_cham;
    
    const getPlayerForTouch = (t) => {
        if (t <= 0) return '';
        return t % 2 === 1 ? server : receiver;
    };
    
    if (touches >= 4 && !fd.N_2.nguoi_thuc_hien) fd.N_2.nguoi_thuc_hien = getPlayerForTouch(touches - 2);
    if (touches >= 3 && !fd.N_1.nguoi_thuc_hien) fd.N_1.nguoi_thuc_hien = getPlayerForTouch(touches - 1);
    if (touches >= 1 && !fd.N.nguoi_thuc_hien) fd.N.nguoi_thuc_hien = getPlayerForTouch(touches);
}

function checkAlternation() {
    softWarning = null;
    let n2 = fd.tong_so_cham >= 4 ? fd.N_2.nguoi_thuc_hien : null;
    let n1 = fd.tong_so_cham >= 3 ? fd.N_1.nguoi_thuc_hien : null;
    let n = fd.tong_so_cham >= 1 ? fd.N.nguoi_thuc_hien : null;
    
    if (n2 && n1 && n2 === n1) softWarning = "Cảnh báo mềm: N-2 và N-1 cùng một người đánh.";
    else if (n1 && n && n1 === n) softWarning = "Cảnh báo mềm: N-1 và N cùng một người đánh.";
    else if (n2 && n && n2 !== n) softWarning = "Cảnh báo mềm: N-2 và N nên cùng một người đánh (đánh luân phiên).";
}

function renderGrid(strokeType, receiver, p1, p2, currentNgang, currentDai) {
    const isP1 = receiver === p1;
    const topLabel = isP1 ? 'NGẮN' : 'DÀI';
    const bottomLabel = isP1 ? 'DÀI' : 'NGẮN';
    const leftLabel = isP1 ? 'TRÁI' : 'PHẢI';
    const rightLabel = isP1 ? 'PHẢI' : 'TRÁI';
    
    const map = isP1 
        ? [[{n:'trai',d:'ngan'}, {n:'giua',d:'ngan'}, {n:'phai',d:'ngan'}],
           [{n:'trai',d:'dai'}, {n:'giua',d:'dai'}, {n:'phai',d:'dai'}]]
        : [[{n:'phai',d:'dai'}, {n:'giua',d:'dai'}, {n:'trai',d:'dai'}],
           [{n:'phai',d:'ngan'}, {n:'giua',d:'ngan'}, {n:'trai',d:'ngan'}]];
           
    let html = `<div class="mt-2 mb-1 p-2 bg-slate-50 border rounded-lg">
        <div class="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">Góc nhìn người đỡ: ${receiver}</div>
        <div class="flex flex-col gap-1">`;
        
    for(let r=0; r<2; r++) {
        html += `<div class="flex gap-1 relative">`;
        html += `<div class="absolute -left-5 top-0 bottom-0 flex items-center justify-center text-[10px] font-bold text-slate-400 -rotate-180" style="writing-mode: vertical-rl">${r===0 ? topLabel : bottomLabel}</div>`;
        for(let c=0; c<3; c++) {
            const cell = map[r][c];
            const isSelected = currentNgang === cell.n && currentDai === cell.d;
            const bg = isSelected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50';
            const colLabel = r===0 ? (c===0 ? leftLabel : (c===1 ? 'GIỮA' : rightLabel)) : '';
            
            html += `<button type="button" onclick="window.app.actions.rallyEntry.updateGrid('${strokeType}', '${cell.n}', '${cell.d}')" class="flex-1 h-12 flex flex-col items-center justify-center border rounded ${bg} transition relative">
                ${colLabel ? `<span class="text-[9px] font-bold opacity-70 absolute top-1">${colLabel}</span>` : ''}
                ${isSelected ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
            </button>`;
        }
        html += `</div>`;
    }
    html += `</div>
    <div class="flex justify-end mt-1">
        <button type="button" onclick="window.app.actions.rallyEntry.updateGrid('${strokeType}', null, null)" class="text-[11px] font-bold text-slate-400 hover:text-slate-600">Bỏ qua / Xóa điểm rơi</button>
    </div>
    </div>`;
    return html;
}

function renderStrokeBlock(title, strokeType, data, p1, p2, isN = false, tongSoCham = 0) {
    if (!data) return '';
    
    if (tongSoCham === 1 && strokeType === 'N') {
        const tinhChatOpts = `
            <option value="winner" ${data.tinh_chat==='winner'?'selected':''}>Điểm trực tiếp</option>
            <option value="unforced_error" ${data.tinh_chat==='unforced_error'?'selected':''}>Lỗi tự đánh hỏng</option>
        `;
        
        let errorLocationHtml = '';
        if (data.tinh_chat === 'unforced_error') {
            const locOpts = Object.entries(state.dictionary?.thuoc_tinh_loi?.vi_tri_hong || {})
                .map(([k,v]) => `<option value="${k}" ${data.vi_tri_hong===k?'selected':''}>${v}</option>`).join('');
            errorLocationHtml = `
            <div class="mt-2">
                <label class="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Vị trí hỏng</label>
                <select onchange="window.app.actions.rallyEntry.updateStroke('${strokeType}', 'vi_tri_hong', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg text-sm">
                    <option value="">-- Chọn --</option>
                    ${locOpts}
                </select>
            </div>`;
        }

        return `
        <div class="bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm">
            <h4 class="text-sm font-black text-slate-800 mb-3 flex items-center gap-2"><i data-lucide="target" class="w-4 h-4 text-primary"></i> KẾT QUẢ GIAO BÓNG</h4>
            <select onchange="window.app.actions.rallyEntry.updateStroke('${strokeType}', 'tinh_chat', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-bold text-sm text-primary">
                ${tinhChatOpts}
            </select>
            ${errorLocationHtml}
        </div>
        `;
    }

    const dict = state.dictionary || {};
    
    let pOpts = `
        <option value="">-- Bỏ qua / Không xác định --</option>
        <option value="${p1}" ${data.nguoi_thuc_hien===p1?'selected':''}>${p1} (Tôi)</option>
        <option value="${p2}" ${data.nguoi_thuc_hien===p2?'selected':''}>${p2} (Đối thủ)</option>
    `;
    let nguoiThucHienHtml = `
        <div class="mb-3">
            <label class="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Người thực hiện</label>
            <select onchange="window.app.actions.rallyEntry.updateStroke('${strokeType}', 'nguoi_thuc_hien', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg text-sm font-bold text-slate-700">
                ${pOpts}
            </select>
        </div>
    `;

    const techOpts = Object.entries(dict.ky_thuat || {})
        .map(([k,v]) => `<option value="${k}" ${data.ky_thuat===k?'selected':''}>${v}</option>`).join('');
        
    let techHtml = `
        <div class="mb-3">
            <label class="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Kỹ thuật</label>
            <select onchange="window.app.actions.rallyEntry.updateStroke('${strokeType}', 'ky_thuat', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg text-sm">
                <option value="">-- Bỏ qua --</option>
                ${techOpts}
            </select>
        </div>
    `;
    
    const xoayOpts = Object.entries(dict.thuoc_tinh_bong?.do_xoay || {});
    let xoayHtml = '';
    if (xoayOpts.length > 0) {
        xoayHtml = `<div class="mb-3">
            <label class="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Độ xoáy</label>
            <div class="flex bg-slate-100 p-1 rounded-lg gap-1">
                <button type="button" onclick="window.app.actions.rallyEntry.updateStroke('${strokeType}', 'do_xoay', null)" class="flex-1 text-xs py-1.5 rounded font-medium ${!data.do_xoay ? 'bg-white shadow-sm text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}">--</button>
                ${xoayOpts.map(([k,v]) => `
                    <button type="button" onclick="window.app.actions.rallyEntry.updateStroke('${strokeType}', 'do_xoay', '${k}')" class="flex-1 text-xs py-1.5 rounded font-medium ${data.do_xoay === k ? 'bg-white shadow-sm text-primary font-bold' : 'text-slate-500 hover:text-slate-700'}">${v}</button>
                `).join('')}
            </div>
        </div>`;
    }
    
    const receiver = data.nguoi_thuc_hien === p1 ? p2 : (data.nguoi_thuc_hien === p2 ? p1 : p1); 
    const gridHtml = renderGrid(strokeType, receiver, p1, p2, data.diem_roi_ngang, data.do_dai);

    let nExtras = '';
    if (isN) {
        const tinhChatOptsAll = Object.entries(dict.tinh_chat_ket_thuc || {})
            .map(([k,v]) => `<option value="${k}" ${data.tinh_chat===k?'selected':''}>${v}</option>`).join('');
            
        let errorLocationHtml = '';
        if (data.tinh_chat === 'unforced_error' || data.tinh_chat === 'forced_error') {
            const locOpts = Object.entries(dict.thuoc_tinh_loi?.vi_tri_hong || {})
                .map(([k,v]) => `<option value="${k}" ${data.vi_tri_hong===k?'selected':''}>${v}</option>`).join('');
            errorLocationHtml = `
            <div class="mt-3 pt-3 border-t">
                <label class="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Vị trí hỏng</label>
                <select onchange="window.app.actions.rallyEntry.updateStroke('${strokeType}', 'vi_tri_hong', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg text-sm">
                    <option value="">-- Chọn --</option>
                    ${locOpts}
                </select>
            </div>`;
        }
        
        nExtras = `
        <div class="mt-4 pt-4 border-t-2 border-dashed border-slate-200">
            <h5 class="text-[11px] font-bold text-slate-500 mb-2 uppercase">Kết quả pha bóng</h5>
            <select onchange="window.app.actions.rallyEntry.updateStroke('${strokeType}', 'tinh_chat', this.value)" class="w-full p-2 bg-primary/10 border-primary/30 border rounded-lg text-sm font-bold text-primary">
                ${tinhChatOptsAll}
            </select>
            ${errorLocationHtml}
        </div>
        `;
    }

    const icon = strokeType === 'khoi_nguon' ? 'play-circle' : 'activity';
    const color = strokeType === 'N' ? 'text-danger' : 'text-primary';

    return `
    <div class="bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm relative overflow-hidden group transition hover:border-primary/30">
        <div class="absolute left-0 top-0 bottom-0 w-1 ${strokeType === 'N' ? 'bg-danger' : (strokeType === 'khoi_nguon' ? 'bg-primary' : 'bg-slate-300')}"></div>
        <h4 class="text-sm font-black text-slate-800 mb-3 flex items-center gap-2 pl-2"><i data-lucide="${icon}" class="w-4 h-4 ${color}"></i> ${title}</h4>
        ${nguoiThucHienHtml}
        ${techHtml}
        ${xoayHtml}
        ${gridHtml}
        ${nExtras}
    </div>
    `;
}

function renderCompactTimeline(game, p1, p2, dict) {
    if (!game.danh_sach_diem || game.danh_sach_diem.length === 0) {
        return `<div class="text-center py-10 bg-slate-50 border border-dashed rounded-xl text-slate-500 font-medium">Chưa có dữ liệu rally cho game này.</div>`;
    }
    
    let html = `<div class="flex flex-col gap-4 relative">`;
    html += `<div class="absolute left-1/2 top-4 bottom-4 w-0.5 bg-slate-200 -translate-x-1/2 z-0 hidden md:block"></div>`;
    
    game.danh_sach_diem.forEach((pt, idx) => {
        const isServerP1 = pt.khoi_nguon_giao_bong?.nguoi_thuc_hien === p1;
        
        const serveText = `${pt.khoi_nguon_giao_bong?.nguoi_thuc_hien === p1 ? 'Tôi' : pt.khoi_nguon_giao_bong?.nguoi_thuc_hien} ➔ ${pt.khoi_nguon_giao_bong?.nguoi_thuc_hien === p1 ? p2 : p1}`;
        
        const getTechName = (k) => dict.ky_thuat?.[k] || k;
        const getResultIcon = (r) => {
            if (r === 'winner') return `<span class="text-success font-black">✓</span>`;
            if (r === 'unforced_error' || r === 'forced_error') return `<span class="text-danger font-black">✕</span>`;
            return '';
        };
        const getScoreColor = (scoreStr) => {
            if(!scoreStr) return 'text-slate-800';
            const [s1, s2] = scoreStr.split('-').map(Number);
            if (s1 > s2) return 'text-success';
            if (s1 < s2) return 'text-danger';
            return 'text-slate-800';
        };

        let detailsHtml = `<div class="text-xs text-slate-600 mt-2 space-y-1">`;
        
        const s = pt.khoi_nguon_giao_bong;
        if(s) {
            let parts = ['Giao bóng'];
            if(s.ky_thuat) parts.push(getTechName(s.ky_thuat));
            if(s.dac_tinh?.do_xoay) parts.push(dict.thuoc_tinh_bong?.do_xoay?.[s.dac_tinh.do_xoay] || s.dac_tinh.do_xoay);
            if(s.dac_tinh?.diem_roi_ngang) parts.push(`📍 ${dict.thuoc_tinh_bong?.diem_roi_ngang?.[s.dac_tinh.diem_roi_ngang] || s.dac_tinh.diem_roi_ngang}`);
            if(s.dac_tinh?.do_dai) parts.push(dict.thuoc_tinh_bong?.do_dai?.[s.dac_tinh.do_dai] || s.dac_tinh.do_dai);
            detailsHtml += `<div>🏓 <span class="font-bold">${s.nguoi_thuc_hien === p1 ? 'Tôi' : s.nguoi_thuc_hien}</span>: ${parts.join(' · ')}</div>`;
        }
        
        if(pt.cu_tao_loi_the_N_2) {
            const sn2 = pt.cu_tao_loi_the_N_2;
            let parts = [];
            if(sn2.ky_thuat) parts.push(getTechName(sn2.ky_thuat));
            if(sn2.dac_tinh?.diem_roi_ngang) parts.push(`📍 ${dict.thuoc_tinh_bong?.diem_roi_ngang?.[sn2.dac_tinh.diem_roi_ngang] || sn2.dac_tinh.diem_roi_ngang}`);
            detailsHtml += `<div>N-2 <span class="font-bold">${sn2.nguoi_thuc_hien === p1 ? 'Tôi' : (sn2.nguoi_thuc_hien||'?')}</span>: ${parts.join(' · ')}</div>`;
        }
        
        if(pt.cu_dap_tra_N_1) {
            const sn1 = pt.cu_dap_tra_N_1;
            let parts = [];
            if(sn1.ky_thuat) parts.push(getTechName(sn1.ky_thuat));
            if(sn1.dac_tinh?.diem_roi_ngang) parts.push(`📍 ${dict.thuoc_tinh_bong?.diem_roi_ngang?.[sn1.dac_tinh.diem_roi_ngang] || sn1.dac_tinh.diem_roi_ngang}`);
            detailsHtml += `<div>N-1 <span class="font-bold">${sn1.nguoi_thuc_hien === p1 ? 'Tôi' : (sn1.nguoi_thuc_hien||'?')}</span>: ${parts.join(' · ')}</div>`;
        }
        
        if(pt.cu_ket_thuc_N) {
            const sn = pt.cu_ket_thuc_N;
            let parts = [];
            if(sn.ky_thuat) parts.push(getTechName(sn.ky_thuat));
            if(sn.dac_tinh?.diem_roi_ngang) parts.push(`📍 ${dict.thuoc_tinh_bong?.diem_roi_ngang?.[sn.dac_tinh.diem_roi_ngang] || sn.dac_tinh.diem_roi_ngang}`);
            
            let resStr = getResultIcon(sn.tinh_chat);
            if(sn.tinh_chat === 'unforced_error' || sn.tinh_chat === 'forced_error') {
                if(sn.dac_tinh?.vi_tri_hong) resStr += ` (${dict.thuoc_tinh_loi?.vi_tri_hong?.[sn.dac_tinh.vi_tri_hong] || sn.dac_tinh.vi_tri_hong})`;
            }
            
            detailsHtml += `<div class="mt-1 pt-1 border-t border-slate-100">N <span class="font-bold">${sn.nguoi_thuc_hien === p1 ? 'Tôi' : (sn.nguoi_thuc_hien||'?')}</span>: ${parts.join(' · ')} ${resStr}</div>`;
        }
        detailsHtml += `</div>`;
        
        const alignClass = isServerP1 ? 'md:items-end md:text-right md:mr-auto' : 'md:items-start md:text-left md:ml-auto';
        const bgClass = pt.loai_diem === 'thang' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700';
        
        html += `
        <div class="relative z-10 w-full md:w-[calc(50%-1.5rem)] flex flex-col ${alignClass}">
            <div class="bg-white p-4 rounded-xl border shadow-sm w-full hover:shadow-md transition cursor-pointer group" onclick="if(!event.target.closest('button')) window.app.actions.rallyEntry.editPoint(${idx})">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-black rounded uppercase tracking-wider">#${pt.thu_tu_diem}</span>
                        <span class="text-xs font-bold text-slate-500">${serveText}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-medium text-slate-400">${pt.tong_so_cham} chạm</span>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="event.stopPropagation(); window.app.actions.rallyEntry.confirmDelete(${idx})" class="p-1 text-slate-400 hover:text-danger rounded bg-slate-50 hover:bg-red-50"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-between gap-4 mt-2 border-b border-slate-50 pb-2 mb-2">
                    <div class="text-2xl font-black font-mono tracking-tighter ${getScoreColor(pt.ty_so_hien_tai)}">${pt.ty_so_hien_tai}</div>
                    <div class="px-2 py-1 ${bgClass} text-xs font-bold rounded-md border">${pt.nguoi_ghi_diem === p1 ? 'Tôi ghi điểm' : 'Đối thủ ghi điểm'}</div>
                </div>
                ${detailsHtml}
            </div>
        </div>
        `;
    });
    html += `</div>`;
    return html;
}

window.app = window.app || {};
window.app.actions = window.app.actions || {};
window.app.actions.rallyEntry = {
    goBack: () => {
        setState({ view: 'matchDetail' });
    },
    toggleAddPoint: () => {
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        const g = m?.chi_tiet_game?.find(x => x.id_game === state.selectedGameId || x.game_so.toString() === state.selectedGameId.toString());
        if (!m || !g) return;
        
        isAddingPoint = true;
        editingPointIndex = -1;
        initFormData(g, m.thong_tin.doi_thu_1, m.thong_tin.doi_thu_2);
        checkAlternation();
        window.app.render();
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
    },
    editPoint: (idx) => {
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        const g = m?.chi_tiet_game?.find(x => x.id_game === state.selectedGameId || x.game_so.toString() === state.selectedGameId.toString());
        if (!g || !g.danh_sach_diem[idx]) return;
        
        isAddingPoint = true;
        editingPointIndex = idx;
        const pt = g.danh_sach_diem[idx];
        
        fd = {
            tong_so_cham: pt.tong_so_cham,
            khoi_nguon: {
                nguoi_thuc_hien: pt.khoi_nguon_giao_bong?.nguoi_thuc_hien || '',
                ky_thuat: pt.khoi_nguon_giao_bong?.ky_thuat || '',
                diem_roi_ngang: pt.khoi_nguon_giao_bong?.dac_tinh?.diem_roi_ngang || null,
                do_dai: pt.khoi_nguon_giao_bong?.dac_tinh?.do_dai || null,
                do_xoay: pt.khoi_nguon_giao_bong?.dac_tinh?.do_xoay || null,
                vi_tri_hong: pt.khoi_nguon_giao_bong?.dac_tinh?.vi_tri_hong || null
            },
            N_2: {
                nguoi_thuc_hien: pt.cu_tao_loi_the_N_2?.nguoi_thuc_hien || '',
                ky_thuat: pt.cu_tao_loi_the_N_2?.ky_thuat || '',
                diem_roi_ngang: pt.cu_tao_loi_the_N_2?.dac_tinh?.diem_roi_ngang || null,
                do_dai: pt.cu_tao_loi_the_N_2?.dac_tinh?.do_dai || null,
                do_xoay: pt.cu_tao_loi_the_N_2?.dac_tinh?.do_xoay || null,
                vi_tri_hong: pt.cu_tao_loi_the_N_2?.dac_tinh?.vi_tri_hong || null
            },
            N_1: {
                nguoi_thuc_hien: pt.cu_dap_tra_N_1?.nguoi_thuc_hien || '',
                ky_thuat: pt.cu_dap_tra_N_1?.ky_thuat || '',
                diem_roi_ngang: pt.cu_dap_tra_N_1?.dac_tinh?.diem_roi_ngang || null,
                do_dai: pt.cu_dap_tra_N_1?.dac_tinh?.do_dai || null,
                do_xoay: pt.cu_dap_tra_N_1?.dac_tinh?.do_xoay || null,
                vi_tri_hong: pt.cu_dap_tra_N_1?.dac_tinh?.vi_tri_hong || null
            },
            N: {
                nguoi_thuc_hien: pt.cu_ket_thuc_N?.nguoi_thuc_hien || '',
                ky_thuat: pt.cu_ket_thuc_N?.ky_thuat || '',
                diem_roi_ngang: pt.cu_ket_thuc_N?.dac_tinh?.diem_roi_ngang || null,
                do_dai: pt.cu_ket_thuc_N?.dac_tinh?.do_dai || null,
                do_xoay: pt.cu_ket_thuc_N?.dac_tinh?.do_xoay || null,
                vi_tri_hong: pt.cu_ket_thuc_N?.dac_tinh?.vi_tri_hong || null,
                tinh_chat: pt.cu_ket_thuc_N?.tinh_chat || 'winner'
            }
        };
        
        checkAlternation();
        window.app.render();
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
    },
    cancelEdit: () => {
        isAddingPoint = false;
        editingPointIndex = -1;
        window.app.render();
    },
    setDirection: (dir) => {
        formDirection = dir;
        window.app.render();
    },
    updateTouches: (val) => {
        const v = parseInt(val);
        if (isNaN(v) || v < 1) return;
        fd.tong_so_cham = v;
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        applyAlternationDefaults(m.thong_tin.doi_thu_1, m.thong_tin.doi_thu_2);
        checkAlternation();
        window.app.render();
    },
    updateStroke: (strokeType, field, value) => {
        fd[strokeType][field] = value;
        if (field === 'nguoi_thuc_hien') {
            checkAlternation();
        }
        window.app.render();
    },
    updateGrid: (strokeType, ngang, dai) => {
        fd[strokeType].diem_roi_ngang = ngang;
        fd[strokeType].do_dai = dai;
        window.app.render();
    },
    savePoint: async () => {
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        const gIdx = m?.chi_tiet_game?.findIndex(x => x.id_game === state.selectedGameId || x.game_so.toString() === state.selectedGameId.toString());
        if (gIdx === -1) return;
        
        let g = m.chi_tiet_game[gIdx];
        const p1 = m.thong_tin.doi_thu_1;
        const p2 = m.thong_tin.doi_thu_2;
        
        let nguoiGhiDiem = '';
        const nNguoiThucHien = fd.N.nguoi_thuc_hien || p1;
        if (fd.N.tinh_chat === 'winner') {
            nguoiGhiDiem = nNguoiThucHien;
        } else {
            nguoiGhiDiem = nNguoiThucHien === p1 ? p2 : p1;
        }
        
        const dacTinhMap = (s) => ({
            diem_roi_ngang: s.diem_roi_ngang || null,
            do_dai: s.do_dai || null,
            do_xoay: s.do_xoay || null,
            vi_tri_hong: s.vi_tri_hong || null
        });

        const newPt = {
            thu_tu_diem: editingPointIndex > -1 ? g.danh_sach_diem[editingPointIndex].thu_tu_diem : g.danh_sach_diem.length + 1,
            ty_so_hien_tai: '0-0', 
            loai_diem: nguoiGhiDiem === p1 ? 'thang' : 'thua',
            nguoi_ghi_diem: nguoiGhiDiem,
            tong_so_cham: fd.tong_so_cham,
            khoi_nguon_giao_bong: fd.tong_so_cham >= 1 ? {
                nguoi_thuc_hien: fd.khoi_nguon.nguoi_thuc_hien,
                ky_thuat: fd.khoi_nguon.ky_thuat || null,
                dac_tinh: dacTinhMap(fd.khoi_nguon)
            } : null,
            cu_tao_loi_the_N_2: fd.tong_so_cham >= 4 ? {
                nguoi_thuc_hien: fd.N_2.nguoi_thuc_hien,
                ky_thuat: fd.N_2.ky_thuat || null,
                dac_tinh: dacTinhMap(fd.N_2)
            } : null,
            cu_dap_tra_N_1: fd.tong_so_cham >= 3 ? {
                nguoi_thuc_hien: fd.N_1.nguoi_thuc_hien,
                ky_thuat: fd.N_1.ky_thuat || null,
                dac_tinh: dacTinhMap(fd.N_1)
            } : null,
            cu_ket_thuc_N: fd.tong_so_cham >= 1 ? {
                tinh_chat: fd.N.tinh_chat,
                nguoi_thuc_hien: fd.tong_so_cham === 1 ? fd.khoi_nguon.nguoi_thuc_hien : fd.N.nguoi_thuc_hien,
                ky_thuat: fd.tong_so_cham === 1 ? fd.khoi_nguon.ky_thuat : (fd.N.ky_thuat || null),
                dac_tinh: fd.tong_so_cham === 1 ? {
                    ...dacTinhMap(fd.khoi_nguon),
                    vi_tri_hong: fd.N.vi_tri_hong || null
                } : dacTinhMap(fd.N)
            } : null
        };
        
        if (editingPointIndex > -1) {
            g.danh_sach_diem[editingPointIndex] = newPt;
        } else {
            g.danh_sach_diem.push(newPt);
        }
        
        m.chi_tiet_game[gIdx] = recalculateGame(g, p1, p2);
        
        isAddingPoint = false;
        editingPointIndex = -1;
        window.app.render();
        await saveData();
    },
    confirmDelete: (idx) => {
        if(confirm("Bạn có chắc chắn muốn xóa Rally này?")) {
            const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
            const gIdx = m?.chi_tiet_game?.findIndex(x => x.id_game === state.selectedGameId || x.game_so.toString() === state.selectedGameId.toString());
            if (gIdx === -1) return;
            
            let g = m.chi_tiet_game[gIdx];
            g.danh_sach_diem.splice(idx, 1);
            
            g.danh_sach_diem.forEach((pt, i) => { pt.thu_tu_diem = i + 1; });
            
            m.chi_tiet_game[gIdx] = recalculateGame(g, m.thong_tin.doi_thu_1, m.thong_tin.doi_thu_2);
            window.app.render();
            saveData();
        }
    },
    undoLast: () => {
        const m = state.matches.find(x => x.id_tran_dau === state.selectedMatchId);
        const gIdx = m?.chi_tiet_game?.findIndex(x => x.id_game === state.selectedGameId || x.game_so.toString() === state.selectedGameId.toString());
        if (gIdx === -1) return;
        
        let g = m.chi_tiet_game[gIdx];
        if (g.danh_sach_diem.length > 0) {
            g.danh_sach_diem.pop();
            m.chi_tiet_game[gIdx] = recalculateGame(g, m.thong_tin.doi_thu_1, m.thong_tin.doi_thu_2);
            window.app.render();
            saveData();
        }
    }
};

export function renderRallyEntry() {
    const matchId = state.selectedMatchId;
    const gameId = state.selectedGameId;
    const m = state.matches.find(x => x.id_tran_dau === matchId);
    const g = m?.chi_tiet_game?.find(x => x.id_game === gameId || x.game_so.toString() === gameId.toString());
    
    if (!m || !g) return `<div class="p-6 text-center text-slate-500">Không tìm thấy dữ liệu</div>`;

    const dict = state.dictionary || {};
    const p1 = m.thong_tin.doi_thu_1;
    const p2 = m.thong_tin.doi_thu_2;

    let html = `
    <div class="mb-4 flex items-center justify-between">
        <button onclick="window.app.actions.rallyEntry.goBack()" class="text-slate-500 hover:text-primary flex items-center gap-1 text-sm font-bold transition"><i data-lucide="arrow-left" class="w-4 h-4"></i> Trở về Game</button>
        ${g.danh_sach_diem.length > 0 && !isAddingPoint ? `<button onclick="window.app.actions.rallyEntry.undoLast()" class="text-slate-400 hover:text-amber-600 flex items-center gap-1 text-xs font-bold transition bg-white px-2 py-1 rounded border shadow-sm"><i data-lucide="undo-2" class="w-3 h-3"></i> Hoàn tác Rally cuối</button>` : ''}
    </div>
    
    <div class="bg-white p-5 rounded-2xl border shadow-sm mb-6 sticky top-[60px] z-30 flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700 text-xl border-2 border-white shadow-sm shrink-0">#${g.game_so}</div>
            <div>
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tỷ số hiện tại</div>
                <div class="text-2xl font-black font-mono tracking-tighter text-slate-800">${g.ty_so_chung_cuoc || '0-0'}</div>
            </div>
        </div>
        <div class="text-right">
            ${!isAddingPoint ? `<button onclick="window.app.actions.rallyEntry.toggleAddPoint()" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-2"><i data-lucide="plus" class="w-5 h-5"></i> Thêm Rally</button>` : ''}
        </div>
    </div>
    `;

    html += renderCompactTimeline(g, p1, p2, dict);

    if (isAddingPoint) {
        let warningHtml = '';
        if (softWarning) {
            warningHtml = `<div class="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-2"><i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i> ${softWarning}</div>`;
        }

        const dirTabs = `
        <div class="flex bg-slate-100 p-1 rounded-lg mb-4">
            <button onclick="window.app.actions.rallyEntry.setDirection('xuoi')" class="flex-1 py-2 text-sm font-bold rounded-md transition ${formDirection==='xuoi' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}">Nhập Xuôi (N-2 ➔ N)</button>
            <button onclick="window.app.actions.rallyEntry.setDirection('nguoc')" class="flex-1 py-2 text-sm font-bold rounded-md transition ${formDirection==='nguoc' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}">Nhập Ngược (N ➔ N-2)</button>
        </div>
        `;

        const chamHtml = `
        <div class="mb-4 p-4 bg-white border rounded-xl shadow-sm flex items-center justify-between">
            <label class="text-sm font-bold text-slate-700">Tổng số chạm trong Rally</label>
            <input type="number" min="1" value="${fd.tong_so_cham}" onchange="window.app.actions.rallyEntry.updateTouches(this.value)" class="w-20 p-2 border rounded-lg text-center font-black text-lg bg-slate-50 text-slate-800">
        </div>
        `;
        
        let blocks = [];
        blocks.push(renderStrokeBlock('KHỞI NGUỒN (GIAO BÓNG)', 'khoi_nguon', fd.khoi_nguon, p1, p2, false, fd.tong_so_cham));
        
        const bN2 = fd.tong_so_cham >= 4 ? renderStrokeBlock('N-2 (Áp chót 2)', 'N_2', fd.N_2, p1, p2, false, fd.tong_so_cham) : '';
        const bN1 = fd.tong_so_cham >= 3 ? renderStrokeBlock('N-1 (Áp chót)', 'N_1', fd.N_1, p1, p2, false, fd.tong_so_cham) : '';
        const bN  = fd.tong_so_cham >= 1 ? renderStrokeBlock('N (Kết thúc)', 'N', fd.N, p1, p2, true, fd.tong_so_cham) : '';
        
        if (formDirection === 'xuoi') {
            if (bN2) blocks.push(bN2);
            if (bN1) blocks.push(bN1);
            if (bN) blocks.push(bN);
        } else {
            if (bN) blocks.push(bN);
            if (bN1) blocks.push(bN1);
            if (bN2) blocks.push(bN2);
        }
        
        const actionBtns = `
        <div class="sticky bottom-0 bg-white border-t p-4 flex gap-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-4 -mx-4 md:mx-0 md:rounded-b-2xl">
            <button onclick="window.app.actions.rallyEntry.cancelEdit()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">Hủy</button>
            <button onclick="window.app.actions.rallyEntry.savePoint()" class="flex-[2] py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"><i data-lucide="save" class="w-5 h-5"></i> Lưu Rally</button>
        </div>
        `;

        html += `
        <div class="mt-6 md:mt-0 ${editingPointIndex === -1 ? 'animate-in slide-in-from-bottom-4 duration-300' : ''}">
            <div class="bg-slate-50 border rounded-2xl p-4 md:p-6 md:pb-0">
                <h3 class="text-xl font-black text-slate-800 mb-4">${editingPointIndex === -1 ? 'Thêm Rally Mới' : 'Sửa Rally'}</h3>
                ${dirTabs}
                ${chamHtml}
                ${warningHtml}
                <div class="flex flex-col">
                    ${blocks.join('')}
                </div>
                ${actionBtns}
            </div>
        </div>
        `;
    } else if (g.danh_sach_diem.length > 0) {
        html += `
        <div class="mt-8 text-center pb-12">
            <button onclick="window.app.actions.rallyEntry.toggleAddPoint()" class="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 mx-auto w-full max-w-sm"><i data-lucide="plus-circle" class="w-6 h-6"></i> NHẬP ĐIỂM TIẾP THEO</button>
        </div>
        `;
    }

    return html;
}
