const fs = require('fs');

const dashboardCode = `
import React, { useState, useMemo } from 'react';
import { useAppContext } from './context/AppContext';
import { MatchData, PointData, TouchData } from './types';
import { Settings as SettingsIcon, Database, ArrowLeft, Filter, PieChart, Activity, Target, Crosshair, Users, Zap, TrendingUp, AlertTriangle, Table } from 'lucide-react';
import { MatchList } from './components/MatchList';
import { MatchDetail } from './components/MatchDetail';
import { RallyEntry } from './components/RallyEntry';
import { Settings } from './components/Settings';

// --- Dashboard Component ---
function Dashboard({ matches, onBack }: { matches: MatchData[], onBack: () => void }) {
    const { dictionary } = useAppContext();
    const [perspective, setPerspective] = useState<'doi_thu_1' | 'doi_thu_2'>('doi_thu_1');
    const [filters, setFilters] = useState({
        matchId: 'all',
        opponent: 'all',
        startDate: '',
        endDate: '',
        gameSo: 'all',
    });
    
    const [activeTab, setActiveTab] = useState('overview');
    
    // --- Utils ---
    const getPlayerPerspective = (m: MatchData) => perspective === 'doi_thu_1' ? m.thong_tin.doi_thu_1 : m.thong_tin.doi_thu_2;
    const isPointWon = (p: PointData, m: MatchData) => p.nguoi_ghi_diem === getPlayerPerspective(m);
    
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
        const arr: { match: MatchData, game: any, point: PointData }[] = [];
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
        flatPoints.forEach(({match, point}) => {
            const me = getPlayerPerspective(match);
            const w = isPointWon(point, match);
            if (w) win++; else lose++;
            
            const server = point.khoi_nguon_giao_bong?.nguoi_thuc_hien;
            if (server === me) { serveT++; if (w) serveW++; }
            else if (server && server !== me) { recT++; if (w) recW++; }
        });
        return { win, lose, serveW, serveT, recW, recT, total: flatPoints.length, totalMatches: filteredMatches.length, totalGames: filteredMatches.reduce((acc, m) => acc + m.chi_tiet_game.length, 0) };
    }, [flatPoints, perspective]);

    // Technique Analysis
    const techniques = useMemo(() => {
        const stats: Record<string, {used: number, win: number, lose: number}> = {};
        flatPoints.forEach(({match, point}) => {
            const me = getPlayerPerspective(match);
            const w = isPointWon(point, match);
            
            const seq = [];
            if (point.khoi_nguon_giao_bong) seq.push(point.khoi_nguon_giao_bong);
            if (point.tong_so_cham >= 3 && point.cu_tao_loi_the_N_2) seq.push(point.cu_tao_loi_the_N_2);
            if (point.tong_so_cham >= 2 && point.cu_dap_tra_N_1) seq.push(point.cu_dap_tra_N_1);
            if (point.cu_ket_thuc_N) seq.push(point.cu_ket_thuc_N);
            
            seq.forEach(t => {
                if (t.nguoi_thuc_hien === me && t.ky_thuat) {
                    if (!stats[t.ky_thuat]) stats[t.ky_thuat] = {used:0, win:0, lose:0};
                    stats[t.ky_thuat].used++;
                    if (w) stats[t.ky_thuat].win++; else stats[t.ky_thuat].lose++;
                }
            });
        });
        return Object.entries(stats).map(([k, v]) => ({ key: k, label: dictionary?.ky_thuat?.[k] || k, ...v })).sort((a,b) => b.used - a.used);
    }, [flatPoints, perspective, dictionary]);

    // Renders
    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600"><ArrowLeft size={20}/></button>
                    <h2 className="font-bold text-xl text-slate-800">Dashboard Phân Tích</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPerspective('doi_thu_1')} className={\`px-4 py-2 rounded-lg font-bold \${perspective === 'doi_thu_1' ? 'bg-primary text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>GÓC NHÌN CỦA TÔI</button>
                    <button onClick={() => setPerspective('doi_thu_2')} className={\`px-4 py-2 rounded-lg font-bold \${perspective === 'doi_thu_2' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>GÓC NHÌN ĐỐI THỦ</button>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar Filters */}
                <div className="w-full md:w-64 bg-white border-r p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
                    <div className="font-bold text-slate-700 flex items-center gap-2 mb-2"><Filter size={18}/> Bộ lọc</div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Trận đấu</label>
                        <select className="w-full p-2 border rounded text-sm bg-slate-50" value={filters.matchId} onChange={e => setFilters({...filters, matchId: e.target.value})}>
                            <option value="all">Tất cả trận đấu</option>
                            {matches.map(m => <option key={m.id_tran_dau} value={m.id_tran_dau}>{m.thong_tin.doi_thu_1} vs {m.thong_tin.doi_thu_2}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Đối thủ</label>
                        <select className="w-full p-2 border rounded text-sm bg-slate-50" value={filters.opponent} onChange={e => setFilters({...filters, opponent: e.target.value})}>
                            <option value="all">Tất cả đối thủ</option>
                            {Array.from(new Set(matches.map(m => m.thong_tin.doi_thu_2.trim()))).map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Từ ngày</label>
                        <input type="date" className="w-full p-2 border rounded text-sm bg-slate-50" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Đến ngày</label>
                        <input type="date" className="w-full p-2 border rounded text-sm bg-slate-50" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                    </div>
                    <button onClick={() => setFilters({ matchId: 'all', opponent: 'all', startDate: '', endDate: '', gameSo: 'all' })} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-200">Xóa bộ lọc</button>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
                    
                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[
                            {id: 'overview', label: 'Tổng quan', icon: <PieChart size={16}/>},
                            {id: 'technique', label: 'Kỹ thuật', icon: <Activity size={16}/>},
                            {id: 'attack', label: 'Tấn công', icon: <Zap size={16}/>},
                            {id: 'pattern', label: 'Chiến thuật', icon: <Target size={16}/>},
                            {id: 'heatmap', label: 'Điểm rơi', icon: <Crosshair size={16}/>},
                            {id: 'opponent', label: 'Đối thủ', icon: <Users size={16}/>},
                            {id: 'training', label: 'Insight', icon: <TrendingUp size={16}/>}
                        ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} className={\`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-colors \${activeTab === t.id ? 'bg-primary text-white shadow' : 'bg-white text-slate-600 border hover:bg-slate-50'}\`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <div className="text-slate-500 text-sm font-medium mb-1">Tổng quan</div>
                                    <div className="text-2xl font-black text-slate-800">{overview.totalMatches} trận</div>
                                    <div className="text-sm text-slate-500">{overview.totalGames} game • {overview.total} rally</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <div className="text-slate-500 text-sm font-medium mb-1">Điểm Thắng / Thua</div>
                                    <div className="text-2xl font-black text-primary">{overview.win} / {overview.lose}</div>
                                    <div className="text-sm text-slate-500">Win Rate: {overview.total ? ((overview.win / overview.total)*100).toFixed(1) : 0}%</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <div className="text-slate-500 text-sm font-medium mb-1">Giao bóng</div>
                                    <div className="text-2xl font-black text-emerald-600">{overview.serveT ? ((overview.serveW / overview.serveT)*100).toFixed(1) : 0}%</div>
                                    <div className="text-sm text-slate-500">{overview.serveW} / {overview.serveT}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <div className="text-slate-500 text-sm font-medium mb-1">Đỡ giao</div>
                                    <div className="text-2xl font-black text-blue-600">{overview.recT ? ((overview.recW / overview.recT)*100).toFixed(1) : 0}%</div>
                                    <div className="text-sm text-slate-500">{overview.recW} / {overview.recT}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'technique' && (
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18}/> Hiệu quả kỹ thuật</h3></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 border-b">
                                        <tr>
                                            <th className="p-3 font-semibold">Kỹ thuật</th>
                                            <th className="p-3 font-semibold text-right">Số lần (N)</th>
                                            <th className="p-3 font-semibold text-right">Thắng / Thua</th>
                                            <th className="p-3 font-semibold text-right">Success Rate</th>
                                            <th className="p-3 font-semibold text-right">% Điểm thắng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {techniques.map(t => (
                                            <tr key={t.key} className="hover:bg-slate-50">
                                                <td className="p-3 font-medium text-slate-800">{t.label}</td>
                                                <td className="p-3 text-right text-slate-600">{t.used}</td>
                                                <td className="p-3 text-right"><span className="text-primary font-medium">{t.win}</span> / <span className="text-danger font-medium">{t.lose}</span></td>
                                                <td className="p-3 text-right font-bold text-slate-700">{((t.win / t.used)*100).toFixed(1)}%</td>
                                                <td className="p-3 text-right text-slate-500">{overview.win ? ((t.win / overview.win)*100).toFixed(1) : 0}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* Other tabs placeholder - building iteratively */}
                    {activeTab !== 'overview' && activeTab !== 'technique' && (
                        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">
                            <Activity size={48} className="mx-auto mb-4 opacity-20"/>
                            <div>Đang xây dựng tab {activeTab}...</div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// --- App Content Overlay ---
// We will replace AppContent function with one that conditionally renders Dashboard
`;

