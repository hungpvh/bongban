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

const transformLandingPointForPerspective = (x, y, perspective) => {
    if (perspective === 'doi_thu_1') return { x, y };
    return {
        x: x === 'trai' ? 'phai' : x === 'phai' ? 'trai' : 'giua',
        y: y === 'ngan' ? 'dai' : y === 'dai' ? 'ngan' : y
    };
};

const calculateLandingDistribution = (points, perspective) => {
    let heatmap = {
        ngan: { trai: 0, giua: 0, phai: 0 },
        dai: { trai: 0, giua: 0, phai: 0 }
    };
    let validCount = 0;
    
    points.forEach(pt => {
        const sn = pt.cu_ket_thuc_N;
        if (sn && sn.dac_tinh && sn.dac_tinh.diem_roi_ngang && sn.dac_tinh.do_dai) {
            const transformed = transformLandingPointForPerspective(
                sn.dac_tinh.diem_roi_ngang, 
                sn.dac_tinh.do_dai, 
                perspective
            );
            if (heatmap[transformed.y] && heatmap[transformed.y][transformed.x] !== undefined) {
                heatmap[transformed.y][transformed.x]++;
                validCount++;
            }
        }
    });

    return { heatmap, validCount, totalCount: points.length };
};

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

const safePercentage = (numerator, denominator) => {
    return denominator === 0 ? 0 : (numerator / denominator) * 100;
};

