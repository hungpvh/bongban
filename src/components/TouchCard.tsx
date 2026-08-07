import React from 'react';
import { TouchData } from '../types';
import { useAppContext } from '../context/AppContext';

interface Props {
  title: string;
  data: TouchData | null;
  onChange: (d: TouchData | null) => void;
  isOptional?: boolean;
  isServe?: boolean;
  isLast?: boolean;
  player1: string;
  player2: string;
  serveReceiver: string;
  expectedActor?: string;
}

export function TouchCard({ title, data, onChange, isOptional, isServe, isLast, player1, player2, serveReceiver, expectedActor }: Props) {
  const { dictionary } = useAppContext();
  
  if (!dictionary) return null;

  // Split techniques into Serve vs Rally based on a simple heuristic (starts with 'giao_bong')
  // This avoids hardcoding keys while separating serve techniques.
  const techEntries = Object.entries(dictionary.ky_thuat);
  const serveTechs = techEntries.filter(([k]) => k.startsWith('giao_'));
  const rallyTechs = techEntries.filter(([k]) => !k.startsWith('giao_'));
  const techniquesToShow = isServe ? serveTechs : rallyTechs;

  const handleUpdate = (field: keyof TouchData | string, value: any) => {
    const newData = data ? { ...data } : { nguoi_thuc_hien: expectedActor || '', ky_thuat: '', dac_tinh: { diem_roi_ngang: null, do_dai: null, do_xoay: null, vi_tri_hong: null } };
    
    if (field.startsWith('dac_tinh.')) {
        const subField = field.split('.')[1] as keyof TouchData['dac_tinh'];
        newData.dac_tinh = { ...newData.dac_tinh, [subField]: value };
    } else {
        (newData as any)[field] = value;
    }
    
    onChange(newData as TouchData);
  };

  const handleUpdateLocation = (ngang: string | null, doc: string | null) => {
    const newData = data ? { ...data } : { nguoi_thuc_hien: expectedActor || '', ky_thuat: '', dac_tinh: { diem_roi_ngang: null, do_dai: null, do_xoay: null, vi_tri_hong: null } };
    newData.dac_tinh = { ...newData.dac_tinh, diem_roi_ngang: ngang as any, do_dai: doc as any };
    onChange(newData as TouchData);
  };

  const clearData = () => onChange(null);

  if (isOptional && !data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6 flex items-center justify-between opacity-70">
        <h3 className="font-bold text-lg text-slate-700">{title}</h3>
        <button onClick={() => onChange({ nguoi_thuc_hien: '', ky_thuat: '', dac_tinh: { diem_roi_ngang: null, do_dai: null, do_xoay: null, vi_tri_hong: null }})} className="text-primary font-medium hover:underline">
          Nhập dữ liệu
        </button>
      </div>
    );
  }

  const isError = isLast && (data?.tinh_chat === 'unforced_error' || data?.tinh_chat === 'forced_error');

  const currentReceiver = data?.nguoi_thuc_hien ? (data.nguoi_thuc_hien === player1 ? player2 : player1) : serveReceiver;
  const isMirrored = currentReceiver === player2;
  const gridRows = isMirrored ? ['dai', 'ngan'] : ['ngan', 'dai'];
  const gridCols = isMirrored ? ['phai', 'giua', 'trai'] : ['trai', 'giua', 'phai'];

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800">{title}</h3>
        {isOptional && (
          <button onClick={clearData} className="text-sm text-slate-500 hover:text-danger">Bỏ qua / Không xác định</button>
        )}
      </div>
      
      <div className="p-4 md:p-6 space-y-6">
        {/* Người thực hiện */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Người thực hiện</label>
          <div className="flex gap-2">
            {[player1, player2].map(p => (
              <button
                key={p}
                onClick={() => handleUpdate('nguoi_thuc_hien', p)}
                className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-colors ${data?.nguoi_thuc_hien === p ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Kỹ thuật */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Kỹ thuật</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {techniquesToShow.map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleUpdate('ky_thuat', key)}
                className={`py-2 px-3 rounded text-sm text-left border transition-colors leading-tight ${data?.ky_thuat === key ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tính chất (Only for last touch) */}
        {isLast && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tính chất</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.entries(dictionary.tinh_chat_ket_thuc).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleUpdate('tinh_chat', key)}
                  className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${data?.tinh_chat === key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <hr className="border-slate-100" />

        {/* Điểm rơi - Grid 2x3 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex justify-between">
            <span>Điểm rơi (Tùy chọn)</span>
            <button onClick={() => handleUpdateLocation(null, null)} className="text-xs text-slate-400 font-normal hover:text-slate-600">Xóa</button>
          </label>
          
          <div className="mb-3 text-center text-sm font-medium text-slate-600 bg-slate-50 py-2 border rounded-lg">
            Điểm rơi theo góc nhìn người đỡ<br/>
            <span className="text-primary font-bold">Người đỡ: {currentReceiver}</span>
          </div>
          
          <div className="bg-[#2a5b3f] aspect-[3/2] w-full max-w-sm mx-auto rounded-lg border-4 border-white shadow-inner relative flex flex-col p-1 gap-1 overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/30 -translate-y-1/2"></div>
            <div className="absolute top-0 left-1/2 w-[2px] h-full bg-white/30 -translate-x-1/2"></div>
            
            {gridRows.map((do_dai_row, rowIdx) => (
              <div key={`row-${rowIdx}`} className="flex flex-1 gap-1 z-10">
                {gridCols.map((ngang_col, colIdx) => {
                  const isSelected = data?.dac_tinh.diem_roi_ngang === ngang_col && data?.dac_tinh.do_dai === do_dai_row;
                  
                  const labelNgang = ngang_col === 'trai' ? 'TRÁI' : ngang_col === 'phai' ? 'PHẢI' : 'GIỮA';
                  const labelDoc = do_dai_row === 'ngan' ? 'NGẮN' : 'DÀI';

                  return (
                    <button
                      key={`col-${colIdx}`}
                      onClick={() => handleUpdateLocation(ngang_col, do_dai_row)}
                      className={`flex-1 rounded-sm flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-white/90 shadow' : 'hover:bg-white/20 active:bg-white/30'}`}
                    >
                      <div className={`text-[11px] font-bold ${isSelected ? 'text-[#2a5b3f]' : 'text-white/70'}`}>
                        {labelNgang}
                      </div>
                      <div className={`text-[9px] font-semibold tracking-wider uppercase mt-0.5 ${isSelected ? 'text-[#2a5b3f]/70' : 'text-white/50'}`}>
                        {labelDoc}
                      </div>
                      {isSelected && <div className="mt-1 w-2.5 h-2.5 bg-orange-500 rounded-full shadow-sm"></div>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Độ xoáy */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex justify-between">
            <span>Độ xoáy (Tùy chọn)</span>
            <button onClick={() => handleUpdate('dac_tinh.do_xoay', null)} className="text-xs text-slate-400 font-normal hover:text-slate-600">Xóa</button>
          </label>
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {Object.entries(dictionary.thuoc_tinh_bong.do_xoay).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleUpdate('dac_tinh.do_xoay', key)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${data?.dac_tinh.do_xoay === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Vị trí hỏng */}
        {isError && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex justify-between">
                <span>Vị trí hỏng</span>
                <button onClick={() => handleUpdate('dac_tinh.vi_tri_hong', null)} className="text-xs text-slate-400 font-normal hover:text-slate-600">Xóa</button>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(dictionary.thuoc_tinh_loi.vi_tri_hong).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleUpdate('dac_tinh.vi_tri_hong', key)}
                  className={`py-2 px-3 border rounded text-sm text-left transition-colors ${data?.dac_tinh.vi_tri_hong === key ? 'bg-red-50 border-red-200 text-red-700 font-medium' : 'bg-white hover:bg-slate-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
