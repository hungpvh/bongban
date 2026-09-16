const fs = require('fs');
let code = fs.readFileSync('js/views/timeline.js', 'utf8');

// 1. We replace the renderCompactPoint definition.
const renderCompactPointRegex = /const renderCompactPoint = \(pt, isExpanded\) => \{[\s\S]*?        return `\n            <div class="mt-2 bg-slate-50\/50 p-2 rounded-lg border border-slate-100">\n                \$\{serveHtml\}\n                \$\{n2Html\}\n                \$\{n1Html\}\n                \$\{n0Html\}\n            <\/div>\n        `;\n    \};/;

const newRenderCompactPoint = `const renderCompactPoint = (pt, isExpanded) => {
        let serveHtml = '', n2Html = '', n1Html = '', n0Html = '';
        
        const renderBadge = (player) => {
            if (!player) return '';
            const badgeClasses = "inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-slate-200/80 border border-slate-300 text-[11px] font-bold text-slate-700 mr-1.5 align-middle";
            if (player === p1) return \`<span class="\${badgeClasses}">1</span>\`;
            if (player === p2) return \`<span class="\${badgeClasses}">2</span>\`;
            return '';
        };

        const serveInfo = pt.khoi_nguon_giao_bong;
        const sn2 = pt.cu_tao_loi_the_N_2;
        const sn1 = pt.cu_dap_tra_N_1;
        const sn0 = pt.cu_ket_thuc_N;
        
        const renderAttr = (s) => {
            let parts = [];
            if(s.ky_thuat) parts.push(getTechName(s.ky_thuat));
            if(s.dac_tinh?.diem_roi_ngang) parts.push(\`🎯 \${dict.thuoc_tinh_bong?.diem_roi_ngang?.[s.dac_tinh.diem_roi_ngang] || s.dac_tinh.diem_roi_ngang}\`);
            if(s.dac_tinh?.do_dai) parts.push(dict.thuoc_tinh_bong?.do_dai?.[s.dac_tinh.do_dai] || s.dac_tinh.do_dai);
            if(s.dac_tinh?.do_xoay) parts.push(dict.thuoc_tinh_bong?.do_xoay?.[s.dac_tinh.do_xoay] || s.dac_tinh.do_xoay);
            return parts.join(' · ');
        };
        
        if (isExpanded) {
            if (serveInfo) serveHtml = \`<div class="text-xs text-slate-600 mb-0.5">\${renderBadge(serveInfo.nguoi_thuc_hien)}<span class="font-bold w-6 inline-block align-middle">1</span> <span class="align-middle">\${renderAttr(serveInfo)}</span></div>\`;
            else serveHtml = \`<div class="text-[10px] text-slate-400 mb-0.5 italic"><span class="font-bold w-6 inline-block not-italic text-slate-400 ml-[28px] align-middle">1</span> <span class="align-middle">Không ghi nhận</span></div>\`;
            
            if (sn2) n2Html = \`<div class="text-xs text-slate-600 mb-0.5">\${renderBadge(sn2.nguoi_thuc_hien)}<span class="font-bold w-6 inline-block align-middle">N-2</span> <span class="align-middle">\${renderAttr(sn2)}</span></div>\`;
            else n2Html = \`<div class="text-[10px] text-slate-400 mb-0.5 italic"><span class="font-bold w-6 inline-block not-italic text-slate-400 ml-[28px] align-middle">N-2</span> <span class="align-middle">Không ghi nhận</span></div>\`;
            
            if (sn1) n1Html = \`<div class="text-xs text-slate-600 mb-0.5">\${renderBadge(sn1.nguoi_thuc_hien)}<span class="font-bold w-6 inline-block align-middle">N-1</span> <span class="align-middle">\${renderAttr(sn1)}</span></div>\`;
            else n1Html = \`<div class="text-[10px] text-slate-400 mb-0.5 italic"><span class="font-bold w-6 inline-block not-italic text-slate-400 ml-[28px] align-middle">N-1</span> <span class="align-middle">Không ghi nhận</span></div>\`;
            
            if (sn0) {
                let resIcon = '';
                if (sn0.tinh_chat === 'winner') resIcon = '<span class="text-success font-bold">✓ Winner</span>';
                else if (sn0.tinh_chat === 'unforced_error') resIcon = '<span class="text-danger font-bold">✕ Lỗi tự đánh hỏng</span>';
                else if (sn0.tinh_chat === 'forced_error') resIcon = '<span class="text-danger font-bold">✕ Lỗi bị ép hỏng</span>';
                
                if ((sn0.tinh_chat === 'unforced_error' || sn0.tinh_chat === 'forced_error') && sn0.dac_tinh?.vi_tri_hong) {
                    resIcon += \` <span class="text-danger font-medium text-[10px]">(\${dict.thuoc_tinh_loi?.vi_tri_hong?.[sn0.dac_tinh.vi_tri_hong] || sn0.dac_tinh.vi_tri_hong})</span>\`;
                }
                
                n0Html = \`<div class="text-xs text-slate-800 mb-0.5">\${renderBadge(sn0.nguoi_thuc_hien)}<span class="font-bold w-6 inline-block text-primary align-middle">N</span> <span class="align-middle">\${renderAttr(sn0)} \${resIcon ? '· ' + resIcon : ''}</span></div>\`;
            }

            const renderExpandedAttr = (title, s) => {
                if (!s) return \`<div class="text-sm text-slate-400 italic mb-2"><span class="font-bold w-12 inline-block not-italic text-slate-400">\${title}</span> Không ghi nhận</div>\`;
                let parts = [];
                if(s.ky_thuat) parts.push(\`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Kỹ thuật</span><span class="font-bold">\${getTechName(s.ky_thuat)}</span></div>\`);
                if(s.dac_tinh?.diem_roi_ngang) parts.push(\`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Điểm rơi ngang</span><span class="font-bold">\${dict.thuoc_tinh_bong?.diem_roi_ngang?.[s.dac_tinh.diem_roi_ngang] || s.dac_tinh.diem_roi_ngang}</span></div>\`);
                if(s.dac_tinh?.do_dai) parts.push(\`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Độ dài</span><span class="font-bold">\${dict.thuoc_tinh_bong?.do_dai?.[s.dac_tinh.do_dai] || s.dac_tinh.do_dai}</span></div>\`);
                if(s.dac_tinh?.do_xoay) parts.push(\`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Độ xoáy</span><span class="font-bold">\${dict.thuoc_tinh_bong?.do_xoay?.[s.dac_tinh.do_xoay] || s.dac_tinh.do_xoay}</span></div>\`);
                if(s.tinh_chat) {
                    let resIcon = s.tinh_chat === 'winner' ? 'Điểm trực tiếp (Winner)' : (s.tinh_chat === 'unforced_error' ? 'Lỗi tự đánh hỏng' : 'Lỗi bị ép hỏng');
                    parts.push(\`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Kết quả N</span><span class="font-bold \${s.tinh_chat==='winner'?'text-success':'text-danger'}">\${resIcon}</span></div>\`);
                }
                if(s.dac_tinh?.vi_tri_hong) {
                    parts.push(\`<div class="grid grid-cols-2 text-sm py-1 border-b border-slate-50"><span class="text-slate-500">Vị trí hỏng</span><span class="font-bold text-danger">\${dict.thuoc_tinh_loi?.vi_tri_hong?.[s.dac_tinh.vi_tri_hong] || s.dac_tinh.vi_tri_hong}</span></div>\`);
                }
                return \`<div class="mb-3 bg-white p-3 rounded shadow-sm border border-slate-200">
                    <h4 class="font-black text-slate-700 text-xs mb-2 uppercase border-b pb-1">\${title} <span class="font-normal text-slate-500 normal-case ml-2">\${s.nguoi_thuc_hien || ''}</span></h4>
                    \${parts.join('')}
                </div>\`;
            };
            return \`
                <div class="mt-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    \${serveHtml}
                    \${n2Html}
                    \${n1Html}
                    \${n0Html}
                </div>
                <div class="mt-3 pt-3 border-t border-slate-200">
                    \${renderExpandedAttr('Khởi nguồn (Giao bóng)', pt.khoi_nguon_giao_bong)}
                    \${renderExpandedAttr('N-2 (Tạo lợi thế)', sn2)}
                    \${renderExpandedAttr('N-1 (Đáp trả)', sn1)}
                    \${renderExpandedAttr('N (Kết thúc)', sn0)}
                </div>
            \`;
        } else {
            if (serveInfo) serveHtml = \`<div class="text-[12px] text-slate-600 leading-snug py-0.5">\${renderBadge(serveInfo.nguoi_thuc_hien)}<span class="font-bold inline-block align-middle w-6">1</span> <span class="align-middle">\${renderAttr(serveInfo)}</span></div>\`;
            else serveHtml = \`<div class="text-[11px] text-slate-400 italic leading-snug py-0.5"><span class="font-bold inline-block not-italic text-slate-400 align-middle ml-[28px] w-6">1</span> <span class="align-middle">Không ghi nhận</span></div>\`;
            
            if (sn2) n2Html = \`<div class="text-[12px] text-slate-600 leading-snug py-0.5">\${renderBadge(sn2.nguoi_thuc_hien)}<span class="font-bold inline-block align-middle w-7">N-2</span> <span class="align-middle">\${renderAttr(sn2)}</span></div>\`;
            else n2Html = '';
            
            if (sn1) n1Html = \`<div class="text-[12px] text-slate-600 leading-snug py-0.5">\${renderBadge(sn1.nguoi_thuc_hien)}<span class="font-bold inline-block align-middle w-7">N-1</span> <span class="align-middle">\${renderAttr(sn1)}</span></div>\`;
            else n1Html = '';
            
            if (sn0) {
                let resIcon = '';
                if (sn0.tinh_chat === 'winner') resIcon = '<span class="text-success font-bold">✓ Winner</span>';
                else if (sn0.tinh_chat === 'unforced_error') resIcon = '<span class="text-danger font-bold">✕ Lỗi tự đánh hỏng</span>';
                else if (sn0.tinh_chat === 'forced_error') resIcon = '<span class="text-danger font-bold">✕ Lỗi bị ép hỏng</span>';
                
                if ((sn0.tinh_chat === 'unforced_error' || sn0.tinh_chat === 'forced_error') && sn0.dac_tinh?.vi_tri_hong) {
                    resIcon += \` <span class="text-danger font-medium text-[11px]">(\${dict.thuoc_tinh_loi?.vi_tri_hong?.[sn0.dac_tinh.vi_tri_hong] || sn0.dac_tinh.vi_tri_hong})</span>\`;
                }
                
                n0Html = \`<div class="text-[12px] text-slate-800 leading-snug py-0.5">\${renderBadge(sn0.nguoi_thuc_hien)}<span class="font-bold text-primary inline-block align-middle w-6">N</span> <span class="align-middle">\${renderAttr(sn0)} \${resIcon ? '· ' + resIcon : ''}</span></div>\`;
            }
            
            return \`
                <div class="mt-1 pt-1 border-t border-slate-100">
                    \${serveHtml}
                    \${n2Html}
                    \${n1Html}
                    \${n0Html}
                </div>
            \`;
        }
    };`;