const renderHeatmap = (title, data, colorType, perspectiveStr) => {
    const hm = data.heatmap;
    const total = data.totalCount;
    
    // For WIN: top is 'dai' (long), bottom is 'ngan' (short). L-R is left-right.
    // For LOSS: top is 'ngan' (short), bottom is 'dai' (long). L-R is left-right.
    const isWin = colorType === 'win';
    const topY = isWin ? 'dai' : 'ngan';
    const bottomY = isWin ? 'ngan' : 'dai';
    
    const cell = (y, x) => {
        const val = hm[y][x];
        const p = safePercentage(val, total);
        const colClass = getHeatmapColor(p, colorType);
        
        let displayX = x === 'trai' ? 'Trái' : x === 'phai' ? 'Phải' : 'Giữa';
        let displayY = y === 'ngan' ? 'Ngắn' : 'Dài';
        
        const titleText = `${title === 'Heatmap Điểm Thắng' ? 'Điểm thắng' : 'Điểm thua'}\n${displayX} · ${displayY}\n${val} điểm / ${Math.round(p*10)/10}%`;
        
        return `
            <div title="${titleText}" class="${colClass} border border-slate-200 flex flex-col items-center justify-center text-xs sm:text-sm font-bold shadow-sm transition hover:opacity-80 cursor-pointer min-h-[4rem] rounded-sm">
                <div>${val}</div>
                <div class="text-[10px] font-normal opacity-90">(${Math.round(p*10)/10}%)</div>
            </div>`;
    };

    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center w-full">
            <h3 class="font-black ${colorType === 'win' ? 'text-green-700' : 'text-red-700'} text-lg mb-2 flex items-center gap-2 text-center">
                <i data-lucide="map" class="w-5 h-5"></i> ${title}
            </h3>
            
            <div class="mt-4 bg-slate-50 border-2 border-slate-200 p-2 rounded-xl grid grid-cols-3 gap-1 w-full max-w-[280px] h-48 sm:h-56 relative shadow-inner">
                ${cell(topY, 'trai')} ${cell(topY, 'giua')} ${cell(topY, 'phai')}
                ${cell(bottomY, 'trai')} ${cell(bottomY, 'giua')} ${cell(bottomY, 'phai')}
                
                <div class="absolute -top-6 w-full text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">${isWin ? 'Cạnh bàn (Dài)' : 'Lưới (Ngắn)'}</div>
                <div class="absolute -bottom-6 w-full text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">${isWin ? 'Lưới (Ngắn)' : 'Cạnh bàn (Dài)'}</div>
                <div class="absolute -left-6 h-full flex items-center text-[10px] sm:text-xs font-bold text-slate-500 -rotate-90">Trái</div>
                <div class="absolute -right-6 h-full flex items-center text-[10px] sm:text-xs font-bold text-slate-500 rotate-90">Phải</div>
            </div>
            
            <div class="mt-8 text-xs text-slate-500 text-center flex flex-col gap-1.5 w-full">
                <div class="flex justify-between w-full px-4 font-medium">
                    <span>Tổng số ${colorType === 'win' ? 'điểm thắng' : 'điểm thua'}:</span>
                    <strong class="text-slate-700 text-sm">${total}</strong>
                </div>
                <div class="flex justify-between w-full px-4 font-medium">
                    <span>Đã ghi nhận điểm rơi:</span>
                    <strong class="text-slate-700 text-sm">${data.validCount} / ${total}</strong>
                </div>
            </div>
        </div>
    `;
};

export function renderDashboard() {
    if (!state.matches || state.matches.length === 0) {
        return `<div class="p-8 text-center text-slate-500 bg-white rounded-2xl border shadow-sm mt-6">Chưa có dữ liệu trận đấu.</div>`;
    }

    const dict = state.dictionary || {};
    const stats = analyzeMatch(state.matches, dict, dashboardState.filters, dashboardState.perspectiveStr);

    if (stats.empty) return `<div>Chưa có dữ liệu.</div>`;

    // Calculate overall KPIs
    const winRate = pct(stats.pointsWon, stats.totalRallies);
    const winRateServe = pct(stats.pointsWonOnServe, stats.serveCount);
    const winRateReceive = pct(stats.pointsWonOnReceive, stats.receiveCount);

    // Matches dropdown
    const matchOptions = state.matches.map(m => 
        `<option value="${m.id_tran_dau}" ${dashboardState.filters.matchId === m.id_tran_dau ? 'selected' : ''}>${m.thong_tin.ngay_thi_dau} - ${m.thong_tin.doi_thu_1} vs ${m.thong_tin.doi_thu_2}</option>`
    ).join('');

    // Opponent dropdown (just extract unique opponents)
    const opponents = [...new Set(state.matches.map(m => m.thong_tin.doi_thu_2).filter(x=>x))];
    const oppOptions = opponents.map(o => `<option value="${o}" ${dashboardState.filters.opponent === o ? 'selected' : ''}>${o}</option>`).join('');

    // Technique List
    const techRows = Object.entries(stats.techniques).sort((a,b) => b[1].count - a[1].count).map(([tk, data]) => `
        <tr class="border-b hover:bg-slate-50">
            <td class="p-2">${dict.ky_thuat?.[tk] || tk}</td>
            <td class="p-2 text-center">${data.count}</td>
            <td class="p-2 text-center text-primary font-bold">${data.won}</td>
            <td class="p-2 text-center text-danger font-bold">${data.lost}</td>
            <td class="p-2 text-center">${pct(data.won, data.count)}</td>
            <td class="p-2 text-center text-success">${data.w}</td>
            <td class="p-2 text-center text-danger">${data.u}</td>
        </tr>
    `).join('');

    // N-Ball Table
    const nballRows = Object.entries(stats.nBall).map(([n, d]) => `
        <tr class="border-b hover:bg-slate-50">
            <td class="p-2 font-bold">${n}th Ball</td>
            <td class="p-2 text-center">${d.opps}</td>
            <td class="p-2 text-center">${d.atts}</td>
            <td class="p-2 text-center text-primary font-bold">${d.wins}</td>
            <td class="p-2 text-center text-danger font-bold">${d.losses}</td>
            <td class="p-2 text-center">${pct(d.wins, d.atts)}</td>
            <td class="p-2 text-center text-success">${d.w}</td>
        </tr>
    `).join('');

    // Pattern Table
    const patRows = Object.entries(stats.patterns).sort((a,b) => b[1].count - a[1].count).slice(0, 10).map(([pat, d]) => `
        <tr class="border-b hover:bg-slate-50">
            <td class="p-2">${pat}</td>
            <td class="p-2 text-center">${d.count}</td>
            <td class="p-2 text-center text-primary font-bold">${d.won}</td>
            <td class="p-2 text-center text-danger font-bold">${d.lost}</td>
            <td class="p-2 text-center">${pct(d.won, d.count)}</td>
        </tr>
    `).join('');

    // Game Table
    const gameRows = stats.gamesDetails.map(g => `
        <tr class="border-b hover:bg-slate-50">
            <td class="p-2 text-center font-bold">Game ${g.game_so}</td>
            <td class="p-2 text-center">${g.rallies}</td>
            <td class="p-2 text-center">${g.startScore || '0-0'}</td>
            <td class="p-2 text-center font-bold ${parseInt(g.endScore.split('-')[0]) > parseInt(g.endScore.split('-')[1]) ? (dashboardState.perspectiveStr === 'doi_thu_1' ? 'text-primary' : 'text-danger') : (dashboardState.perspectiveStr === 'doi_thu_1' ? 'text-danger' : 'text-primary')}">${g.endScore || '0-0'}</td>
            <td class="p-2 text-center text-primary font-bold">${g.ptsWon}</td>
            <td class="p-2 text-center text-danger font-bold">${g.ptsLost}</td>
            <td class="p-2 text-center">${pct(g.ptsWon, g.rallies)}</td>
            <td class="p-2 text-center text-success">${g.maxWinStreak}</td>
        </tr>
    `).join('');

    // Heatmaps extraction
    let filteredMatchesForHm = state.matches;
    if (dashboardState.filters.matchId) {
        filteredMatchesForHm = filteredMatchesForHm.filter(m => m.id_tran_dau === dashboardState.filters.matchId);
    }
    
    let winPoints = [];
    let lossPoints = [];
    
    filteredMatchesForHm.forEach(m => {
        const p1 = m.thong_tin.doi_thu_1;
        const p2 = m.thong_tin.doi_thu_2;
        const perspectiveName = dashboardState.perspectiveStr === 'doi_thu_1' ? p1 : p2;
        
        (m.chi_tiet_game || []).forEach(g => {
            (g.danh_sach_diem || []).forEach(pt => {
                if (pt.nguoi_ghi_diem === perspectiveName) {
                    winPoints.push(pt);
                } else {
                    lossPoints.push(pt);
                }
            });
        });
    });

    const winPerspective = dashboardState.perspectiveStr === 'doi_thu_1' ? 'doi_thu_2' : 'doi_thu_1';
    const lossPerspective = dashboardState.perspectiveStr;

    const winData = calculateLandingDistribution(winPoints, winPerspective);
    const lossData = calculateLandingDistribution(lossPoints, lossPerspective);

    const helperText = dashboardState.perspectiveStr === 'doi_thu_1' 
        ? "Điểm thắng hiển thị theo phía bàn đối phương · Điểm thua hiển thị theo phía bàn của bạn"
        : "Điểm thắng hiển thị theo phía bàn đối phương · Điểm thua hiển thị theo phía bàn của bạn";

    const heatmapsHtml = `
        <div class="xl:col-span-2">
            <div class="mb-2 text-sm text-slate-600 bg-white p-3 rounded-xl shadow-sm border font-bold flex flex-col items-center justify-center gap-1">
                <div class="flex items-center gap-2">
                    <i data-lucide="eye" class="w-4 h-4 text-primary"></i> Góc nhìn phân tích: <span class="text-slate-800 uppercase tracking-wide">${dashboardState.perspectiveStr === 'doi_thu_1' ? 'Đối thủ 1 (Tôi)' : 'Đối thủ 2'}</span>
                </div>
                <div class="text-xs font-normal text-slate-500">${helperText}</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${renderHeatmap('Heatmap Điểm Thắng', winData, 'win', winPerspective)}
                ${renderHeatmap('Heatmap Điểm Thua', lossData, 'loss', lossPerspective)}
            </div>
        </div>
    `;

    return `
    <div class="flex flex-col h-full bg-slate-50 overflow-y-auto">
        <div class="bg-white p-4 shadow-sm z-10 sticky top-0 flex flex-wrap gap-4 items-center justify-between">
            <div class="flex items-center gap-3">
                <button onclick="window.app.navigate('matchList')" class="p-2 text-slate-500 hover:text-slate-800 transition"><i data-lucide="arrow-left"></i> Quay lại</button>
                <h2 class="text-xl font-bold text-slate-800">Dashboard Phân Tích</h2>
            </div>
            
            <div class="flex gap-2">
                <select class="border p-2 rounded-lg bg-slate-50 text-sm focus:ring focus:ring-primary/20" onchange="window.app.actions.dashboard.setPerspective(this.value)">
                    <option value="doi_thu_1" ${dashboardState.perspectiveStr === 'doi_thu_1' ? 'selected' : ''}>Góc nhìn của TÔI (Đấu thủ 1)</option>
                    <option value="doi_thu_2" ${dashboardState.perspectiveStr === 'doi_thu_2' ? 'selected' : ''}>Góc nhìn ĐỐI THỦ (Đấu thủ 2)</option>
                </select>
                <select class="border p-2 rounded-lg bg-slate-50 text-sm focus:ring focus:ring-primary/20" onchange="window.app.actions.dashboard.setFilter('matchId', this.value)">
                    <option value="">-- Tất cả các trận --</option>
                    ${matchOptions}
                </select>
                <select class="border p-2 rounded-lg bg-slate-50 text-sm focus:ring focus:ring-primary/20" onchange="window.app.actions.dashboard.setFilter('opponent', this.value)">
                    <option value="">-- Tất cả đối thủ --</option>
                    ${oppOptions}
                </select>
                <button onclick="window.app.actions.dashboard.setFilter('matchId', null); window.app.actions.dashboard.setFilter('opponent', null);" class="px-3 py-2 border rounded-lg hover:bg-slate-100 text-sm font-bold text-slate-600 transition">Xóa lọc</button>
            </div>
        </div>

        <div class="p-4 md:p-6 space-y-6">
            <!-- KPIs -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                    <div class="text-sm text-slate-500 font-semibold mb-1">Point Win Rate</div>
                    <div class="text-4xl font-black text-primary">${winRate}</div>
                    <div class="text-xs text-slate-400 mt-2 font-medium">${stats.pointsWon} / ${stats.totalRallies} rally</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                    <div class="text-sm text-slate-500 font-semibold mb-1">Win Rate (Serve)</div>
                    <div class="text-4xl font-black text-slate-700">${winRateServe}</div>
                    <div class="text-xs text-slate-400 mt-2 font-medium">${stats.pointsWonOnServe} / ${stats.serveCount} giao bóng</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                    <div class="text-sm text-slate-500 font-semibold mb-1">Win Rate (Receive)</div>
                    <div class="text-4xl font-black text-slate-700">${winRateReceive}</div>
                    <div class="text-xs text-slate-400 mt-2 font-medium">${stats.pointsWonOnReceive} / ${stats.receiveCount} đỡ giao</div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                    <div class="text-sm text-slate-500 font-semibold mb-1">Chuỗi Lên Điểm (Max)</div>
                    <div class="text-4xl font-black text-success">${stats.winStreak}</div>
                    <div class="text-xs text-slate-400 mt-2 font-medium">Bị dẫn dài nhất: ${stats.loseStreak}</div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                ${stats.dataQuality.length > 0 ? `
                <!-- Data Quality Warnings -->
                <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 xl:col-span-2 shadow-sm">
                    <h3 class="font-bold text-amber-900 text-sm mb-2 flex items-center gap-2"><i data-lucide="alert-triangle" class="w-5 h-5"></i> Cảnh báo Data Quality (${stats.dataQuality.length})</h3>
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
                                    <th class="p-3 text-center">Point Win Rate</th>
                                    <th class="p-3 text-center rounded-r-lg">Max Streak</th>
                                </tr>
                            </thead>
                            <tbody>${gameRows}</tbody>
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
                            <tbody>${techRows}</tbody>
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
                            <tbody>${nballRows}</tbody>
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
                            <tbody>${patRows}</tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Insights & Training -->
                <div class="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl shadow-sm border border-blue-100 xl:col-span-2">
                    <h3 class="font-bold text-indigo-900 text-lg mb-4 flex items-center gap-2"><i data-lucide="lightbulb" class="w-5 h-5 text-indigo-600"></i> Insight & Đề Xuất Tập Luyện</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
                            <h4 class="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wide">Điểm Mạnh (Cần Phát Huy)</h4>
                            <ul class="list-disc list-inside text-sm text-slate-600 space-y-2">
                                <li><strong>Win Rate:</strong> ${winRate} là tỷ lệ thắng điểm tổng thể.</li>
                                ${stats.pointsWonOnServe > stats.pointsWonOnReceive ? '<li>Khả năng ghi điểm khi <strong>cầm giao bóng</strong> tốt hơn khi đỡ giao.</li>' : '<li>Khả năng ghi điểm khi <strong>đỡ giao bóng</strong> tốt hơn khi cầm giao.</li>'}
                                ${Object.entries(stats.nBall).filter(x=>x[1].atts > 5 && x[1].wins/x[1].atts > 0.5).map(x=> `<li><strong>${x[0]}th Ball Attack</strong> rất hiệu quả (${pct(x[1].wins, x[1].atts)}).</li>`).join('')}
                            </ul>
                        </div>
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
                            <h4 class="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wide">Điểm Yếu (Đề Xuất Tập Luyện)</h4>
                            <ul class="list-disc list-inside text-sm text-slate-600 space-y-2">
                                ${Object.entries(stats.techniques).filter(x=>x[1].u > 2).sort((a,b)=>b[1].u - a[1].u).slice(0,2).map(x=> `<li>Tập kiểm soát <strong>${dict.ky_thuat?.[x[0]] || x[0]}</strong> (có ${x[1].u} lỗi tự đánh hỏng).</li>`).join('')}
                                ${Object.entries(stats.nBall).filter(x=>x[1].atts > 3 && x[1].wins/x[1].atts < 0.4).map(x=> `<li>Cải thiện <strong>${x[0]}th Ball Attack</strong> (hiệu suất thấp ${pct(x[1].wins, x[1].atts)}).</li>`).join('')}
                                ${stats.loseStreak > 4 ? `<li>Khả năng cắt chuỗi thua chưa tốt (Lose streak dài nhất: ${stats.loseStreak}). Cần rèn luyện tâm lý tĩnh.</li>` : ''}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Heatmap -->
                ${heatmapsHtml}
            </div>
        </div>
    </div>
    `;
}
