export const calculateScoreForPoint = (startingScore, pointResults, player1, player2) => {
    let [p1, p2] = (startingScore || '0-0').split('-').map(Number);
    p1 = isNaN(p1) ? 0 : p1;
    p2 = isNaN(p2) ? 0 : p2;
    
    for (const pt of pointResults) {
        if (pt.nguoi_ghi_diem === player1) {
            p1++;
        } else if (pt.nguoi_ghi_diem === player2) {
            p2++;
        }
    }
    return { p1Score: p1, p2Score: p2, scoreString: `${p1}-${p2}` };
};

export const calculateServerForPoint = (totalScoreBeforePoint, startingServer, player1, player2) => {
    let changes = 0;
    if (totalScoreBeforePoint < 20) {
        changes = Math.floor(totalScoreBeforePoint / 2);
    } else {
        changes = 10 + (totalScoreBeforePoint - 20);
    }
    
    if (changes % 2 === 0) {
        return startingServer;
    } else {
        return startingServer === player1 ? player2 : player1;
    }
};

export const recalculateGame = (game, player1, player2) => {
    let [startP1, startP2] = (game.ty_so_bat_dau || '0-0').split('-').map(Number);
    startP1 = isNaN(startP1) ? 0 : startP1;
    startP2 = isNaN(startP2) ? 0 : startP2;
    
    let currentP1 = startP1;
    let currentP2 = startP2;
    
    const recalculatedPoints = (game.danh_sach_diem || []).map((point, index) => {
        const totalPointsBefore = currentP1 + currentP2;
        const currentServer = calculateServerForPoint(totalPointsBefore, game.nguoi_giao_bong_truoc, player1, player2);
        
        if (point.nguoi_ghi_diem === player1) {
            currentP1++;
        } else if (point.nguoi_ghi_diem === player2) {
            currentP2++;
        }
        
        return {
            ...point,
            ty_so_hien_tai: `${currentP1}-${currentP2}`,
            khoi_nguon_giao_bong: {
                ...point.khoi_nguon_giao_bong,
                nguoi_thuc_hien: currentServer
            }
        };
    });
    
    return {
        ...game,
        ty_so_chung_cuoc: `${currentP1}-${currentP2}`,
        danh_sach_diem: recalculatedPoints
    };
};
