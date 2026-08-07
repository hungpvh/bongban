const fs = require('fs');

const appFile = `
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
    
    // --- Data Processing ---
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

    // Overview Stats
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
            
            // Attacks
            const b2 = extractBall(point, 2);
            if (b2 && b2.nguoi_thuc_hien === me) { ball2T++; if(w) ball2W++; }
            
            const b3 = extractBall(point, 3);
            if (b3 && b3.nguoi_thuc_hien === me) { ball3T++; if(w) ball3W++; }
            
            const b5 = extractBall(point, 5);
            if (b5 && b5.nguoi_thuc_hien === me) { ball5T++; if(w) ball5W++; }
        });
        
        // Streak finding (game by game)
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

    // Technique Analysis
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
        
        const dictTech = dictionary?.ky_thuat || {};
        const dictServe = dictionary?.loai_giao_bong || {};
        const combinedDict = {...dictTech, ...dictServe};
        
        return Object.entries(stats).map(([k, v]) => ({ 
            key: k, label: combinedDict[k] || k, ...v 
        })).sort((a,b) => b.used - a.used);
    }, [flatPoints, perspective, dictionary]);
    
    // Serve Analysis
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
                
                // Direct win?
                if (point.tong_so_cham === 1 || (point.tong_so_cham === 2 && point.cu_ket_thuc_N?.tinh_chat === 'forced_error')) {
                    if (w) stats[serve.ky_thuat].direct++;
                }
            }
        });
        const combinedDict = {...(dictionary?.ky_thuat || {}), ...(dictionary?.loai_giao_bong || {})};
        return Object.entries(stats).map(([k, v]) => ({ 
            key: k, label: combinedDict[k] || k, ...v 
        })).sort((a,b) => b.used - a.used);
    }, [flatPoints, perspective, dictionary]);

    // Renders
    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600"><ArrowLeft size={20}/></button>
                    <h2 className="font-bold text-lg sm:text-xl text-slate-800">Dashboard Phân Tích</h2>
                </div>
                <div className="flex w-full sm:w-auto overflow-hidden rounded-lg border border-slate-200">
                    <button onClick={() => setPerspective('doi_thu_1')} className={\`flex-1 sm:flex-none px-4 py-2 text-sm font-bold transition-colors \${perspective === 'doi_thu_1' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>GÓC NHÌN CỦA TÔI</button>
                    <button onClick={() => setPerspective('doi_thu_2')} className={\`flex-1 sm:flex-none px-4 py-2 text-sm font-bold transition-colors \${perspective === 'doi_thu_2' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>GÓC NHÌN ĐỐI THỦ</button>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar Filters */}
                <div className="w-full md:w-64 bg-white border-r md:h-full overflow-y-auto shrink-0 flex flex-col p-4 shadow-sm z-10 relative">
                    <div className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Filter size={18}/> Bộ lọc dữ liệu</div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trận đấu</label>
                            <select className="w-full p-2.5 border rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 ring-primary/20" value={filters.matchId} onChange={e => setFilters({...filters, matchId: e.target.value})}>
                                <option value="all">Tất cả trận đấu</option>
                                {matches.map(m => <option key={m.id_tran_dau} value={m.id_tran_dau}>{m.thong_tin.doi_thu_1} vs {m.thong_tin.doi_thu_2} ({m.thong_tin.ngay_thi_dau})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Đối thủ</label>
                            <select className="w-full p-2.5 border rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 ring-primary/20" value={filters.opponent} onChange={e => setFilters({...filters, opponent: e.target.value})}>
                                <option value="all">Tất cả đối thủ</option>
                                {Array.from(new Set(matches.map(m => m.thong_tin.doi_thu_2.trim()))).map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Từ ngày</label>
                                <input type="date" className="w-full p-2 border rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 ring-primary/20" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Đến ngày</label>
                                <input type="date" className="w-full p-2 border rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 ring-primary/20" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                            </div>
                        </div>
                        <button onClick={() => setFilters({ matchId: 'all', opponent: 'all', startDate: '', endDate: '', gameSo: 'all' })} className="w-full mt-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-200 transition-colors">Xóa bộ lọc</button>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/50">
                    
                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl border shadow-sm sticky top-0 z-10">
                        {[
                            {id: 'overview', label: 'Tổng quan', icon: <PieChart size={16}/>},
                            {id: 'technique', label: 'Kỹ thuật', icon: <Activity size={16}/>},
                            {id: 'serve', label: 'Giao bóng', icon: <Target size={16}/>},
                            {id: 'attack', label: 'Tấn công', icon: <Zap size={16}/>},
                        ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} className={\`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all \${activeTab === t.id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}\`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Tab Content */}
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
                                <p className="text-sm text-slate-500 mt-1">Phân tích tần suất và tỷ lệ thành công của từng kỹ thuật bạn sử dụng.</p>
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
                                                    <span className={\`px-2.5 py-1 rounded-md font-bold text-xs \${(t.win/t.used) >= 0.5 ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}\`}>
                                                        {safePct(t.win, t.used)}%
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-medium text-slate-500">
                                                    {safePct(t.win, overview.win)}%
                                                </td>
                                            </tr>
                                        ))}
                                        {techniques.length === 0 && (
                                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Không có dữ liệu</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'serve' && (
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden max-w-5xl mx-auto">
                            <div className="p-5 border-b bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target size={20} className="text-primary"/> Phân tích Giao bóng (Serve Analysis)</h3>
                                <p className="text-sm text-slate-500 mt-1">Đánh giá độ hiệu quả của từng loại giao bóng.</p>
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
                                                    <span className="text-slate-400 text-xs ml-2">({t.win}/{t.used})</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-primary font-bold">{t.direct}</span>
                                                    <span className="text-slate-400 text-xs ml-2">({safePct(t.direct, t.used)}%)</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {serveAnalysis.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Không có dữ liệu</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'attack' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="bg-white rounded-2xl border shadow-sm p-6 text-center">
                                <Zap size={48} className="mx-auto mb-4 text-slate-200"/>
                                <h3 className="font-bold text-xl text-slate-800 mb-2">Tấn Công N-Ball</h3>
                                <p className="text-slate-500 max-w-lg mx-auto">Số liệu tấn công 2nd, 3rd, 5th ball đã được tính toán trong phần Tổng quan. Bạn có thể kết hợp với Bộ lọc bên trái để xem chi tiết.</p>
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
`;
fs.writeFileSync('src/App.tsx', appFile);
