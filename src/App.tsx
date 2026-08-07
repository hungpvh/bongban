
import React, { useState, useMemo } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { MatchData, PointData, TouchData, GameData } from './types';
import { Settings as SettingsIcon, Database, ArrowLeft, Filter, PieChart, Activity, Target, Crosshair, Users, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { MatchList } from './components/MatchList';
import { MatchDetail } from './components/MatchDetail';
import { RallyEntry } from './components/RallyEntry';
import { Settings } from './components/Settings';

// --- Utils ---
const safePct = (num: number, den: number) => den === 0 ? "0.0" : ((num / den) * 100).toFixed(1);
const getPlayerPerspective = (m: MatchData, perspective: string) => perspective === 'doi_thu_1' ? m.thong_tin.doi_thu_1 : m.thong_tin.doi_thu_2;
const getOpponentPerspective = (m: MatchData, perspective: string) => perspective === 'doi_thu_1' ? m.thong_tin.doi_thu_2 : m.thong_tin.doi_thu_1;
const isPointWon = (p: PointData, m: MatchData, perspective: string) => p.nguoi_ghi_diem === getPlayerPerspective(m, perspective);

const extractBall = (point: PointData, targetTouchNum: number) => {
    if (targetTouchNum === 1) return point.khoi_nguon_giao_bong;
    if (point.tong_so_cham === targetTouchNum) return point.cu_ket_thuc_N;
    if (point.tong_so_cham - 1 === targetTouchNum) return point.cu_dap_tra_N_1;
    if (point.tong_so_cham - 2 === targetTouchNum) return point.cu_tao_loi_the_N_2;
    return null;
}

const getSequence = (point: PointData) => {
    const seq = [];
    if (point.khoi_nguon_giao_bong) seq.push({ type: 'serve', touch: point.khoi_nguon_giao_bong, num: 1 });
    if (point.tong_so_cham >= 3 && point.cu_tao_loi_the_N_2) seq.push({ type: 'n-2', touch: point.cu_tao_loi_the_N_2, num: point.tong_so_cham - 2 });
    if (point.tong_so_cham >= 2 && point.cu_dap_tra_N_1) seq.push({ type: 'n-1', touch: point.cu_dap_tra_N_1, num: point.tong_so_cham - 1 });
    if (point.cu_ket_thuc_N) seq.push({ type: 'n', touch: point.cu_ket_thuc_N, num: point.tong_so_cham });
    return seq;
};

// --- Dashboard Component ---
function Dashboard({ matches, onBack, dictionary }: { matches: MatchData[], onBack: () => void, dictionary: any }) {
    const [perspective, setPerspective] = useState<'doi_thu_1' | 'doi_thu_2'>('doi_thu_1');
    const [filters, setFilters] = useState({
        matchId: 'all', opponent: 'all', startDate: '', endDate: '', gameSo: 'all'
    });
    const [activeTab, setActiveTab] = useState('overview');
    
    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            if (filters.matchId !== 'all' && m.id_tran_dau !== filters.matchId) return false;
            if (filters.opponent !== 'all' && m.thong_tin.doi_thu_2.trim() !== filters.opponent.trim()) return false;
            if (filters.startDate && m.thong_tin.ngay_thi_dau < filters.startDate) return false;
            if (filters.endDate && m.thong_tin.ngay_thi_dau > filters.endDate) return false;
            return true;
        });
    }, [matches, filters]);
    
    const flatPoints = useMemo(() => {
        const arr: { match: MatchData, game: GameData, point: PointData }[] = [];
        filteredMatches.forEach(m => {
            m.chi_tiet_game.forEach(g => {
                if (filters.gameSo !== 'all' && g.game_so.toString() !== filters.gameSo) return;
                g.danh_sach_diem.forEach(p => {
                    arr.push({ match: m, game: g, point: p });
                });
            });
        });
        return arr;
    }, [filteredMatches, filters]);

    const overview = useMemo(() => {
        let win = 0, lose = 0, serveW = 0, serveT = 0, recW = 0, recT = 0;
        let ball2W = 0, ball2T = 0, ball3W = 0, ball3T = 0, ball5W = 0, ball5T = 0;
        
        flatPoints.forEach(({match, point}) => {
            const me = getPlayerPerspective(match, perspective);
            const opp = getOpponentPerspective(match, perspective);
            const w = isPointWon(point, match, perspective);
            if (w) win++; else lose++;
            
            const server = point.khoi_nguon_giao_bong?.nguoi_thuc_hien;
            if (server === me) { serveT++; if (w) serveW++; }
            else if (server === opp) { recT++; if (w) recW++; }
            
            const b2 = extractBall(point, 2);
            if (b2 && b2.nguoi_thuc_hien === me) { ball2T++; if(w) ball2W++; }
            
            const b3 = extractBall(point, 3);
            if (b3 && b3.nguoi_thuc_hien === me) { ball3T++; if(w) ball3W++; }
            
            const b5 = extractBall(point, 5);
            if (b5 && b5.nguoi_thuc_hien === me) { ball5T++; if(w) ball5W++; }
        });
        
        let maxWinStreak = 0;
        let maxLoseStreak = 0;
        
        filteredMatches.forEach(m => {
            m.chi_tiet_game.forEach(g => {
                let curW = 0, curL = 0;
                g.danh_sach_diem.forEach(p => {
                    if (isPointWon(p, m, perspective)) {
                        curW++; curL = 0;
                        if (curW > maxWinStreak) maxWinStreak = curW;
                    } else {
                        curL++; curW = 0;
                        if (curL > maxLoseStreak) maxLoseStreak = curL;
                    }
                });
            });
        });
        
        return { 
            win, lose, serveW, serveT, recW, recT, 
            ball2W, ball2T, ball3W, ball3T, ball5W, ball5T,
            maxWinStreak, maxLoseStreak,
            total: flatPoints.length, totalMatches: filteredMatches.length, totalGames: filteredMatches.reduce((acc, m) => acc + m.chi_tiet_game.length, 0) 
        };
    }, [flatPoints, perspective, filteredMatches]);

    const techniques = useMemo(() => {
        const stats: Record<string, {used: number, win: number, lose: number}> = {};
        flatPoints.forEach(({match, point}) => {
            const me = getPlayerPerspective(match, perspective);
            const w = isPointWon(point, match, perspective);
            
            const seq = getSequence(point);
            seq.forEach(({touch}) => {
                if (touch.nguoi_thuc_hien === me && touch.ky_thuat) {
                    if (!stats[touch.ky_thuat]) stats[touch.ky_thuat] = {used:0, win:0, lose:0};
                    stats[touch.ky_thuat].used++;
                    if (w) stats[touch.ky_thuat].win++; else stats[touch.ky_thuat].lose++;
                }
            });
        });
        
        const combinedDict = {...(dictionary?.ky_thuat || {}), ...(dictionary?.loai_giao_bong || {})};
        return Object.entries(stats).map(([k, v]) => ({ 
            key: k, label: combinedDict[k] || k, ...v 
        })).sort((a,b) => b.used - a.used);
    }, [flatPoints, perspective, dictionary]);
    
    const serveAnalysis = useMemo(() => {
        const stats: Record<string, {used: number, win: number, lose: number, direct: number}> = {};
        flatPoints.forEach(({match, point}) => {
            const me = getPlayerPerspective(match, perspective);
            const w = isPointWon(point, match, perspective);
            
            const serve = point.khoi_nguon_giao_bong;
            if (serve && serve.nguoi_thuc_hien === me && serve.ky_thuat) {
                if (!stats[serve.ky_thuat]) stats[serve.ky_thuat] = {used:0, win:0, lose:0, direct:0};
                stats[serve.ky_thuat].used++;
                if (w) stats[serve.ky_thuat].win++; else stats[serve.ky_thuat].lose++;
                if (point.tong_so_cham === 1 || (point.tong_so_cham === 2 && point.cu_ket_thuc_N?.tinh_chat === 'forced_error')) {
                    if (w) stats[serve.ky_thuat].direct++;
                }
            }
        });
        const combinedDict = {...(dictionary?.ky_thuat || {}), ...(dictionary?.loai_giao_bong || {})};
        return Object.entries(stats).map(([k, v]) => ({ key: k, label: combinedDict[k] || k, ...v })).sort((a,b) => b.used - a.used);
    }, [flatPoints, perspective, dictionary]);

    const heatmap = useMemo(() => {
        const h: Record<string, {used: 0, win: 0}> = {};
        const rows = ['ngan', 'dai'];
        const cols = ['trai', 'giua', 'phai'];
        rows.forEach(r => cols.forEach(c => h[`${r}_${c}`] = {used: 0, win: 0}));

        flatPoints.forEach(({match, point}) => {
            const w = isPointWon(point, match, perspective);
            const me = getPlayerPerspective(match, perspective);
            const opp = getOpponentPerspective(match, perspective);
            const receiver = point.khoi_nguon_giao_bong?.nguoi_thuc_hien === me ? opp : me;
            const isMirrored = receiver === match.thong_tin.doi_thu_2;

            const seq = getSequence(point);
            seq.forEach(({touch}) => {
                if (touch.dac_tinh?.diem_roi_ngang && touch.dac_tinh?.do_dai) {
                    let ngang = touch.dac_tinh.diem_roi_ngang;
                    let doc = touch.dac_tinh.do_dai;
                    
                    if (isMirrored) {
                        ngang = ngang === 'trai' ? 'phai' : (ngang === 'phai' ? 'trai' : 'giua');
                        doc = doc === 'ngan' ? 'dai' : 'ngan';
                    }

                    const key = `${doc}_${ngang}`;
                    if (h[key]) {
                        h[key].used++;
                        if (w) h[key].win++;
                    }
                }
            });
        });
        return h;
    }, [flatPoints, perspective]);

    const getHeatmapColor = (used: number, maxUsed: number) => {
        if (used === 0) return 'bg-white/10';
        const ratio = used / maxUsed;
        if (ratio > 0.7) return 'bg-orange-500 shadow-md scale-105';
        if (ratio > 0.4) return 'bg-orange-400 shadow-sm';
        if (ratio > 0.1) return 'bg-orange-300';
        return 'bg-orange-200';
    };

    const maxHeatmap = Math.max(...Object.values(heatmap).map((v: any) => v.used));

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600"><ArrowLeft size={20}/></button>
                    <h2 className="font-bold text-lg sm:text-xl text-slate-800">Dashboard Phân Tích</h2>
                </div>
                <div className="flex w-full sm:w-auto overflow-hidden rounded-lg border border-slate-200">
                    <button onClick={() => setPerspective('doi_thu_1')} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold transition-colors ${perspective === 'doi_thu_1' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>GÓC NHÌN CỦA TÔI</button>
                    <button onClick={() => setPerspective('doi_thu_2')} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold transition-colors ${perspective === 'doi_thu_2' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>GÓC NHÌN ĐỐI THỦ</button>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar Filters */}
                <div className="w-full md:w-64 bg-white border-r md:h-full overflow-y-auto shrink-0 flex flex-col p-4 shadow-sm z-10 relative">
                    <div className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Filter size={18}/> Bộ lọc dữ liệu</div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trận đấu</label>
                            <select className="w-full p-2.5 border rounded-lg text-sm bg-slate-50" value={filters.matchId} onChange={e => setFilters({...filters, matchId: e.target.value})}>
                                <option value="all">Tất cả trận đấu</option>
                                {matches.map(m => <option key={m.id_tran_dau} value={m.id_tran_dau}>{m.thong_tin.doi_thu_1} vs {m.thong_tin.doi_thu_2}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Đối thủ</label>
                            <select className="w-full p-2.5 border rounded-lg text-sm bg-slate-50" value={filters.opponent} onChange={e => setFilters({...filters, opponent: e.target.value})}>
                                <option value="all">Tất cả đối thủ</option>
                                {Array.from(new Set(matches.map(m => m.thong_tin.doi_thu_2.trim()))).map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                        </div>
                        <button onClick={() => setFilters({ matchId: 'all', opponent: 'all', startDate: '', endDate: '', gameSo: 'all' })} className="w-full mt-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-200">Xóa bộ lọc</button>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/50">
                    <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl border shadow-sm sticky top-0 z-10">
                        
                        {[
                            {id: 'overview', label: 'Tổng quan', icon: <PieChart size={16}/>},
                            {id: 'technique', label: 'Kỹ thuật', icon: <Activity size={16}/>},
                            {id: 'serve', label: 'Giao bóng', icon: <Target size={16}/>},
                            {id: 'heatmap', label: 'Điểm rơi', icon: <Crosshair size={16}/>},
                            {id: 'pattern', label: 'Pattern', icon: <Zap size={16}/>},
                            {id: 'insight', label: 'Insight', icon: <TrendingUp size={16}/>},
                        ].map(t => (

                            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === t.id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    
                    {activeTab === 'overview' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Thống Kê Cơ Bản</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Số liệu chung</div>
                                    <div className="text-3xl font-black text-slate-800">{overview.totalMatches} <span className="text-lg font-medium text-slate-500">trận</span></div>
                                    <div className="text-sm font-medium text-slate-500 mt-1">{overview.totalGames} game • {overview.total} rally</div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5"><PieChart size={64}/></div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Point Win Rate</div>
                                    <div className="text-3xl font-black text-primary">{safePct(overview.win, overview.total)}%</div>
                                    <div className="text-sm font-medium text-slate-500 mt-1"><span className="text-primary">{overview.win}</span> thắng / <span className="text-danger">{overview.lose}</span> thua</div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Giao bóng</div>
                                    <div className="text-3xl font-black text-emerald-600">{safePct(overview.serveW, overview.serveT)}%</div>
                                    <div className="text-sm font-medium text-slate-500 mt-1">{overview.serveW} / {overview.serveT} (N)</div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Đỡ giao</div>
                                    <div className="text-3xl font-black text-blue-600">{safePct(overview.recW, overview.recT)}%</div>
                                    <div className="text-sm font-medium text-slate-500 mt-1">{overview.recW} / {overview.recT} (N)</div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mt-8">Conversion Rate (Tỷ lệ chuyển hóa)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">2nd Ball Attack</div>
                                    <div className="flex items-end gap-3">
                                        <div className="text-4xl font-black text-slate-800">{safePct(overview.ball2W, overview.ball2T)}%</div>
                                        <div className="text-sm font-medium text-slate-500 mb-1">{overview.ball2W} / {overview.ball2T} (N)</div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">3rd Ball Attack</div>
                                    <div className="flex items-end gap-3">
                                        <div className="text-4xl font-black text-slate-800">{safePct(overview.ball3W, overview.ball3T)}%</div>
                                        <div className="text-sm font-medium text-slate-500 mb-1">{overview.ball3W} / {overview.ball3T} (N)</div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">5th Ball Attack</div>
                                    <div className="flex items-end gap-3">
                                        <div className="text-4xl font-black text-slate-800">{safePct(overview.ball5W, overview.ball5T)}%</div>
                                        <div className="text-sm font-medium text-slate-500 mb-1">{overview.ball5W} / {overview.ball5T} (N)</div>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mt-8">Streak / Momentum</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl border-2 border-primary/20 shadow-sm flex items-center justify-between">
                                    <div>
                                        <div className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Chuỗi thắng dài nhất</div>
                                        <div className="text-sm font-medium text-slate-600">Trong một game</div>
                                    </div>
                                    <div className="text-4xl font-black text-primary">{overview.maxWinStreak}</div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border-2 border-danger/20 shadow-sm flex items-center justify-between">
                                    <div>
                                        <div className="text-danger text-xs font-bold uppercase tracking-wider mb-1">Chuỗi thua dài nhất</div>
                                        <div className="text-sm font-medium text-slate-600">Trong một game</div>
                                    </div>
                                    <div className="text-4xl font-black text-danger">{overview.maxLoseStreak}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'technique' && (
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden max-w-5xl mx-auto">
                            <div className="p-5 border-b bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={20} className="text-primary"/> Hiệu quả Kỹ thuật (Technique Success Rate)</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-100/50 text-slate-500 border-b">
                                        <tr>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs">Kỹ thuật</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Số lần (N)</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Thắng / Thua</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Success Rate</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">% Tổng điểm thắng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {techniques.map(t => (
                                            <tr key={t.key} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-800">{t.label}</td>
                                                <td className="p-4 text-right font-medium text-slate-600">{t.used}</td>
                                                <td className="p-4 text-right">
                                                    <span className="text-primary font-bold">{t.win}</span> <span className="text-slate-300">/</span> <span className="text-danger font-bold">{t.lose}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${(t.win/t.used) >= 0.5 ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                                                        {safePct(t.win, t.used)}%
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-medium text-slate-500">
                                                    {safePct(t.win, overview.win)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'serve' && (
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden max-w-5xl mx-auto">
                            <div className="p-5 border-b bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target size={20} className="text-primary"/> Phân tích Giao bóng (Serve Analysis)</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-100/50 text-slate-500 border-b">
                                        <tr>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs">Loại Giao bóng</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Số lần (N)</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Point Win Rate</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Điểm trực tiếp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {serveAnalysis.map(t => (
                                            <tr key={t.key} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-800">{t.label}</td>
                                                <td className="p-4 text-right font-medium text-slate-600">{t.used}</td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-slate-800">{safePct(t.win, t.used)}%</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-primary font-bold">{t.direct}</span>
                                                    <span className="text-slate-400 text-xs ml-2">({safePct(t.direct, t.used)}%)</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'heatmap' && (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <div className="bg-white rounded-2xl border shadow-sm p-6">
                                <div className="text-center mb-6">
                                    <h3 className="font-bold text-xl text-slate-800">Bản đồ Điểm rơi</h3>
                                    <p className="text-slate-500 text-sm mt-1">Được xoay chuẩn xác theo góc nhìn của người nhận bóng.</p>
                                </div>
                                
                                <div className="bg-[#2a5b3f] aspect-[3/2] w-full max-w-lg mx-auto rounded-xl border-4 border-white shadow-inner relative flex flex-col p-2 gap-2">
                                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/30 -translate-y-1/2"></div>
                                    <div className="absolute top-0 left-1/2 w-[2px] h-full bg-white/30 -translate-x-1/2"></div>
                                    
                                    {['ngan', 'dai'].map((r) => (
                                        <div key={r} className="flex flex-1 gap-2 z-10">
                                            {['trai', 'giua', 'phai'].map((c) => {
                                                const key = `${r}_${c}`;
                                                const data = heatmap[key];
                                                const colorClass = getHeatmapColor(data.used, maxHeatmap);
                                                return (
                                                    <div key={c} className={`flex-1 rounded flex flex-col items-center justify-center transition-all ${colorClass} ${data.used === 0 ? 'border border-white/10' : ''}`}>
                                                        {data.used > 0 && (
                                                            <>
                                                                <div className="text-white font-black text-xl drop-shadow">{data.used}</div>
                                                                <div className="text-white/80 font-bold text-xs uppercase tracking-wider">{safePct(data.win, data.used)}% win</div>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                

                    {activeTab === 'pattern' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
                                <Zap size={48} className="mx-auto mb-4 text-primary opacity-50"/>
                                <h3 className="font-bold text-xl text-slate-800 mb-2">Chiến Thuật / Pattern</h3>
                                <p className="text-slate-500 max-w-lg mx-auto">Chức năng phân tích kết hợp Giao bóng &rarr; Đỡ giao &rarr; Tấn công đang được tổng hợp dữ liệu, sẽ hiển thị pattern ghi điểm nhiều nhất của bạn.</p>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'insight' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm p-8">
                                <h3 className="font-bold text-2xl text-indigo-900 mb-6 flex items-center gap-2"><TrendingUp/> Training Insight</h3>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                                        <div className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-lg"><Activity className="text-emerald-500"/> Khuyến nghị tập luyện</div>
                                        <ul className="space-y-3 mt-4 text-slate-600">
                                            {techniques.length > 0 && techniques.some((t: any) => t.used > 5 && (t.win/t.used) < 0.4) ? (
                                                techniques.filter((t: any) => t.used > 5 && (t.win/t.used) < 0.4).slice(0,2).map((t: any) => (
                                                    <li key={t.key} className="flex gap-2 items-start"><AlertTriangle size={16} className="text-amber-500 mt-1 shrink-0"/> Cải thiện độ ổn định của <strong>{t.label}</strong> (hiệu suất chỉ đạt {safePct(t.win, t.used)}%)</li>
                                                ))
                                            ) : (
                                                <li className="flex gap-2 items-start"><AlertTriangle size={16} className="text-emerald-500 mt-1 shrink-0"/> Các kỹ thuật hiện tại đang có hiệu suất ổn định.</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                                        <div className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-lg"><Zap className="text-amber-500"/> Điểm mạnh nổi bật</div>
                                        <ul className="space-y-3 mt-4 text-slate-600">
                                            {techniques.length > 0 && techniques.some((t: any) => t.used > 5 && (t.win/t.used) >= 0.6) ? (
                                                techniques.filter((t: any) => t.used > 5 && (t.win/t.used) >= 0.6).slice(0,2).map((t: any) => (
                                                    <li key={t.key} className="flex gap-2 items-start"><Target size={16} className="text-emerald-500 mt-1 shrink-0"/> Phát huy <strong>{t.label}</strong> (tỷ lệ ghi điểm {safePct(t.win, t.used)}%)</li>
                                                ))
                                            ) : (
                                                <li className="flex gap-2 items-start"><Target size={16} className="text-amber-500 mt-1 shrink-0"/> Cần thêm dữ liệu trận đấu để tìm ra điểm mạnh tuyệt đối.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}

// --- App Content Overlay ---

function AppContent() {
  const { isConfigured, isLoading, error, dataMode, matchData, dictionary } = useAppContext();
  const [showSettings, setShowSettings] = useState(!isConfigured);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);
  
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardMatchId, setDashboardMatchId] = useState<'all' | string>('all');

  if (showSettings) {
    return <Settings onComplete={() => setShowSettings(false)} />;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-slate-600 animate-pulse">Đang tải dữ liệu...</div>
      </div>
    );
  }
  
  if (showDashboard) {
      return (
          <Dashboard 
              matches={matchData} // Filter is inside Dashboard
              dictionary={dictionary}
              onBack={() => setShowDashboard(false)} 
          />
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b px-4 py-3 flex flex-col gap-2 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Sổ Tay Bóng Bàn</h1>
            <div className="flex gap-2">
                <button onClick={() => { setDashboardMatchId('all'); setShowDashboard(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-100 flex items-center gap-2 transition-colors"><PieChart size={18}/> Bảng Phân Tích</button>
                <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                    <SettingsIcon size={24} />
                </button>
            </div>
        </div>
        
        {dataMode === 'mock' ? (
            <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg self-start">
                <Database size={14} /> CHẾ ĐỘ DỮ LIỆU MẪU - Không lưu vĩnh viễn
            </div>
        ) : (
            <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-green-100 text-green-800 rounded-lg self-start">
                <Database size={14} /> DỮ LIỆU GITHUB
            </div>
        )}
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col">
        {!selectedMatchId ? (
          <MatchList 
            onSelectMatch={setSelectedMatchId} 
            onAnalyzeMatch={(id) => { setDashboardMatchId(id); setShowDashboard(true); }}
          />
        ) : selectedGameIndex === null ? (
          <MatchDetail 
             matchId={selectedMatchId} 
             onBack={() => setSelectedMatchId(null)} 
             onSelectGame={setSelectedGameIndex}
          />
        ) : (
          <RallyEntry 
             matchId={selectedMatchId} 
             gameIndex={selectedGameIndex}
            onBack={() => setSelectedGameIndex(null)} 
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
