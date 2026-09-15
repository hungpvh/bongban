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
const safePercentage = (numerator, denominator) => denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);

const getHeatmapColor = (percent, type) => {
    if (percent === 0) return 'bg-white text-slate-400';
    if (type === 'win') {
        if (percent <= 10) return 'bg-green-100 text-green-800';
        if (percent <= 25) return 'bg-green-300 text-green-900';
        if (percent <= 50) return 'bg-green-500 text-white';
        if (percent <= 75) return 'bg-green-700 text-white';
        return 'bg-green-900 text-white';
    } else {
        if (percent <= 10) return 'bg-red-100 text-red-800';
        if (percent <= 25) return 'bg-red-300 text-red-900';
        if (percent <= 50) return 'bg-red-500 text-white';
        if (percent <= 75) return 'bg-red-700 text-white';
        return 'bg-red-900 text-white';
    }
};

const renderHeatmap = (title, data, colorType) => {
    const hm = data.heatmap;
    const total = data.totalCount;
    
    const isWin = colorType === 'win';
    
    const getCell = (displayY, displayX) => {
        let actualY = displayY === 'top' ? (isWin ? 'dai' : 'ngan') : (isWin ? 'ngan' : 'dai');
        let actualX = 'giua';
        if (displayX === 'left') {
            actualX = isWin ? 'phai' : 'trai';
        } else if (displayX === 'right') {
            actualX = isWin ? 'trai' : 'phai';
        }

        const val = hm[actualY]?.[actualX] || 0;
        const p = safePercentage(val, total);
        const colClass = getHeatmapColor(p, colorType);
        
        let labelX = actualX === 'trai' ? 'Trái' : actualX === 'phai' ? 'Phải' : 'Giữa';
        let labelY = actualY === 'ngan' ? 'Ngắn' : 'Dài';
        
        const titleText = `${title === 'Heatmap Điểm Thắng' ? 'Điểm thắng' : 'Điểm thua'}\n${labelX} · ${labelY}\n${val} điểm / ${p}%`;
        
        return `
            <div title="${titleText}" class="${colClass} border border-slate-200 flex flex-col items-center justify-center text-xs sm:text-sm font-bold shadow-sm transition hover:opacity-80 cursor-pointer min-h-[4rem] rounded-sm">
                <div>${val}</div>
                <div class="text-[10px] font-normal opacity-90">(${p}%)</div>
            </div>`;
    };

    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center w-full">
            <h3 class="font-black ${colorType === 'win' ? 'text-green-700' : 'text-red-700'} text-lg mb-2 flex items-center gap-2 text-center">
                <i data-lucide="map" class="w-5 h-5"></i> ${title}
            </h3>
            
            <div class="mt-4 bg-slate-50 border-2 border-slate-200 p-2 rounded-xl grid grid-cols-3 gap-1 w-full max-w-[280px] h-48 sm:h-56 relative shadow-inner">
                ${getCell('top', 'left')} ${getCell('top', 'mid')} ${getCell('top', 'right')}
                ${getCell('bottom', 'left')} ${getCell('bottom', 'mid')} ${getCell('bottom', 'right')}
                
                <div class="absolute -top-6 w-full text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">${isWin ? 'Cạnh bàn (Dài)' : 'Lưới (Ngắn)'}</div>
                <div class="absolute -bottom-6 w-full text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">${isWin ? 'Lưới (Ngắn)' : 'Cạnh bàn (Dài)'}</div>
                <div class="absolute -left-6 h-full flex items-center text-[10px] sm:text-xs font-bold text-slate-500 -rotate-90">${isWin ? 'Phải' : 'Trái'}</div>
                <div class="absolute -right-6 h-full flex items-center text-[10px] sm:text-xs font-bold text-slate-500 rotate-90">${isWin ? 'Trái' : 'Phải'}</div>
            </div>
        </div>
    `;
};

const getTopPositions = (posObj) => {
    if (!posObj || Object.keys(posObj).length === 0) return 'Chưa xác định';
    const maxVal = Math.max(...Object.values(posObj));
    if (maxVal === 0) return 'Chưa xác định';
    const tops = Object.entries(posObj).filter(x => x[1] === maxVal).map(x => {
        const parts = x[0].split('-');
        if (parts.length === 2) {
            const xDisplay = parts[0] === 'trai' ? 'Trái' : parts[0] === 'phai' ? 'Phải' : parts[0] === 'giua' ? 'Giữa' : parts[0];
            const yDisplay = parts[1] === 'ngan' ? 'Ngắn' : parts[1] === 'dai' ? 'Dài' : parts[1];
            return `${xDisplay}-${yDisplay} (${x[1]})`;
        }
        return `${x[0]} (${x[1]})`;
    });
    return tops.join(', ');
};

export function renderDashboard() {
    const dict = state.dictionary || {};
    const stats = analyzeMatch(state.matches, dict, dashboardState.filters, dashboardState.perspectiveStr);

    if (stats.empty) return `<div class="p-8 text-center text-slate-500">Chưa có dữ liệu.</div>`;

    const winRate = pct(stats.pointsWon, stats.totalRallies);

    const matchOpts = state.matches.map(m => {
        const title = `${m.thong_tin.doi_thu_1} vs ${m.thong_tin.doi_thu_2} (${m.thong_tin.ngay_thi_dau})`;
        const sel = dashboardState.filters.matchId === m.id_tran_dau ? 'selected' : '';
        return `<option value="${m.id_tran_dau}" ${sel}>${title}</option>`;
    }).join('');

    const gameRows = stats.gamesDetails.map(g => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-3 text-center font-bold">Game ${g.gameNum}</td>
            <td class="p-3 text-center">${g.rallies}</td>
            <td class="p-3 text-center text-slate-500">${g.startScore}</td>
            <td class="p-3 text-center font-mono font-bold bg-slate-50">${g.endScore}</td>
            <td class="p-3 text-center text-green-600 font-bold">${g.ptsWon}</td>
            <td class="p-3 text-center text-red-600 font-bold">${g.ptsLost}</td>
            <td class="p-3 text-center">${pct(g.ptsWon, g.rallies)}</td>
            <td class="p-3 text-center">${pct(g.ptsWonOnServe, g.serveCount)}</td>
            <td class="p-3 text-center">${pct(g.ptsWonOnReceive, g.receiveCount)}</td>
            <td class="p-3 text-center text-green-600">${g.maxWinStreak}</td>
            <td class="p-3 text-center text-red-600">${g.maxLoseStreak}</td>
        </tr>
    `).join('');

    const techRows = Object.entries(stats.techniques).sort((a, b) => b[1].count - a[1].count).map(([tk, d]) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-3 font-medium whitespace-nowrap">${dict.ky_thuat?.[tk] || tk}</td>
            <td class="p-3 text-center">${d.count}</td>
            <td class="p-3 text-center text-green-600">${d.won}</td>
            <td class="p-3 text-center text-red-600">${d.lost}</td>
            <td class="p-3 text-center font-bold">${pct(d.won, d.count)}</td>
        </tr>
    `).join('');

    const indErrRows = Object.entries(stats.inducedErrors).sort((a, b) => b[1].count - a[1].count).map(([tk, d]) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-3 font-medium whitespace-nowrap">${dict.ky_thuat?.[tk] || tk}</td>
            <td class="p-3 text-center">${d.count}</td>
            <td class="p-3 text-center font-bold">${pct(d.count, stats.pointsWon)}</td>
        </tr>
    `).join('');

    const invFinRows = Object.entries(stats.involvedFinishing).sort((a, b) => b[1].count - a[1].count).map(([tk, d]) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-3 font-medium whitespace-nowrap">${dict.ky_thuat?.[tk] || tk}</td>
            <td class="p-3 text-center">${d.count}</td>
            <td class="p-3 text-center text-green-600">${d.won}</td>
            <td class="p-3 text-center text-red-600">${d.lost}</td>
            <td class="p-3 text-center font-bold">${pct(d.won, d.count)}</td>
            <td class="p-3 text-center text-green-700">${pct(d.won, stats.pointsWon)}</td>
            <td class="p-3 text-center text-red-700">${pct(d.lost, stats.pointsLost)}</td>
        </tr>
    `).join('');

    const serveTechRows = Object.entries(stats.serveTechniques).sort((a, b) => b[1].count - a[1].count).map(([tk, d]) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-3 font-medium whitespace-nowrap">${dict.ky_thuat?.[tk] || tk}</td>
            <td class="p-3 text-center">${d.count}</td>
            <td class="p-3 text-center text-green-600">${d.won}</td>
            <td class="p-3 text-center text-red-600">${d.lost}</td>
            <td class="p-3 text-center text-green-600 font-bold">${d.directWon}</td>
            <td class="p-3 text-center text-red-600 font-bold">${d.directLost}</td>
            <td class="p-3 text-center font-bold">${pct(d.won, d.count)}</td>
            <td class="p-3 text-center text-green-700">${pct(d.won, stats.pointsWon)}</td>
            <td class="p-3 text-center text-red-700">${pct(d.lost, stats.pointsLost)}</td>
            <td class="p-3 text-center text-xs whitespace-nowrap">${getTopPositions(d.winPositions)}</td>
            <td class="p-3 text-center text-xs whitespace-nowrap">${getTopPositions(d.lossPositions)}</td>
        </tr>
    `).join('');

    const oppServeTechRows = Object.entries(stats.opponentServeTechniques).sort((a, b) => b[1].count - a[1].count).map(([tk, d]) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-3 font-medium whitespace-nowrap">${dict.ky_thuat?.[tk] || tk}</td>
            <td class="p-3 text-center">${d.count}</td>
            <td class="p-3 text-center text-green-600">${d.wonP1}</td>
            <td class="p-3 text-center text-red-600">${d.wonP2}</td>
            <td class="p-3 text-center text-green-600 font-bold">${d.directWonP1}</td>
            <td class="p-3 text-center text-red-600 font-bold">${d.directWonP2}</td>
            <td class="p-3 text-center font-bold">${pct(d.wonP1, d.count)}</td>
            <td class="p-3 text-center font-bold">${pct(d.wonP2, d.count)}</td>
            <td class="p-3 text-center">${pct(d.directWonP1, d.count)}</td>
            <td class="p-3 text-center">${pct(d.directWonP2, d.count)}</td>
            <td class="p-3 text-center text-xs whitespace-nowrap">${getTopPositions(d.winPositionsP1)}</td>
            <td class="p-3 text-center text-xs whitespace-nowrap">${getTopPositions(d.winPositionsP2)}</td>
        </tr>
    `).join('');

    const nballRows = Object.entries(stats.nBall).map(([n, d]) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-3 text-center font-bold">${n}th Ball</td>
            <td class="p-3 text-center">${d.opps}</td>
            <td class="p-3 text-center text-blue-600 font-bold">${d.atts}</td>
            <td class="p-3 text-center text-green-600">${d.wins}</td>
            <td class="p-3 text-center text-red-600">${d.losses}</td>
            <td class="p-3 text-center font-bold">${pct(d.wins, d.atts)}</td>
        </tr>
    `).join('');

    const renderPatGroup = (patternsDict) => {
        return Object.entries(patternsDict).sort((a, b) => b[1].count - a[1].count).slice(0, 10).map(([pat, d]) => `
            <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
                <td class="p-3 font-medium text-slate-700">${pat}</td>
                <td class="p-3 text-center">${d.count}</td>
                <td class="p-3 text-center text-green-600">${d.won}</td>
                <td class="p-3 text-center text-red-600">${d.lost}</td>
                <td class="p-3 text-center font-bold">${pct(d.won, d.count)}</td>
            </tr>
        `).join('');
    };

    const patServeRows = renderPatGroup(stats.patternsServe);
    const patReceiveRows = renderPatGroup(stats.patternsReceive);

    const heatmapsHtml = `
        ${renderHeatmap('Heatmap Điểm Thắng', { heatmap: stats.heatmaps.win, totalCount: stats.pointsWon }, 'win')}
        ${renderHeatmap('Heatmap Điểm Thua', { heatmap: stats.heatmaps.loss, totalCount: stats.pointsLost }, 'loss')}
    `;

    return `
    <div class="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div class="max-w-6xl mx-auto space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <h2 class="font-black text-slate-800 text-2xl flex items-center gap-2">
                    <i data-lucide="bar-chart-2" class="w-7 h-7 text-primary"></i> 
                    Phân tích Trận đấu
                </h2>
                <div class="flex flex-wrap items-center gap-3">
                    <select onchange="window.app.actions.dashboard.setPerspective(this.value)" class="p-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20">
                        <option value="doi_thu_1" ${dashboardState.perspectiveStr === 'doi_thu_1' ? 'selected' : ''}>Góc nhìn của TÔI (Đấu thủ 1)</option>
                        <option value="doi_thu_2" ${dashboardState.perspectiveStr === 'doi_thu_2' ? 'selected' : ''}>Góc nhìn của ĐỐI THỦ (Đấu thủ 2)</option>
                    </select>
                    <select onchange="window.app.actions.dashboard.setFilter('matchId', this.value)" class="p-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20">
                        <option value="">Tất cả trận đấu</option>
                        ${matchOpts}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                    <div class="text-slate-500 text-sm font-bold mb-1">Tổng Trận</div>
                    <div class="text-3xl font-black text-slate-800">${stats.totalGames}</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                    <div class="text-slate-500 text-sm font-bold mb-1">Win Rate (Points)</div>
                    <div class="text-3xl font-black text-primary">${winRate}</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                    <div class="text-slate-500 text-sm font-bold mb-1">Điểm Thắng</div>
                    <div class="text-3xl font-black text-green-600">${stats.pointsWon}</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                    <div class="text-slate-500 text-sm font-bold mb-1">Điểm Thua</div>
                    <div class="text-3xl font-black text-red-600">${stats.pointsLost}</div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                ${stats.dataQuality.length > 0 ? `
                <div class="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-200 xl:col-span-2">
                    <h3 class="font-bold text-amber-900 text-lg mb-2 flex items-center gap-2"><i data-lucide="alert-triangle" class="w-5 h-5"></i> Cảnh báo Data Quality (${stats.dataQuality.length})</h3>
                    <ul class="list-disc list-inside text-sm text-amber-700 max-h-32 overflow-y-auto space-y-1">
                        ${stats.dataQuality.map(q => `<li>${q}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

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
                                    <th class="p-3 text-center">Win Rate</th>
                                    <th class="p-3 text-center">Win Rate (Serve)</th>
                                    <th class="p-3 text-center">Win Rate (Receive)</th>
                                    <th class="p-3 text-center">Win Streak</th>
                                    <th class="p-3 text-center rounded-r-lg">Lose Streak</th>
                                </tr>
                            </thead>
                            <tbody>${gameRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Techniques 4a -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="activity" class="w-5 h-5 text-primary"></i> Kỹ Thuật Kết thúc điểm số</h3>
                    <div class="overflow-x-auto max-h-80">
                        <table class="w-full text-sm">
                            <thead class="sticky top-0 bg-slate-50 shadow-sm">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">Kỹ thuật</th>
                                    <th class="p-3 text-center">Số lần</th>
                                    <th class="p-3 text-center">Thắng</th>
                                    <th class="p-3 text-center">Thua</th>
                                    <th class="p-3 text-center rounded-r-lg">Success</th>
                                </tr>
                            </thead>
                            <tbody>${techRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Induced Errors 4b -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="shield-alert" class="w-5 h-5 text-amber-500"></i> Kỹ Thuật Tạo Áp Lực (Gây Lỗi Đối Thủ)</h3>
                    <div class="overflow-x-auto max-h-80">
                        <table class="w-full text-sm">
                            <thead class="sticky top-0 bg-slate-50 shadow-sm">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">Kỹ thuật (N-1 của tôi)</th>
                                    <th class="p-3 text-center">Số lần gây lỗi ép</th>
                                    <th class="p-3 text-center rounded-r-lg">Tỷ trọng trên tổng điểm thắng</th>
                                </tr>
                            </thead>
                            <tbody>${indErrRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Involved Finishing 4c -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="check-square" class="w-5 h-5 text-primary"></i> Kỹ Thuật Tham gia Kết thúc Điểm</h3>
                    <div class="overflow-x-auto max-h-80">
                        <table class="w-full text-sm">
                            <thead class="sticky top-0 bg-slate-50 shadow-sm">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">Kỹ thuật</th>
                                    <th class="p-3 text-center">Số lần</th>
                                    <th class="p-3 text-center">Thắng</th>
                                    <th class="p-3 text-center">Thua</th>
                                    <th class="p-3 text-center">Success</th>
                                    <th class="p-3 text-center">Win Share</th>
                                    <th class="p-3 text-center rounded-r-lg">Loss Share</th>
                                </tr>
                            </thead>
                            <tbody>${invFinRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Serve Techniques 4d1 -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="arrow-up-right" class="w-5 h-5 text-primary"></i> Kỹ thuật Giao bóng</h3>
                    <div class="overflow-x-auto max-h-80">
                        <table class="w-full text-sm">
                            <thead class="sticky top-0 bg-slate-50 shadow-sm">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">Kỹ thuật</th>
                                    <th class="p-3 text-center">Số lần</th>
                                    <th class="p-3 text-center">Điểm thắng</th>
                                    <th class="p-3 text-center">Điểm thua</th>
                                    <th class="p-3 text-center">Điểm ăn trực tiếp</th>
                                    <th class="p-3 text-center">Điểm thua trực tiếp</th>
                                    <th class="p-3 text-center">Win Rate</th>
                                    <th class="p-3 text-center">Win Share</th>
                                    <th class="p-3 text-center">Loss Share</th>
                                    <th class="p-3 text-center">Vị trí điểm thắng cao</th>
                                    <th class="p-3 text-center rounded-r-lg">Vị trí điểm thua cao</th>
                                </tr>
                            </thead>
                            <tbody>${serveTechRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Opponent Serve Techniques 4d2 -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="arrow-down-left" class="w-5 h-5 text-primary"></i> Kỹ thuật Giao bóng của Đối thủ</h3>
                    <div class="overflow-x-auto max-h-80">
                        <table class="w-full text-sm">
                            <thead class="sticky top-0 bg-slate-50 shadow-sm">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg whitespace-nowrap">Kỹ thuật giao bóng</th>
                                    <th class="p-3 text-center whitespace-nowrap">Số lần</th>
                                    <th class="p-3 text-center whitespace-nowrap">Điểm thắng P1</th>
                                    <th class="p-3 text-center whitespace-nowrap">Điểm thắng P2</th>
                                    <th class="p-3 text-center whitespace-nowrap">Ăn giao bóng trực tiếp P1</th>
                                    <th class="p-3 text-center whitespace-nowrap">Ăn giao bóng trực tiếp P2</th>
                                    <th class="p-3 text-center whitespace-nowrap">Win Rate P1</th>
                                    <th class="p-3 text-center whitespace-nowrap">Win Rate P2</th>
                                    <th class="p-3 text-center whitespace-nowrap">Tỷ lệ trực tiếp P1</th>
                                    <th class="p-3 text-center whitespace-nowrap">Tỷ lệ trực tiếp P2</th>
                                    <th class="p-3 text-center whitespace-nowrap">Vị trí P1 thắng cao</th>
                                    <th class="p-3 text-center rounded-r-lg whitespace-nowrap">Vị trí P2 thắng cao</th>
                                </tr>
                            </thead>
                            <tbody>${oppServeTechRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- N-Ball -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="target" class="w-5 h-5 text-primary"></i> N-Ball Attack & Cơ Hội</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-50">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-center rounded-l-lg">N-Ball</th>
                                    <th class="p-3 text-center">Cơ hội</th>
                                    <th class="p-3 text-center">Tấn công</th>
                                    <th class="p-3 text-center">Thắng</th>
                                    <th class="p-3 text-center">Thua</th>
                                    <th class="p-3 text-center rounded-r-lg">Conversion</th>
                                </tr>
                            </thead>
                            <tbody>${nballRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Patterns -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><i data-lucide="git-merge" class="w-5 h-5 text-primary"></i> Top Pattern Điểm Số</h3>
                    
                    <h4 class="font-bold text-slate-700 text-md mt-4 mb-2">A. Tôi giao bóng</h4>
                    <div class="overflow-x-auto mb-6">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-50">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">Trình tự pha bóng (Serve → ... → Kết thúc)</th>
                                    <th class="p-3 text-center">Số lần</th>
                                    <th class="p-3 text-center">Thắng</th>
                                    <th class="p-3 text-center">Thua</th>
                                    <th class="p-3 text-center rounded-r-lg">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>${patServeRows}</tbody>
                        </table>
                    </div>

                    <h4 class="font-bold text-slate-700 text-md mb-2">B. Tôi nhận giao bóng</h4>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-50">
                                <tr class="text-slate-600">
                                    <th class="p-3 text-left rounded-l-lg">Trình tự pha bóng (Serve → ... → Kết thúc)</th>
                                    <th class="p-3 text-center">Số lần</th>
                                    <th class="p-3 text-center">Thắng</th>
                                    <th class="p-3 text-center">Thua</th>
                                    <th class="p-3 text-center rounded-r-lg">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>${patReceiveRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Heatmap -->
                <div class="xl:col-span-2 flex flex-col md:flex-row gap-4">
                    ${heatmapsHtml}
                </div>
            </div>
        </div>
    </div>
    `;
}
