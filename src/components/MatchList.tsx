import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MatchData } from '../types';
import { 
  Calendar, User, Trash2, Edit2, Plus, 
  BarChart2, FileText, ChevronRight, Check, X
} from 'lucide-react';

export function MatchList({ 
  onSelectMatch,
  onAnalyzeMatch 
}: { 
  onSelectMatch: (id: string) => void;
  onAnalyzeMatch?: (id: string) => void;
}) {
  const { matchData, saveData } = useAppContext();
  
  const [editingMatch, setEditingMatch] = useState<MatchData | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    ngay_thi_dau: new Date().toISOString().split('T')[0],
    loai_hinh: 'Giao hữu',
    doi_thu_1: 'Hungpv',
    doi_thu_2: '',
    chap_bong: 'Không chấp',
    ket_qua: '0-0',
    mo_ta: '',
    link_video: '',
    autoUpdateResult: true,
  });

  const resetForm = () => {
    setFormData({
      ngay_thi_dau: new Date().toISOString().split('T')[0],
      loai_hinh: 'Giao hữu',
      doi_thu_1: 'Hungpv',
      doi_thu_2: '',
      chap_bong: 'Không chấp',
      ket_qua: '0-0',
      mo_ta: '',
      link_video: '',
      autoUpdateResult: true,
    });
    setEditingMatch(null);
    setIsAdding(false);
  };

  const calculateAutoResult = (games: any[]) => {
    let p1 = 0;
    let p2 = 0;
    games.forEach(g => {
      const parts = g.ty_so_chung_cuoc.split('-');
      if (parts.length === 2) {
        const s1 = parseInt(parts[0], 10);
        const s2 = parseInt(parts[1], 10);
        if (!isNaN(s1) && !isNaN(s2)) {
          if (s1 > s2) p1++;
          else if (s2 > s1) p2++;
        }
      }
    });
    return `${p1}-${p2}`;
  };

  const handleSave = async () => {
    if (!formData.doi_thu_2.trim()) {
      alert("Vui lòng nhập đối thủ 2!");
      return;
    }
    
    let newData = [...matchData];
    if (editingMatch) {
      // Update
      newData = newData.map(m => {
        if (m.id_tran_dau === editingMatch.id_tran_dau) {
          const finalResult = formData.autoUpdateResult 
            ? calculateAutoResult(m.chi_tiet_game) 
            : formData.ket_qua;
          return {
            ...m,
            thong_tin: {
              ...m.thong_tin,
              ngay_thi_dau: formData.ngay_thi_dau,
              loai_hinh: formData.loai_hinh,
              doi_thu_1: formData.doi_thu_1,
              doi_thu_2: formData.doi_thu_2,
              chap_bong: formData.chap_bong,
              ket_qua: finalResult,
              mo_ta: formData.mo_ta,
              link_video: formData.link_video,
            }
          };
        }
        return m;
      });
    } else {
      // Add new
      const newMatch: MatchData = {
        id_tran_dau: `match_${Date.now()}`,
        thong_tin: {
          ngay_thi_dau: formData.ngay_thi_dau,
          loai_hinh: formData.loai_hinh,
          doi_thu_1: formData.doi_thu_1,
          doi_thu_2: formData.doi_thu_2,
          chap_bong: formData.chap_bong,
          ket_qua: formData.autoUpdateResult ? '0-0' : formData.ket_qua,
          mo_ta: formData.mo_ta,
          link_video: formData.link_video,
        },
        chi_tiet_game: []
      };
      newData = [newMatch, ...newData];
    }
    await saveData(newData);
    resetForm();
  };

  const startEdit = (match: MatchData) => {
    setEditingMatch(match);
    setFormData({
      ngay_thi_dau: match.thong_tin.ngay_thi_dau || '',
      loai_hinh: match.thong_tin.loai_hinh || 'Giao hữu',
      doi_thu_1: match.thong_tin.doi_thu_1 || 'Hungpv',
      doi_thu_2: match.thong_tin.doi_thu_2 || '',
      chap_bong: match.thong_tin.chap_bong || 'Không chấp',
      ket_qua: match.thong_tin.ket_qua || '0-0',
      mo_ta: match.thong_tin.mo_ta || '',
      link_video: match.thong_tin.link_video || '',
      autoUpdateResult: true, // Default to true when editing
    });
    setIsAdding(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const newData = matchData.filter(m => m.id_tran_dau !== deletingId);
    await saveData(newData);
    setDeletingId(null);
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Danh sách trận đấu</h2>
        <button 
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium text-sm transition-colors flex items-center gap-1"
        >
          <Plus size={16} /> Thêm Trận Mới
        </button>
      </div>

      {matchData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border text-slate-500">
          Chưa có dữ liệu trận đấu. Hãy tạo trận mới.
        </div>
      ) : (
        <div className="grid gap-4">
          {matchData.map((match) => (
            <div
              key={match.id_tran_dau}
              className="bg-white p-4 rounded-xl border text-left hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg text-slate-800">
                    {match.thong_tin.doi_thu_1} <span className="text-slate-400 font-normal">vs</span> {match.thong_tin.doi_thu_2}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 text-xs font-semibold rounded text-slate-600">
                    {match.thong_tin.ket_qua}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={14}/> {match.thong_tin.ngay_thi_dau}</span>
                  <span className="flex items-center gap-1"><User size={14}/> {match.thong_tin.loai_hinh}</span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {match.chi_tiet_game.length} game
                  </span>
                  {match.thong_tin.link_video && (
                    <a href={match.thong_tin.link_video} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Video
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                <button 
                  onClick={() => onSelectMatch(match.id_tran_dau)}
                  className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                   Xem
                </button>
                <button 
                  onClick={() => onSelectMatch(match.id_tran_dau)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <FileText size={14}/> Nhập điểm
                </button>
                <button 
                  onClick={() => onAnalyzeMatch ? onAnalyzeMatch(match.id_tran_dau) : onSelectMatch(match.id_tran_dau)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                  <BarChart2 size={14}/> Phân tích
                </button>
                <button 
                  onClick={() => startEdit(match)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  title="Sửa trận đấu"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setDeletingId(match.id_tran_dau)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Xóa trận đấu"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xóa trận đấu?</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn xóa trận đấu này? Toàn bộ dữ liệu của trận đấu sẽ bị mất và không thể khôi phục.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
              >
                Hủy
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl my-8 relative">
            <button 
              onClick={resetForm}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 mb-6">
              {editingMatch ? 'Sửa trận đấu' : 'Thêm trận mới'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày thi đấu</label>
                <input 
                  type="date" 
                  value={formData.ngay_thi_dau}
                  onChange={(e) => setFormData({...formData, ngay_thi_dau: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại hình</label>
                <select 
                  value={formData.loai_hinh}
                  onChange={(e) => setFormData({...formData, loai_hinh: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                >
                  <option value="Giao hữu">Giao hữu</option>
                  <option value="Đánh bia">Đánh bia</option>
                  <option value="Thi đấu giải">Thi đấu giải</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đối thủ 1 (Mình)</label>
                <input 
                  type="text" 
                  value={formData.doi_thu_1}
                  onChange={(e) => setFormData({...formData, doi_thu_1: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đối thủ 2 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.doi_thu_2}
                  onChange={(e) => setFormData({...formData, doi_thu_2: e.target.value})}
                  placeholder="Nhập tên đối thủ"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chấp bóng</label>
                <input 
                  type="text" 
                  value={formData.chap_bong}
                  onChange={(e) => setFormData({...formData, chap_bong: e.target.value})}
                  placeholder="VD: Không chấp, Tôi chấp 2"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kết quả</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.ket_qua}
                    disabled={formData.autoUpdateResult}
                    onChange={(e) => setFormData({...formData, ket_qua: e.target.value})}
                    placeholder="VD: 3-2"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600 shrink-0 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.autoUpdateResult}
                      onChange={(e) => setFormData({...formData, autoUpdateResult: e.target.checked})}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    Tự tính
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Link Video</label>
                <input 
                  type="text" 
                  value={formData.link_video}
                  onChange={(e) => setFormData({...formData, link_video: e.target.value})}
                  placeholder="URL YouTube, Facebook..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea 
                  value={formData.mo_ta}
                  onChange={(e) => setFormData({...formData, mo_ta: e.target.value})}
                  placeholder="Ghi chú về trận đấu..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={resetForm}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.doi_thu_2.trim()}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={16} /> Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
