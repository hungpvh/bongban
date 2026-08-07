const fs = require('fs');
const code = `

// --- DASHBOARD LOGIC ---

export const getPlayerPerspective = (match, perspective) => {
  return perspective === 'doi_thu_1' ? match.thong_tin.doi_thu_1 : match.thong_tin.doi_thu_2;
};

export const isPointWon = (point, match, perspective) => {
  const me = getPlayerPerspective(match, perspective);
  return point.nguoi_ghi_diem === me;
};

export const filterMatches = (matches, filters) => {
  let res = matches;
  if (filters.matchId && filters.matchId !== 'all') {
    res = res.filter(m => m.id_tran_dau === filters.matchId);
  }
  if (filters.startDate) {
    res = res.filter(m => m.thong_tin.ngay_thi_dau >= filters.startDate);
  }
  if (filters.endDate) {
    res = res.filter(m => m.thong_tin.ngay_thi_dau <= filters.endDate);
  }
  if (filters.opponent && filters.opponent !== 'all') {
    res = res.filter(m => m.thong_tin.doi_thu_2.trim() === filters.opponent.trim());
  }
  return res;
};

export const flattenPoints = (filteredMatches, filters) => {
  let flat = [];
  filteredMatches.forEach(m => {
    m.chi_tiet_game.forEach(g => {
      if (filters.gameSo && filters.gameSo !== 'all' && g.game_so.toString() !== filters.gameSo.toString()) return;
      g.danh_sach_diem.forEach(p => {
        flat.push({ match: m, game: g, point: p });
      });
    });
  });
  return flat;
};

export const getTouchByN = (point, n) => {
  if (n === 1) return point.khoi_nguon_giao_bong;
  if (point.tong_so_cham === n) return point.cu_ket_thuc_N;
  if (point.tong_so_cham - 1 === n) return point.cu_dap_tra_N_1;
  if (point.tong_so_cham - 2 === n) return point.cu_tao_loi_the_N_2;
  return null;
};

export const getSequence = (point) => {
    let seq = [];
    if (point.khoi_nguon_giao_bong) seq.push(point.khoi_nguon_giao_bong);
    if (point.tong_so_cham >= 3 && point.cu_tao_loi_the_N_2) seq.push(point.cu_tao_loi_the_N_2);
    if (point.tong_so_cham >= 2 && point.cu_dap_tra_N_1) seq.push(point.cu_dap_tra_N_1);
    if (point.cu_ket_thuc_N) seq.push(point.cu_ket_thuc_N);
    return seq;
};

export const analyzeOverview = (matches, filters, perspective) => {
  const filtered = filterMatches(matches, filters);
  const points = flattenPoints(filtered, filters);
  
  let winPoints = 0;
  let losePoints = 0;
  let serveWin = 0;
  let serveTotal = 0;
  let receiveWin = 0;
  let receiveTotal = 0;
  
  points.forEach(({match, point}) => {
    const isWin = isPointWon(point, match, perspective);
    const me = getPlayerPerspective(match, perspective);
    
    if (isWin) winPoints++;
    else losePoints++;
    
    const server = point.khoi_nguon_giao_bong?.nguoi_thuc_hien;
    if (server === me) {
      serveTotal++;
      if (isWin) serveWin++;
    } else if (server && server !== me) {
      receiveTotal++;
      if (isWin) receiveWin++;
    }
  });

  return {
    totalMatches: filtered.length,
    totalGames: filtered.reduce((acc, m) => acc + m.chi_tiet_game.length, 0),
    totalRallies: points.length,
    winPoints,
    losePoints,
    serveWin,
    serveTotal,
    receiveWin,
    receiveTotal
  };
};

export const analyzeTechniques = (points, perspective, dictionary) => {
  const stats = {};
  
  points.forEach(({match, point}) => {
    const me = getPlayerPerspective(match, perspective);
    const isWin = isPointWon(point, match, perspective);
    const seq = getSequence(point);
    
    seq.forEach(touch => {
      if (!touch || touch.nguoi_thuc_hien !== me || !touch.ky_thuat) return;
      const tech = touch.ky_thuat;
      if (!stats[tech]) stats[tech] = { used: 0, win: 0, lose: 0 };
      stats[tech].used++;
      if (isWin) stats[tech].win++;
      else stats[tech].lose++;
    });
  });
  return stats;
};

export const analyzePatterns = (points, perspective) => {
    // 3rd ball pattern: Serve -> Return -> Attack
    const thirdBall = {};
    const fifthBall = {};
    const combinations = {};
    const winners = {};
    const fe = {};
    const ue = {};
    
    points.forEach(({match, point}) => {
        const me = getPlayerPerspective(match, perspective);
        const isWin = isPointWon(point, match, perspective);
        
        // Pattern extracting
        const seq = getSequence(point);
        // ... (we'll implement more logic in the UI component to keep it simpler if needed, 
        // or just put it all here).
    });
    return { thirdBall };
};
`;
fs.appendFileSync('src/lib/gameLogic.ts', code);
