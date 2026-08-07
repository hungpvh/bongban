import React, { useState } from 'react';
import { GameData } from '../types';

interface Props {
  initialData: GameData | null;
  player1: string;
  player2: string;
  suggestedGameNumber?: number;
  onSave: (data: Omit<GameData, 'danh_sach_diem'>) => void;
  onClose: () => void;
}

export function GameModal({ initialData, player1, player2, suggestedGameNumber, onSave, onClose }: Props) {
  const [gameSo, setGameSo] = useState(initialData?.game_so || suggestedGameNumber || 1);
  const [tySoBatDau, setTySoBatDau] = useState(initialData?.ty_so_bat_dau || '0-0');
  const [nguoiGiaoBong, setNguoiGiaoBong] = useState(initialData?.nguoi_giao_bong_truoc || player1);
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validate tySoBatDau
    const cleanScore = tySoBatDau.replace(/\s+/g, '');
    const parts = cleanScore.split('-');
    if (parts.length !== 2 || isNaN(parseInt(parts[0])) || isNaN(parseInt(parts[1]))) {
      setError("Tỷ số bắt đầu không hợp lệ. Vui lòng nhập định dạng SỐ-SỐ (VD: 0-0, 0-2)");
      return;
    }
    
    if (parseInt(gameSo as any) <= 0) {
      setError("Số Game phải là số nguyên dương.");
      return;
    }

    onSave({
      game_so: parseInt(gameSo as any),
      ty_so_bat_dau: cleanScore,
      nguoi_giao_bong_truoc: nguoiGiaoBong,
      ty_so_chung_cuoc: initialData?.ty_so_chung_cuoc || cleanScore,
      trang_thai: initialData?.trang_thai || 'dang_dien_ra'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="font-bold text-xl mb-4 text-slate-800">{initialData ? 'Sửa Game' : 'Thêm Game mới'}</h3>
        
        {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Game số</label>
            <input 
              type="number" 
              value={gameSo}
              onChange={e => setGameSo(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
              <span>Tỷ số bắt đầu</span>
            </label>
            <input 
              type="text" 
              value={tySoBatDau}
              onChange={e => setTySoBatDau(e.target.value)}
              placeholder="0-0"
              className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="text-xs text-slate-500 mt-1">
              Quy ước: Điểm bên trái = {player1}. Điểm bên phải = {player2}.
            </div>
            {tySoBatDau !== '0-0' && tySoBatDau.includes('-') && (
              <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                Game này đang sử dụng chấp điểm.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Người giao bóng trước</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setNguoiGiaoBong(player1)}
                className={`flex-1 py-2 px-3 border rounded-lg font-medium text-sm transition-colors ${nguoiGiaoBong === player1 ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {player1}
              </button>
              <button 
                onClick={() => setNguoiGiaoBong(player2)}
                className={`flex-1 py-2 px-3 border rounded-lg font-medium text-sm transition-colors ${nguoiGiaoBong === player2 ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {player2}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border font-medium text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-primary font-medium text-white hover:bg-primary-hover transition-colors">Lưu</button>
        </div>
      </div>
    </div>
  );
}
