import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { GameData, MatchData } from '../types';
import { Settings as SettingsIcon, ChevronLeft, Plus, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { GameModal } from './GameModal';

export function MatchDetail({ matchId, onBack, onSelectGame }: { matchId: string, onBack: () => void, onSelectGame: (gameIndex: number) => void }) {
  const { matchData, saveData } = useAppContext();
  const match = matchData.find(m => m.id_tran_dau === matchId);
  const [editingGameIndex, setEditingGameIndex] = useState<number | 'new' | null>(null);

  if (!match) return <div>Trận đấu không tồn tại</div>;

  const handleSaveGame = async (gameData: Omit<GameData, 'danh_sach_diem'>) => {
    const updatedMatchData = [...matchData];
    const matchIndex = updatedMatchData.findIndex(m => m.id_tran_dau === matchId);
    const matchToUpdate = updatedMatchData[matchIndex];
    
    if (editingGameIndex === 'new') {
        const newGame: GameData = {
            ...gameData,
            danh_sach_diem: []
        };
        matchToUpdate.chi_tiet_game.push(newGame);
    } else if (typeof editingGameIndex === 'number') {
        // Just update metadata, keeping danh_sach_diem
        matchToUpdate.chi_tiet_game[editingGameIndex] = {
            ...matchToUpdate.chi_tiet_game[editingGameIndex],
            ...gameData
        };
        // TODO: We need to trigger recalculation of the entire timeline if ty_so_bat_dau or nguoi_giao_bong_truoc changed
        const { recalculateGame } = await import('../lib/gameLogic');
        matchToUpdate.chi_tiet_game[editingGameIndex] = recalculateGame(
            matchToUpdate.chi_tiet_game[editingGameIndex],
            matchToUpdate.thong_tin.doi_thu_1,
            matchToUpdate.thong_tin.doi_thu_2
        );
    }

    await saveData(updatedMatchData);
    setEditingGameIndex(null);
  };

  const handleDeleteGame = async (index: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa Game này không? Tất cả dữ liệu rally và timeline của Game này sẽ bị xóa.")) {
        const updatedMatchData = [...matchData];
        const matchIndex = updatedMatchData.findIndex(m => m.id_tran_dau === matchId);
        updatedMatchData[matchIndex].chi_tiet_game.splice(index, 1);
        await saveData(updatedMatchData);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-200">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="font-bold text-xl leading-tight">{match.thong_tin.doi_thu_1} vs {match.thong_tin.doi_thu_2}</h2>
          <div className="text-sm text-slate-500">{match.thong_tin.ngay_thi_dau}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 mt-4">
        <h3 className="font-bold text-lg text-slate-800">Danh sách Game</h3>
        <button 
          onClick={() => setEditingGameIndex('new')}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover shadow-sm text-sm"
        >
          <Plus size={16} /> Thêm Game mới
        </button>
      </div>

      {match.chi_tiet_game.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-dashed">
            Chưa có Game nào.
        </div>
      ) : (
        <div className="grid gap-4">
          {match.chi_tiet_game.map((game, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border hover:shadow-md transition-all group flex items-center justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => onSelectGame(idx)}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-lg">Game {game.game_so}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${game.trang_thai === 'hoan_thanh' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                    {game.ty_so_chung_cuoc}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>Bắt đầu: {game.ty_so_bat_dau}</span>
                  <span>Giao bóng trước: {game.nguoi_giao_bong_truoc}</span>
                  <span>Số rally: {game.danh_sach_diem.length}</span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={(e) => { e.stopPropagation(); setEditingGameIndex(idx); }} className="p-2 text-slate-400 hover:text-primary"><Edit2 size={16}/></button>
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteGame(idx); }} className="p-2 text-slate-400 hover:text-danger"><Trash2 size={16}/></button>
              </div>
              <ChevronRight className="text-slate-300 ml-2" />
            </div>
          ))}
        </div>
      )}

      {editingGameIndex !== null && (
        <GameModal 
          initialData={editingGameIndex === 'new' ? null : match.chi_tiet_game[editingGameIndex]}
          player1={match.thong_tin.doi_thu_1}
          player2={match.thong_tin.doi_thu_2}
          suggestedGameNumber={editingGameIndex === 'new' ? (match.chi_tiet_game.length > 0 ? match.chi_tiet_game[match.chi_tiet_game.length - 1].game_so + 1 : 1) : undefined}
          onSave={handleSaveGame}
          onClose={() => setEditingGameIndex(null)}
        />
      )}
    </div>
  );
}
