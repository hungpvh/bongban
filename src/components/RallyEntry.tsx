import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Plus } from 'lucide-react';
import { Timeline } from './Timeline';
import { RallyWorkflow } from './RallyWorkflow';
import { PointData } from '../types';
import { recalculateGame } from '../lib/gameLogic';

export function RallyEntry({ matchId, gameIndex, onBack }: { matchId: string; gameIndex: number; onBack: () => void }) {
  const { matchData, saveData } = useAppContext();
  const match = matchData.find(m => m.id_tran_dau === matchId);
  const [editingPoint, setEditingPoint] = useState<PointData | 'new' | null>(null);

  if (!match) return <div>Trận đấu không tồn tại</div>;

  const currentGame = match.chi_tiet_game[gameIndex];

  const handleDeletePoint = async (point: PointData) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa điểm thứ ${point.thu_tu_diem}?`)) return;

    const updatedMatchData = [...matchData];
    const matchIdx = updatedMatchData.findIndex(m => m.id_tran_dau === matchId);
    let game = updatedMatchData[matchIdx].chi_tiet_game[gameIndex];

    // Remove the point
    game.danh_sach_diem = game.danh_sach_diem.filter(p => p.thu_tu_diem !== point.thu_tu_diem);
    
    // Reassign thu_tu_diem so there are no gaps
    game.danh_sach_diem = game.danh_sach_diem.map((p, idx) => ({
      ...p,
      thu_tu_diem: idx + 1
    }));

    // Recalculate everything
    game = recalculateGame(game, match.thong_tin.doi_thu_1, match.thong_tin.doi_thu_2);
    updatedMatchData[matchIdx].chi_tiet_game[gameIndex] = game;

    await saveData(updatedMatchData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-200">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-lg leading-tight">{match.thong_tin.doi_thu_1} vs {match.thong_tin.doi_thu_2}</h2>
          <div className="text-xs text-slate-500">Game {currentGame.game_so} - {currentGame.ty_so_bat_dau !== '0-0' ? `Chấp (${currentGame.ty_so_bat_dau})` : ''}</div>
        </div>
      </div>

      {editingPoint ? (
        <RallyWorkflow 
          match={match}
          gameIndex={gameIndex}
          initialData={editingPoint === 'new' ? null : editingPoint} 
          onCancel={() => setEditingPoint(null)}
          onSave={() => setEditingPoint(null)}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Timeline Game {currentGame.game_so}</h3>
            <button 
              onClick={() => setEditingPoint('new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover shadow-sm"
            >
              <Plus size={18} /> Thêm Rally
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 flex-1">
            <Timeline points={currentGame.danh_sach_diem} match={match} onEdit={setEditingPoint} onDelete={handleDeletePoint} />
          </div>
        </>
      )}
    </div>
  );
}