const appFile = fs.readFileSync('src/App.tsx', 'utf8');

const replacementAppContent = `
function AppContent() {
  const { isConfigured, isLoading, error, dataMode, matchData } = useAppContext();
  const [showSettings, setShowSettings] = useState(!isConfigured);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);
  
  // Dashboard state
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
              matches={dashboardMatchId === 'all' ? matchData : matchData.filter(m => m.id_tran_dau === dashboardMatchId)} 
              onBack={() => setShowDashboard(false)} 
          />
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex flex-col gap-2 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">Sổ Tay Bóng Bàn</h1>
            <div className="flex gap-2">
                <button onClick={() => { setDashboardMatchId('all'); setShowDashboard(true); }} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-medium rounded-lg text-sm hover:bg-indigo-100 flex items-center gap-1"><PieChart size={16}/> Phân tích Toàn bộ</button>
                <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                    <SettingsIcon size={20} />
                </button>
            </div>
        </div>
        
        {dataMode === 'mock' ? (
            <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-md self-start">
                <Database size={14} /> 🟡 CHẾ ĐỘ DỮ LIỆU MẪU - Không lưu vĩnh viễn
            </div>
        ) : (
            <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-md self-start">
                <Database size={14} /> 🟢 DỮ LIỆU GITHUB
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
`;

// Combine parts
const appParts = appFile.split('function AppContent() {');
const header = appParts[0];
const footer = appParts[1].split('function App() {')[1];

let newImports = header;
if (!newImports.includes('PieChart')) {
    newImports = newImports.replace(
        `import { Settings as SettingsIcon, Database } from 'lucide-react';`,
        `import { Settings as SettingsIcon, Database, ArrowLeft, Filter, PieChart, Activity, Target, Crosshair, Users, Zap, TrendingUp } from 'lucide-react';`
    );
}

const finalFile = newImports + '\n\n' + dashboardCode + '\n\n' + replacementAppContent + '\n\nfunction App() {' + footer;

fs.writeFileSync('src/App.tsx', finalFile);