code = code.replace(renderCompactPointRegex, newRenderCompactPoint);

// 2. We replace the filteredPoints loop iteration content
const loopContentRegex = /            timelineHtml \+= `\n            <div class="relative z-10 w-full md:w-\[calc\(50%-1\.5rem\)\] flex flex-col mb-4 \$\{alignClass\}">\n                <div class="bg-white p-4 rounded-xl border shadow-sm w-full transition group relative text-left cursor-pointer hover:shadow-md hover:border-blue-300" onclick="window\.app\.actions\.timeline\.toggleExpand\(\$\{idx\}\)">\n                    <div class="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">\n                        <div class="flex gap-2 items-center">\n                            <span class="w-8 h-8 flex items-center justify-center bg-slate-800 text-white font-black rounded-lg shadow-sm">#\$\{pt\.thu_tu_diem\}<\/span>\n                            <div>\n                                <div class="text-\[10px\] font-bold text-slate-400 uppercase tracking-wide">Tỷ số<\/div>\n                                <div class="text-lg font-black font-mono leading-none \$\{pt\.nguoi_ghi_diem === p1 \? 'text-blue-600' : 'text-red-600'\}">\$\{pt\.ty_so_hien_tai\}<\/div>\n                            <\/div>\n                        <\/div>\n                        <div class="text-right">\n                            <div class="text-\[10px\] font-bold text-slate-500 uppercase">Giao: \$\{server === p1 \? 'Tôi' : 'Đối thủ'\}<\/div>\n                            <div class="text-\[10px\] font-bold text-slate-400">Đỡ: \$\{server === p1 \? 'Đối thủ' : 'Tôi'\}<\/div>\n                            <div class="text-\[10px\] font-black px-1\.5 py-0\.5 mt-1 rounded border \$\{textBgClass\} inline-block">\$\{winnerText\}<\/div>\n                        <\/div>\n                    <\/div>\n                    \$\{renderCompactPoint\(pt, state\.timelineExpandedIdx === idx\)\}\n                    <div class="mt-2 pt-2 border-t border-slate-100 flex gap-2 justify-end">\n                        <button onclick="event\.stopPropagation\(\); window\.app\.actions\.rally\.editRally\(\$\{idx\}\); window\.app\.navigate\('rallyEntry', \{selectedMatchId: '\$\{match\.id_tran_dau\}', selectedGameId: '\$\{state\.selectedGameId\}'\}\)" class="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100 transition">✏ Sửa<\/button>\n                        <button onclick="event\.stopPropagation\(\); window\.app\.actions\.rally\.deleteRally\(\$\{idx\}\)" class="px-3 py-1 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-100 transition">🗑 Xóa<\/button>\n                    <\/div>\n                <\/div>\n            <\/div>\n            `;/g;

