const fs = require('fs');
const content = `
import { state, setState } from '../store.js';
import { analyzeMatch } from '../analytics/engine.js';

let dashboardState = {
    filters: {
        matchId: null,
        opponent: null
    },
    perspectiveStr: 'doi_thu_1'
};

window.app = window.app || {};
window.app.actions = window.app.actions || {};
window.app.actions.dashboard = {
    setFilter: (key, val) => {
        dashboardState.filters[key] = val;
        window.app.setState({});
    },
    setPerspective: (p) => {
        dashboardState.perspectiveStr = p;
        window.app.setState({});
    }
};

const pct = (num, den) => den === 0 ? '0%' : Math.round((num/den)*100) + '%';

export function renderDashboard() {
    if (!state.matches || state.matches.length === 0) {
        return \`<div class="p-8 text-center text-slate-500 bg-white rounded-2xl border shadow-sm mt-6">Chưa có dữ liệu trận đấu.</div>\`;
    }

    const dict = state.dictionary || {};
    const stats = analyzeMatch(state.matches, dict, dashboardState.filters, dashboardState.perspectiveStr);

    if (stats.empty) return \`<div>Chưa có dữ liệu.</div>\`;

    // Calculate overall KPIs
    const winRate = pct(stats.pointsWon, stats.totalRallies);
    const winRateServe = pct(stats.pointsWonOnServe, stats.serveCount);
    const winRateReceive = pct(stats.pointsWonOnReceive, stats.receiveCount);

    // Matches dropdown
    const matchOptions = state.matches.map(m => 
        \`<option value="\${m.id}" \${dashboardState.filters.matchId === m.id ? 'selected' : ''}>\${m.thong_tin_tran_dau.ngay_thi_dau} - \${m.thong_tin_tran_dau.doi_thu_1} vs \${m.thong_tin_tran_dau.doi_thu_2}</option>\`
    ).join('');

    // Opponent dropdown (just extract unique opponents)
    const opponents = [...new Set(state.matches.map(m => m.thong_tin_tran_dau.doi_thu_2).filter(x=>x))];
    const oppOptions = opponents.map(o => \`<option value="\${o}" \${dashboardState.filters.opponent === o ? 'selected' : ''}>\${o}</option>\`).join('');

    // Technique List
    const techRows = Object.entries(stats.techniques).sort((a,b) => b[1].count - a[1].count).map(([tk, data]) => \`
        <tr class="border-b hover:bg-slate-50">
            <td class="p-2">\${dict.ky_thuat?.[tk] || tk}</td>
            <td class="p-2 text-center">\${data.count}</td>
            <td class="p-2 text-center text-primary font-bold">\${data.won}</td>
            <td class="p-2 text-center text-danger font-bold">\${data.lost}</td>
            <td class="p-2 text-center">\${pct(data.won, data.count)}</td>
            <td class="p-2 text-center text-success">\${data.w}</td>
            <td class="p-2 text-center text-danger">\${data.u}</td>
        </tr>
    \`).join('');

    // N-Ball Table
    const nballRows = Object.entries(stats.nBall).map(([n, d]) => \`
        <tr class="border-b hover:bg-slate-50">
            <td class="p-2 font-bold">\${n}th Ball</td>
            <td class="p-2 text-center">\${d.opps}</td>
            <td class="p-2 text-center">\${d.atts}</td>
            <td class="p-2 text-center text-primary font-bold">\${d.wins}</td>
            <td class="p-2 text-center text-danger font-bold">\${d.losses}</td>
            <td class="p-2 text-center">\${pct(d.wins, d.atts)}</td>
            <td class="p-2 text-center text-success">\${d.w}</td>
        </tr>
    \`).join('');

    // Pattern Table
    const patRows = Object.entries(stats.patterns).sort((a,b) => b[1].count - a[1].count).slice(0, 10).map(([pat, d]) => \`
        <tr class="border-b hover:bg-slate-50">
            <td class="p-2 max-w-[200px] truncate" title="\${pat}">\${pat.split(' → ').map(k => dict.ky_thuat?.[k]||k).join(' → ')}</td>
            <td class="p-2 text-center">\${d.count}</td>
            <td class="p-2 text-center text-primary font-bold">\${d.won}</td>
            <td class="p-2 text-center text-danger font-bold">\${d.lost}</td>
            <td class="p-2 text-center">\${pct(d.won, d.count)}</td>
        </tr>
    \`).join('');

    // Game Table
    const gameRows = stats.gamesDetails.map((g) => \`
        <tr class="border-b hover:bg-slate-50">
            <td class="p-2 text-center font-bold">Game \${g.gameNum}</td>
            <td class="p-2 text-center">\${g.rallies}</td>
            <td class="p-2 text-center">\${g.startScore || '0-0'}</td>
            <td class="p-2 text-center font-bold \${parseInt(g.endScore.split('-')[0]) > parseInt(g.endScore.split('-')[1]) ? (dashboardState.perspectiveStr === 'doi_thu_1' ? 'text-primary' : 'text-danger') : (dashboardState.perspectiveStr === 'doi_thu_1' ? 'text-danger' : 'text-primary')}">\${g.endScore || '0-0'}</td>
            <td class="p-2 text-center text-primary font-bold">\${g.ptsWon}</td>
            <td class="p-2 text-center text-danger font-bold">\${g.ptsLost}</td>
            <td class="p-2 text-center">\${pct(g.ptsWon, g.rallies)}</td>
            <td class="p-2 text-center text-success">\${g.maxWinStreak}</td>
        </tr>
    \`).join('');

    // Heatmap Mirroring logic
    let hm = stats.heatmaps.all;
    let gridHTML = '';
    const val = (y, x) => hm[y]?.[x] || 0;
    const isP1 = dashboardState.perspectiveStr === 'doi_thu_1';
    
    // Top Row
    gridHTML += \`<div class="bg-white border flex items-center justify-center text-sm font-bold shadow-sm hover:bg-primary hover:text-white transition cursor-pointer">\${isP1 ? val('ngan', 'trai') : val('dai', 'phai')}</div>\`;
    gridHTML += \`<div class="bg-white border flex items-center justify-center text-sm font-bold shadow-sm hover:bg-primary hover:text-white transition cursor-pointer">\${isP1 ? val('ngan', 'giua') : val('dai', 'giua')}</div>\`;
    gridHTML += \`<div class="bg-white border flex items-center justify-center text-sm font-bold shadow-sm hover:bg-primary hover:text-white transition cursor-pointer">\${isP1 ? val('ngan', 'phai') : val('dai', 'trai')}</div>\`;
    // Bottom Row
    gridHTML += \`<div class="bg-white border flex items-center justify-center text-sm font-bold shadow-sm hover:bg-primary hover:text-white transition cursor-pointer">\${isP1 ? val('dai', 'trai') : val('ngan', 'phai')}</div>\`;
    gridHTML += \`<div class="bg-white border flex items-center justify-center text-sm font-bold shadow-sm hover:bg-primary hover:text-white transition cursor-pointer">\${isP1 ? val('dai', 'giua') : val('ngan', 'giua')}</div>\`;
    gridHTML += \`<div class="bg-white border flex items-center justify-center text-sm font-bold shadow-sm hover:bg-primary hover:text-white transition cursor-pointer">\${isP1 ? val('dai', 'phai') : val('ngan', 'trai')}</div>\`;

    return \`
    <div class="flex flex-col h-full bg-slate-50 overflow-y-auto">
        <div class="bg-white p-4 shadow-sm z-10 sticky top-0 flex flex-wrap gap-4 items-center justify-between">
            <div class="flex items-center gap-3">
                <button onclick="window.app.navigate('matchList')" class="p-2 text-slate-500 hover:text-slate-800 transition"><i data-lucide="arrow-left"></i> Quay lại</button>
                <h2 class="text-xl font-bold text-slate-800">Dashboard Phân Tích</h2>
            </div>
            
            <div class="flex gap-2">
                <select class="border p-2 rounded-lg bg-slate-50 text-sm focus:ring focus:ring-primary/20" onchange="window.app.actions.dashboard.setPerspective(this.value)">
                    <option value="doi_thu_1" \${dashboardState.perspectiveStr === 'doi_thu_1' ? 'selected' : ''}>Góc nhìn của TÔI (Đấu thủ 1)</option>
                    <option value="doi_thu_2" \${dashboardState.perspectiveStr === 'doi_thu_2' ? 'selected' : ''}>Góc nhìn ĐỐI THỦ (Đấu thủ 2)</option>
                </select>
                <select class="border p-2 rounded-lg bg-slate-50 text-sm focus:ring focus:ring-primary/20" onchange="window.app.actions.dashboard.setFilter('matchId', this.value)">
                    <option value="">-- Tất cả các trận --</option>
                    \${matchOptions}
                </select>
                <select class="border p-2 rounded-lg bg-slate-50 text-sm focus:ring focus:ring-primary/20" onchange="window.app.actions.dashboard.setFilter('opponent', this.value)">
                    <option value="">-- Tất cả đối thủ --</option>
                    \${oppOptions}
                </select>
                <button onclick="window.app.actions.dashboard.setFilter('matchId', null); window.app.actions.dashboard.setFilter('opponent', null);" class="px-3 py-2 border rounded-lg hover:bg-slate-100 text-sm font-bold text-slate-600 transition">Xóa lọc</button>
            </div>
        </div>

        <div class="p-4 md:p-6 space-y-6">
            <!-- KPIs -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                    <div class="text-sm text-slate-500 font-semibold mb-1">Point Win Rate</div>
                    <div class="text-4xl font-black text-primary">\${winRate}</div>
                    <div class="text-xs text-slate-400 mt-2 font-medium">\${stats.pointsWon} / \${stats.totalRallies} rally</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                    <div class="text-sm text-slate-500 font-semibold mb-1">Win Rate (Serve)</div>
                    <div class="text-4xl font-black text-slate-700">\${winRateServe}</div>
                    <div class="text-xs text-slate-400 mt-2 font-medium">\${stats.pointsWonOnServe} / \${stats.serveCount} rally</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                    <div class="text-sm text-slate-500 font-semibold mb-1">Win Rate (Receive)</div>
                    <div class="text-4xl font-black text-slate-700">\${winRateReceive}</div>
                    <div class="text-xs text-slate-400 mt-2 font-medium">\${stats.pointsWonOnReceive} / \${stats.receiveCount} rally</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                    <div class="text-sm text-slate-500 font-semibold mb-1">Win/Lose Streak</div>
                    <div class="text-4xl font-black text-slate-700"><span class="text-success">\${stats.winStreak}</span> / <span class="text-danger">\${stats.loseStreak}</span></div>
                    <div class="text-xs text-slate-400 mt-2 font-medium">Dài nhất trong 1 Game</div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <!-- Data Quality Alerts -->
                \${stats.dataQuality.length > 0 ? \`
                <div class="bg-amber-50 border border-amber-200 p-5 rounded-2xl xl:col-span-2">
                    <h3 class="font-bold text-amber-800 mb-3 flex items-center gap-2"><i data-lucide="alert-triangle" class="w-5 h-5"></i> Cảnh báo Data Quality (\${stats.dataQuality.length})</h3>
                    <ul class="list-disc list-inside text-sm text-amber-700 max-h-32 overflow-y-auto space-y-1">
                        \${stats.dataQuality.map(q => \`<li>\${q}</li>\`).join('')}
                    </ul>
                </div>
                \` : ''}

                <!-- Game Analysis -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="list-ordered" class="w-5 h-5 text-primary"></i> Game Analysis</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="bg-slate-50 text-slate-600">
                                    <th class="p-3 text-center rounded-l-lg">Game</th>
                                    <th class="p-3 text-center">Tổng Rally</th>
                                    <th class="p-3 text-center">Tỷ số BĐ</th>
                                    <th class="p-3 text-center">Tỷ số CC</th>
                                    <th class="p-3 text-center">Điểm Thắng</th>
                                    <th class="p-3 text-center">Điểm Thua</th>
                                    <th class="p-3 text-center">Point Win Rate</th>
                                    <th class="p-3 text-center rounded-r-lg">Max Streak</th>
                                </tr>
                            </thead>
                            <tbody>\${gameRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Techniques -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="activity" class="w-5 h-5 text-primary"></i> Kỹ Thuật Tổng Hợp</h3>
                    <div class="overflow-x-auto max-h-80">
                        <table class="w-full text-sm">
                            <thead class="sticky top-0 bg-slate-50 shadow-sm">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">Kỹ thuật</th>
                                    <th class="p-3">Số lần</th>
                                    <th class="p-3">Thắng</th>
                                    <th class="p-3">Thua</th>
                                    <th class="p-3">Success</th>
                                    <th class="p-3">Winner</th>
                                    <th class="p-3 rounded-r-lg">UF Error</th>
                                </tr>
                            </thead>
                            <tbody>\${techRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- N-Ball -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="target" class="w-5 h-5 text-primary"></i> N-Ball Attack & Cơ Hội</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-50">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">N-Ball</th>
                                    <th class="p-3">Cơ hội</th>
                                    <th class="p-3">Tấn công</th>
                                    <th class="p-3">Thắng</th>
                                    <th class="p-3">Thua</th>
                                    <th class="p-3">Conversion</th>
                                    <th class="p-3 rounded-r-lg">Winner</th>
                                </tr>
                            </thead>
                            <tbody>\${nballRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Patterns -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="git-merge" class="w-5 h-5 text-primary"></i> Top Pattern Điểm Số</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-50">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">Trình tự pha bóng (Serve → ... → Kết thúc)</th>
                                    <th class="p-3">Số lần</th>
                                    <th class="p-3">Thắng</th>
                                    <th class="p-3">Thua</th>
                                    <th class="p-3 rounded-r-lg">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>\${patRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Heatmap -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2 flex flex-col items-center">
                    <h3 class="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2"><i data-lucide="map" class="w-5 h-5 text-primary"></i> Heatmap Điểm Rơi Tổng Hợp</h3>
                    <div class="bg-slate-100 border-2 border-slate-300 p-2 rounded-xl grid grid-cols-3 gap-1.5 w-80 h-56 relative shadow-inner">
                        \${gridHTML}
                        
                        <div class="absolute -top-7 w-full text-center text-sm font-bold text-slate-500 uppercase tracking-widest">\${isP1 ? 'Lưới (Ngắn)' : 'Cạnh bàn (Dài)'}</div>
                        <div class="absolute -bottom-7 w-full text-center text-sm font-bold text-slate-500 uppercase tracking-widest">\${isP1 ? 'Cạnh bàn (Dài)' : 'Lưới (Ngắn)'}</div>
                        <div class="absolute -left-7 h-full flex items-center text-sm font-bold text-slate-500 -rotate-90">Trái</div>
                        <div class="absolute -right-7 h-full flex items-center text-sm font-bold text-slate-500 rotate-90">Phải</div>
                    </div>
                    <p class="text-xs text-slate-400 mt-10">Bản đồ điểm rơi hiển thị theo góc nhìn từ phía bạn (\${isP1 ? 'Tôi' : 'Đối thủ'}).</p>
                </div>

            </div>
        </div>
    </div>
    \`;
}
`;
fs.writeFileSync('js/views/dashboard.js', content);
