import React, { useState } from 'react';
import { PointData, MatchData, TouchData } from '../types';
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Timeline({ points, match, onEdit, onDelete }: { points: PointData[], match: MatchData, onEdit: (p: PointData) => void, onDelete: (p: PointData) => void }) {
  const { dictionary } = useAppContext();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  
  if (!points || points.length === 0) {
    return <div className="text-center py-8 text-slate-500">Chưa có rally nào được ghi lại.</div>;
  }

  const getTechName = (key: string | null | undefined) => {
      if (!key || !dictionary) return '';
      return dictionary.ky_thuat[key] || key;
  }

  const getShortTechName = (key: string | null | undefined) => {
      let name = getTechName(key);
      if (name.toLowerCase().includes('giao bóng con lắc')) return 'Con lắc';
      if (name.toLowerCase().includes('giao bóng mổ')) return 'Mổ';
      if (name.toLowerCase().includes('giao bóng')) return name.replace(/giao bóng/i, '').trim() || 'Giao bóng';
      return name;
  }

  const getPropName = (cat: keyof NonNullable<typeof dictionary>['thuoc_tinh_bong'], key: string | null | undefined) => {
      if (!key || !dictionary) return '';
      return dictionary.thuoc_tinh_bong[cat]?.[key] || key;
  };

  const getShortSpinName = (key: string | null | undefined) => {
      if (key === 'xoay_xuong') return '↓';
      if (key === 'xoay_len') return '↑';
      if (key === 'bong_long') return '○';
      return getPropName('do_xoay', key);
  }

  const getErrorLocName = (key: string | null | undefined) => {
      if (!key || !dictionary) return '';
      return dictionary.thuoc_tinh_loi.vi_tri_hong[key] || key;
  }

  const p1 = match.thong_tin.doi_thu_1;
  const p2 = match.thong_tin.doi_thu_2;

  const getLocationLabel = (ngang?: string | null, doc?: string | null) => {
      const ngangName = getPropName('diem_roi_ngang', ngang);
      const docName = getPropName('do_dai', doc);
      if (ngangName && docName) return `${ngangName} · ${docName}`;
      if (ngangName) return ngangName;
      if (docName) return docName;
      return '';
  }

  const shortName = (name: string) => {
      if (!name) return '';
      const parts = name.trim().split(' ');
      return parts[parts.length - 1];
  }

  const toggleExpand = (idx: number, e: React.MouseEvent) => {
      // Don't toggle if clicking on action buttons
      if ((e.target as HTMLElement).closest('button')) return;
      
      setExpandedIds(prev => {
          const next = new Set(prev);
          if (next.has(idx)) next.delete(idx);
          else next.add(idx);
          return next;
      });
  };

  return (
    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {points.map((p, idx) => {
        const isWin = p.loai_diem === 'thang';
        const server = p.khoi_nguon_giao_bong.nguoi_thuc_hien;
        const receiver = server === p1 ? p2 : p1;
        
        // Let's ensure Doi Thu 1 is on the left, Doi Thu 2 is on the right
        const isP1Serving = server === p1;
        const isExpanded = expandedIds.has(idx);

        const serveSpin = getShortSpinName(p.khoi_nguon_giao_bong.dac_tinh?.do_xoay);
        const serveTech = getShortTechName(p.khoi_nguon_giao_bong.ky_thuat);

        const renderTouch = (label: string, touch?: TouchData | null) => {
            if (!touch) return null;
            const loc = getLocationLabel(touch.dac_tinh?.diem_roi_ngang, touch.dac_tinh?.do_dai);
            return (
                <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] leading-tight mt-1.5">
                    <span className="font-mono text-slate-400 w-6 shrink-0 text-xs">{label}</span>
                    <span className="font-medium text-slate-800 w-[50px] truncate" title={touch.nguoi_thuc_hien}>{shortName(touch.nguoi_thuc_hien)}</span>
                    <span className="text-slate-700 flex-1 truncate">{getTechName(touch.ky_thuat)}</span>
                    {loc && (
                        <span className="text-slate-600 shrink-0 text-xs">
                            📍 {loc}
                        </span>
                    )}
                </div>
            );
        };

        const renderExpandedTouch = (label: string, touch?: TouchData | null) => {
            if (!touch) return null;
            const spin = getPropName('do_xoay', touch.dac_tinh?.do_xoay);
            const err = getErrorLocName(touch.dac_tinh?.vi_tri_hong);
            const loc = getLocationLabel(touch.dac_tinh?.diem_roi_ngang, touch.dac_tinh?.do_dai);
            return (
                <div className="text-xs space-y-1 mb-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-700 mb-1.5 flex justify-between">
                        <span>{label}</span>
                        <span className="text-slate-500">{touch.nguoi_thuc_hien}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                            <div className="text-slate-400">Kỹ thuật</div>
                            <div className="font-medium">{getTechName(touch.ky_thuat)}</div>
                        </div>
                        {loc && (
                            <div>
                                <div className="text-slate-400">Điểm rơi</div>
                                <div className="font-medium">{loc}</div>
                            </div>
                        )}
                        {spin && (
                            <div>
                                <div className="text-slate-400">Độ xoáy</div>
                                <div className="font-medium">{spin}</div>
                            </div>
                        )}
                        {err && (
                            <div className="col-span-2">
                                <div className="text-slate-400">Vị trí hỏng</div>
                                <div className="font-medium text-red-600">{err}</div>
                            </div>
                        )}
                        {touch.tinh_chat && dictionary && (
                            <div className="col-span-2">
                                <div className="text-slate-400">Tính chất</div>
                                <div className="font-medium text-blue-600">{dictionary.tinh_chat_ket_thuc[touch.tinh_chat] || touch.tinh_chat}</div>
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        return (
          <div key={idx} className={`relative flex items-center justify-between md:justify-normal group is-active ${!isP1Serving ? 'md:flex-row-reverse' : ''}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 md:order-1 z-10 font-bold text-xs ${!isP1Serving ? 'md:-translate-x-1/2' : 'md:translate-x-1/2'}`}>
              {p.thu_tu_diem}
            </div>
            
            <div 
                className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow relative cursor-pointer"
                onClick={(e) => toggleExpand(idx, e)}
            >
                {/* Arrow */}
                <div className={`hidden md:block absolute top-4 -translate-y-1/2 w-2.5 h-2.5 bg-white rotate-45 border-t border-r ${isP1Serving ? '-right-[6px] border-slate-200' : '-left-[6px] border-b border-l border-t-0 border-r-0 border-slate-200'}`}></div>
                <div className="md:hidden absolute top-4 -translate-y-1/2 w-2.5 h-2.5 bg-white rotate-45 border-b border-l border-slate-200 -left-[6px]"></div>
                
                {/* HEADER */}
                <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-500 font-mono">#{p.thu_tu_diem}</span>
                        <span className="text-[15px] font-bold text-slate-800">{p.ty_so_hien_tai}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isWin ? `✓ ${shortName(p.nguoi_ghi_diem)}` : `✗ ${shortName(p.nguoi_ghi_diem)}`}
                        </span>
                        
                        {/* Actions */}
                        <div className="flex gap-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="text-slate-400 hover:text-primary p-0.5"><Edit2 size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(p); }} className="text-slate-400 hover:text-danger p-0.5"><Trash2 size={14}/></button>
                        </div>
                    </div>
                </div>

                {/* COMPACT SUMMARY */}
                <div className="text-sm text-slate-700">
                    <div className="text-[12px] sm:text-[13px] text-slate-700 leading-tight mb-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="font-semibold text-slate-800">🏓 {shortName(server)} → {shortName(receiver)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600 font-medium">{p.tong_so_cham} chạm</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-700">{serveTech}</span>
                        {serveSpin && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-700">{serveSpin}</span>
                            </>
                        )}
                        {getLocationLabel(p.khoi_nguon_giao_bong.dac_tinh?.diem_roi_ngang, p.khoi_nguon_giao_bong.dac_tinh?.do_dai) && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-600">📍 {getLocationLabel(p.khoi_nguon_giao_bong.dac_tinh?.diem_roi_ngang, p.khoi_nguon_giao_bong.dac_tinh?.do_dai)}</span>
                            </>
                        )}
                    </div>

                    {/* RALLY PROGRESSION */}
                    <div className="space-y-0">
                        {renderTouch('N-2', p.cu_tao_loi_the_N_2)}
                        {renderTouch('N-1', p.cu_dap_tra_N_1)}
                        {renderTouch('N', p.cu_ket_thuc_N)}
                    </div>
                </div>

                {/* EXPANDED DETAIL */}
                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Chi tiết mở rộng</div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                            <div>
                                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase">Giao bóng</span>
                                <span className="font-semibold text-slate-700">{server}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase">Đỡ giao</span>
                                <span className="font-semibold text-slate-700">{receiver}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase">Số chạm</span>
                                <span className="font-semibold text-slate-700">{p.tong_so_cham}</span>
                            </div>
                            {p.cu_ket_thuc_N?.tinh_chat && dictionary && (
                                <div>
                                    <span className="text-slate-400 block mb-0.5 text-[10px] uppercase">Tính chất Rally</span>
                                    <span className="font-semibold text-blue-600">{dictionary.tinh_chat_ket_thuc[p.cu_ket_thuc_N.tinh_chat] || p.cu_ket_thuc_N.tinh_chat}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            {renderExpandedTouch('Giao bóng', p.khoi_nguon_giao_bong)}
                            {p.cu_tao_loi_the_N_2 && renderExpandedTouch('Kiến tạo 2 (N-2)', p.cu_tao_loi_the_N_2)}
                            {p.cu_dap_tra_N_1 && renderExpandedTouch('Kiến tạo 1 (N-1)', p.cu_dap_tra_N_1)}
                            {p.cu_ket_thuc_N && renderExpandedTouch('Kết thúc (N)', p.cu_ket_thuc_N)}
                        </div>
                    </div>
                )}
                
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-white rounded-full border shadow-sm p-0.5 text-slate-300 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

