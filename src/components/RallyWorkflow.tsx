import React, { useState, useEffect, useMemo } from 'react';
import { MatchData, PointData, TouchData } from '../types';
import { useAppContext } from '../context/AppContext';
import { TouchCard } from './TouchCard';
import { Save, X } from 'lucide-react';
import { recalculateGame, calculateServer, parseScore } from '../lib/gameLogic';

interface Props {
  match: MatchData;
  gameIndex: number;
  initialData: PointData | null;
  onCancel: () => void;
  onSave: () => void;
}

export function RallyWorkflow({ match, gameIndex, initialData, onCancel, onSave }: Props) {
  const { dictionary, saveData, matchData } = useAppContext();
  
  const game = match.chi_tiet_game[gameIndex];
  
  // Calculate server for this point if it's new
  const calculatedServer = useMemo(() => {
    if (initialData?.khoi_nguon_giao_bong?.nguoi_thuc_hien) {
      return initialData.khoi_nguon_giao_bong.nguoi_thuc_hien;
    }
    const currentPointIndex = initialData ? game.danh_sach_diem.findIndex(p => p.thu_tu_diem === initialData.thu_tu_diem) : game.danh_sach_diem.length;
    const startingScore = parseScore(game.ty_so_bat_dau || "0-0");
    let p1Score = startingScore.p1;
    let p2Score = startingScore.p2;
    for (let i = 0; i < currentPointIndex; i++) {
      if (game.danh_sach_diem[i].loai_diem === 'thang') p1Score++;
      else p2Score++;
    }
    const totalScoreBeforePoint = p1Score + p2Score;
    return calculateServer(totalScoreBeforePoint, game.nguoi_giao_bong_truoc || match.thong_tin.doi_thu_1, match.thong_tin.doi_thu_1, match.thong_tin.doi_thu_2);
  }, [game, match.thong_tin, initialData]);

  // State
  const [step, setStep] = useState(1);
  const [tongSoCham, setTongSoCham] = useState<number>(initialData?.tong_so_cham || 1);
  const [loaiDiem, setLoaiDiem] = useState<'thang' | 'thua' | null>(initialData?.loai_diem || null);
  const [huongNhap, setHuongNhap] = useState<'xuoi' | 'nguoc'>('nguoc'); // Default nguoc for video analysis

  // Data states
  const [khoiNguon, setKhoiNguon] = useState<TouchData | null>(initialData?.khoi_nguon_giao_bong || {
    nguoi_thuc_hien: calculatedServer,
    ky_thuat: '',
    dac_tinh: { diem_roi_ngang: null, do_dai: null, do_xoay: null, vi_tri_hong: null }
  });
  const [cuN2, setCuN2] = useState<TouchData | null>(initialData?.cu_tao_loi_the_N_2 || null);
  const [cuN1, setCuN1] = useState<TouchData | null>(initialData?.cu_dap_tra_N_1 || null);
  const [cuN, setCuN] = useState<TouchData | null>(initialData?.cu_ket_thuc_N || null);

  const getOtherPlayer = (p: string) => p === match.thong_tin.doi_thu_1 ? match.thong_tin.doi_thu_2 : match.thong_tin.doi_thu_1;

  const handleSetCuN = (touch: TouchData | null) => {
    setCuN(touch);
    if (touch && touch.nguoi_thuc_hien) {
      const actor = touch.nguoi_thuc_hien;
      const other = getOtherPlayer(actor);
      if (cuN1) setCuN1(prev => prev ? { ...prev, nguoi_thuc_hien: other } : null);
      if (cuN2) setCuN2(prev => prev ? { ...prev, nguoi_thuc_hien: actor } : null);
    }
  };

  const handleSetCuN1 = (touch: TouchData | null) => {
    setCuN1(touch);
    if (touch && touch.nguoi_thuc_hien) {
      const actor = touch.nguoi_thuc_hien;
      const other = getOtherPlayer(actor);
      if (cuN) setCuN(prev => prev ? { ...prev, nguoi_thuc_hien: other } : null);
      if (cuN2) setCuN2(prev => prev ? { ...prev, nguoi_thuc_hien: other } : null);
    }
  };

  const handleSetCuN2 = (touch: TouchData | null) => {
    setCuN2(touch);
    if (touch && touch.nguoi_thuc_hien) {
      const actor = touch.nguoi_thuc_hien;
      const other = getOtherPlayer(actor);
      if (cuN1) setCuN1(prev => prev ? { ...prev, nguoi_thuc_hien: other } : null);
      if (cuN) setCuN(prev => prev ? { ...prev, nguoi_thuc_hien: actor } : null);
    }
  };

  const currentServer = khoiNguon?.nguoi_thuc_hien || calculatedServer;
  const serveReceiver = currentServer === match.thong_tin.doi_thu_1 ? match.thong_tin.doi_thu_2 : match.thong_tin.doi_thu_1;

  const handleSave = async () => {
    // Validation here...
    if (!loaiDiem || !khoiNguon) {
      alert("Vui lòng điền đủ thông tin cơ bản");
      return;
    }
    
    // Construct PointData
    const newPoint: PointData = {
      thu_tu_diem: initialData ? initialData.thu_tu_diem : (match.chi_tiet_game[gameIndex].danh_sach_diem.length + 1),
      ty_so_hien_tai: initialData ? initialData.ty_so_hien_tai : "0-0", // Will be recalculated
      loai_diem: loaiDiem,
      nguoi_ghi_diem: loaiDiem === 'thang' ? match.thong_tin.doi_thu_1 : match.thong_tin.doi_thu_2,
      tong_so_cham: tongSoCham,
      khoi_nguon_giao_bong: khoiNguon,
      cu_tao_loi_the_N_2: tongSoCham >= 3 ? cuN2 : null,
      cu_dap_tra_N_1: tongSoCham >= 2 ? cuN1 : null,
      cu_ket_thuc_N: cuN
    };

    // Replace or append
    const updatedMatchData = [...matchData];
    const matchIndex = updatedMatchData.findIndex(m => m.id_tran_dau === match.id_tran_dau);
    let game = updatedMatchData[matchIndex].chi_tiet_game[gameIndex];
    
    if (initialData) {
      const pIdx = game.danh_sach_diem.findIndex(p => p.thu_tu_diem === initialData.thu_tu_diem);
      game.danh_sach_diem[pIdx] = newPoint;
    } else {
      game.danh_sach_diem.push(newPoint);
    }

    // Recalculate Game timeline (scores and servers)
    game = recalculateGame(game, match.thong_tin.doi_thu_1, match.thong_tin.doi_thu_2);
    updatedMatchData[matchIndex].chi_tiet_game[gameIndex] = game;

    await saveData(updatedMatchData);
    onSave();
  };


  // Render Step 1: Số chạm
  if (step === 1) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border">
        <h3 className="font-bold text-lg mb-4">1. Tổng số chạm trong rally</h3>
        <div className="flex flex-wrap gap-3">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button
              key={n}
              onClick={() => setTongSoCham(n)}
              className={`w-14 h-14 rounded-xl text-xl font-bold transition-colors ${tongSoCham === n ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={onCancel} className="px-6 py-3 rounded-lg text-slate-600 font-medium">Hủy</button>
          <button onClick={() => setStep(2)} className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover">Tiếp theo</button>
        </div>
      </div>
    );
  }

  // Render Step 2: Kết quả
  if (step === 2) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border">
        <h3 className="font-bold text-lg mb-4">2. Kết quả điểm</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setLoaiDiem('thang')}
            className={`flex-1 p-6 rounded-xl border-2 text-lg font-bold transition-all ${loaiDiem === 'thang' ? 'border-success bg-success/10 text-success' : 'border-slate-200 text-slate-600 hover:border-success hover:text-success'}`}
          >
            Tôi thắng điểm
          </button>
          <button
            onClick={() => setLoaiDiem('thua')}
            className={`flex-1 p-6 rounded-xl border-2 text-lg font-bold transition-all ${loaiDiem === 'thua' ? 'border-danger bg-danger/10 text-danger' : 'border-slate-200 text-slate-600 hover:border-danger hover:text-danger'}`}
          >
            Đối thủ thắng
          </button>
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep(1)} className="px-6 py-3 rounded-lg text-slate-600 font-medium">Quay lại</button>
          <button disabled={!loaiDiem} onClick={() => setStep(tongSoCham === 1 ? 4 : 3)} className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50">Tiếp theo</button>
        </div>
      </div>
    );
  }

  // Render Step 3: Hướng nhập (if touches >= 2)
  if (step === 3 && tongSoCham >= 2) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border">
        <h3 className="font-bold text-lg mb-4">3. Hướng nhập dữ liệu</h3>
        <p className="text-slate-500 mb-6 text-sm">Khi xem lại video, bạn thường dễ nhớ quả cuối cùng trước.</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setHuongNhap('nguoc')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${huongNhap === 'nguoc' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'}`}
          >
            <div className="font-bold text-slate-800">Nhập Ngược (Khuyên dùng)</div>
            <div className="text-sm text-slate-500">Pha cuối (N) → N-1 → N-2</div>
          </button>
          <button
            onClick={() => setHuongNhap('xuoi')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${huongNhap === 'xuoi' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'}`}
          >
            <div className="font-bold text-slate-800">Nhập Xuôi</div>
            <div className="text-sm text-slate-500">Giao bóng → N-2 → N-1 → N</div>
          </button>
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep(2)} className="px-6 py-3 rounded-lg text-slate-600 font-medium">Quay lại</button>
          <button onClick={() => setStep(4)} className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover">Bắt đầu nhập</button>
        </div>
      </div>
    );
  }


  const knownNActor = cuN?.nguoi_thuc_hien || (cuN2?.nguoi_thuc_hien) || (cuN1?.nguoi_thuc_hien ? getOtherPlayer(cuN1.nguoi_thuc_hien) : null);
  const knownN1Actor = cuN1?.nguoi_thuc_hien || (knownNActor ? getOtherPlayer(knownNActor) : null);
  const knownN2Actor = knownNActor;

  // Render Step 4: Data Entry
  // Prepare sequence based on direction
  let sequence: { title: string; touch: TouchData | null; setTouch: (t: TouchData | null) => void; isOptional?: boolean; isServe?: boolean; isLast?: boolean; expectedActor?: string }[] = [];
  
  if (tongSoCham === 1) {
    sequence = [
      { title: "Giao bóng (Kết thúc)", touch: khoiNguon, setTouch: setKhoiNguon, isServe: true, isLast: true }
    ];
  } else if (huongNhap === 'nguoc') {
    sequence.push({ title: `Pha cuối (N)`, touch: cuN, setTouch: handleSetCuN, isLast: true, expectedActor: knownNActor || undefined });
    if (tongSoCham >= 2) sequence.push({ title: `Pha (N-1)`, touch: cuN1, setTouch: handleSetCuN1, isOptional: true, expectedActor: knownN1Actor || undefined });
    if (tongSoCham >= 3) sequence.push({ title: `Pha (N-2)`, touch: cuN2, setTouch: handleSetCuN2, isOptional: true, expectedActor: knownN2Actor || undefined });
    sequence.push({ title: "Giao bóng", touch: khoiNguon, setTouch: setKhoiNguon, isServe: true });
  } else {
    sequence.push({ title: "Giao bóng", touch: khoiNguon, setTouch: setKhoiNguon, isServe: true });
    if (tongSoCham >= 3) sequence.push({ title: `Pha (N-2)`, touch: cuN2, setTouch: handleSetCuN2, isOptional: true, expectedActor: knownN2Actor || undefined });
    if (tongSoCham >= 2) sequence.push({ title: `Pha (N-1)`, touch: cuN1, setTouch: handleSetCuN1, isOptional: true, expectedActor: knownN1Actor || undefined });
    sequence.push({ title: `Pha cuối (N)`, touch: cuN, setTouch: handleSetCuN, isLast: true, expectedActor: knownNActor || undefined });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border sticky top-[72px] z-10">
        <div className="font-semibold text-slate-700">Chi tiết {tongSoCham} chạm</div>
        <div className="flex gap-2">
            <button onClick={() => setStep(tongSoCham === 1 ? 2 : 3)} className="px-4 py-2 text-slate-600 font-medium">Quay lại</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-medium shadow hover:bg-primary-hover">
                <Save size={18} /> Lưu Rally
            </button>
        </div>
      </div>

      {sequence.map((seq, idx) => (
        <TouchCard 
          key={idx}
          title={seq.title}
          data={seq.touch}
          onChange={seq.setTouch}
          isOptional={seq.isOptional}
          isServe={seq.isServe}
          isLast={seq.isLast}
          player1={match.thong_tin.doi_thu_1}
          player2={match.thong_tin.doi_thu_2}
          serveReceiver={serveReceiver}
          expectedActor={seq.expectedActor}
        />
      ))}
    </div>
  );
}