const newLoopContent = `            const isExpanded = state.timelineExpandedIdx === idx;
            let cardContentHtml = '';
            
            if (isExpanded) {
                cardContentHtml = \`
                    <div class="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                        <div class="flex gap-2 items-center">
                            <span class="w-8 h-8 flex items-center justify-center bg-slate-800 text-white font-black rounded-lg shadow-sm">#\${pt.thu_tu_diem}</span>
                            <div>
                                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tỷ số</div>
                                <div class="text-lg font-black font-mono leading-none \${pt.nguoi_ghi_diem === p1 ? 'text-blue-600' : 'text-red-600'}">\${pt.ty_so_hien_tai}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-bold text-slate-500 uppercase">Giao: \${server === p1 ? 'Tôi' : 'Đối thủ'}</div>
                            <div class="text-[10px] font-bold text-slate-400">Đỡ: \${server === p1 ? 'Đối thủ' : 'Tôi'}</div>
                            <div class="text-[10px] font-black px-1.5 py-0.5 mt-1 rounded border \${textBgClass} inline-block">\${winnerText}</div>
                        </div>
                    </div>
                    \${renderCompactPoint(pt, true)}
                    <div class="mt-2 pt-2 border-t border-slate-100 flex gap-2 justify-end">
                        <button onclick="event.stopPropagation(); window.app.actions.rally.editRally(\${idx}); window.app.navigate('rallyEntry', {selectedMatchId: '\${match.id_tran_dau}', selectedGameId: '\${state.selectedGameId}'})" class="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100 transition">✏ Sửa</button>
                        <button onclick="event.stopPropagation(); window.app.actions.rally.deleteRally(\${idx})" class="px-3 py-1 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-100 transition">🗑 Xóa</button>
                    </div>
                \`;
            } else {
                cardContentHtml = \`
                    <div class="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="w-6 h-6 flex items-center justify-center bg-slate-800 text-white text-[10px] font-black rounded shadow-sm">#\${pt.thu_tu_diem}</span>
                            <span class="text-sm font-black font-mono leading-none \${pt.nguoi_ghi_diem === p1 ? 'text-blue-600' : 'text-red-600'}">\${pt.ty_so_hien_tai}</span>
                        </div>
                        
                        <div class="flex items-center gap-2 flex-wrap flex-1 justify-end min-w-[120px]">
                            <span class="text-[10px] font-bold text-slate-500 whitespace-nowrap">Giao: \${server === p1 ? 'Tôi' : 'Đối thủ'}</span>
                            <span class="text-[10px] font-black px-1.5 py-0.5 rounded border \${textBgClass} whitespace-nowrap">\${winnerText}</span>
                        </div>
                        
                        <div class="flex gap-1 shrink-0 ml-1">
                            <button onclick="event.stopPropagation(); window.app.actions.rally.editRally(\${idx}); window.app.navigate('rallyEntry', {selectedMatchId: '\${match.id_tran_dau}', selectedGameId: '\${state.selectedGameId}'})" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Sửa" aria-label="Sửa">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button onclick="event.stopPropagation(); window.app.actions.rally.deleteRally(\${idx})" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Xóa" aria-label="Xóa">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    \${renderCompactPoint(pt, false)}
                \`;
            }
            
            timelineHtml += \`
            <div class="relative z-10 w-full md:w-[calc(50%-1.5rem)] flex flex-col mb-3 \${alignClass}">
                <div class="bg-white \${isExpanded ? 'p-4' : 'p-3'} rounded-xl border shadow-sm w-full transition group relative text-left cursor-pointer hover:shadow-md hover:border-blue-300" onclick="window.app.actions.timeline.toggleExpand(\${idx})">
                    \${cardContentHtml}
                </div>
            </div>
            \`;`;

if (code.match(loopContentRegex)) {
    code = code.replace(loopContentRegex, newLoopContent);
    fs.writeFileSync('js/views/timeline.js', code);
    console.log("Patched successfully!");
} else {
    console.log("Could not find loop content regex!");
}
