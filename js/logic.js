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

export const calculateServerForPoint = (totalScoreBeforePoint, startingServer, player1, player2, context) => {
    const starting = startingServer || player1;
    const otherPlayer = starting === player1 ? player2 : player1;

    let scoreA = 0;
    let scoreB = 0;
    let startScoreA = 0;
    let startScoreB = 0;
    let playedPoints = 0;
    let previousServer = null;

    if (context) {
        const game = context.danh_sach_diem !== undefined ? context : context.game;
        if (game) {
            const [sA, sB] = (game.ty_so_bat_dau || '0-0').split('-').map(Number);
            startScoreA = isNaN(sA) ? 0 : sA;
            startScoreB = isNaN(sB) ? 0 : sB;

            const pointIndex = typeof totalScoreBeforePoint === 'number'
                ? totalScoreBeforePoint
                : (game.danh_sach_diem || []).length;
            const pointsBefore = (game.danh_sach_diem || []).slice(0, pointIndex);

            scoreA = startScoreA;
            scoreB = startScoreB;
            for (const pt of pointsBefore) {
                if (pt.nguoi_ghi_diem === player1) {
                    scoreA++;
                } else if (pt.nguoi_ghi_diem === player2) {
                    scoreB++;
                }
            }
            playedPoints = pointsBefore.length;

            if (pointsBefore.length > 0) {
                const prevPt = pointsBefore[pointsBefore.length - 1];
                previousServer = prevPt?.khoi_nguon_giao_bong?.nguoi_thuc_hien || prevPt?.nguoi_giao_bong || null;
            }
        }

        if (typeof context.scoreA === 'number') scoreA = context.scoreA;
        if (typeof context.scoreB === 'number') scoreB = context.scoreB;
        if (typeof context.startScoreA === 'number') startScoreA = context.startScoreA;
        if (typeof context.startScoreB === 'number') startScoreB = context.startScoreB;
        if (typeof context.playedPoints === 'number') playedPoints = context.playedPoints;
        if (context.previousServer !== undefined) previousServer = context.previousServer;
    } else {
        playedPoints = typeof totalScoreBeforePoint === 'number' ? totalScoreBeforePoint : 0;
    }

    // 1. Kiểm tra kết thúc game: một bên đạt từ 11 điểm trở lên và cách biệt >= 2 điểm
    const isGameOver = (scoreA >= 11 || scoreB >= 11) && Math.abs(scoreA - scoreB) >= 2;
    if (isGameOver) {
        return null;
    }

    // 2. Xác định deuce phase: scoreA >= 10 AND scoreB >= 10 AND Math.abs(scoreA - scoreB) < 2
    const isDeucePhase = scoreA >= 10 && scoreB >= 10 && Math.abs(scoreA - scoreB) < 2;

    if (isDeucePhase) {
        // ƯU TIÊN (PHƯƠNG PHÁP CHÍNH): Lấy người giao của point liền trước rồi đảo sang người còn lại
        if (previousServer) {
            return previousServer === player1 ? player2 : player1;
        }

        // PHƯƠNG PHÁP DỰ PHÒNG: Khi không có dữ liệu point liền trước
        const serviceTurnIndex = Math.floor(playedPoints / 2);
        return serviceTurnIndex % 2 === 0 ? starting : otherPlayer;
    }

    // 3. Trước deuce: mỗi người giao 2 điểm rồi đổi (giữ nguyên logic chuẩn)
    const serviceTurnIndex = Math.floor(playedPoints / 2);
    return serviceTurnIndex % 2 === 0 ? starting : otherPlayer;
};

export const recalculateGame = (game, player1, player2) => {
    let [startP1, startP2] = (game.ty_so_bat_dau || '0-0').split('-').map(Number);
    startP1 = isNaN(startP1) ? 0 : startP1;
    startP2 = isNaN(startP2) ? 0 : startP2;
    
    let currentP1 = startP1;
    let currentP2 = startP2;
    
    const recalculatedPoints = (game.danh_sach_diem || []).map((point, index) => {
        const totalPointsBefore = index;
        const prevPoint = index > 0 ? (game.danh_sach_diem[index - 1] || null) : null;
        const prevServer = prevPoint 
            ? (prevPoint.khoi_nguon_giao_bong?.nguoi_thuc_hien || prevPoint.nguoi_giao_bong || null) 
            : null;

        const currentServer = calculateServerForPoint(
            totalPointsBefore,
            game.nguoi_giao_bong_truoc,
            player1,
            player2,
            {
                game,
                scoreA: currentP1,
                scoreB: currentP2,
                startScoreA: startP1,
                startScoreB: startP2,
                previousServer: prevServer,
                playedPoints: index
            }
        );
        
        if (point.nguoi_ghi_diem === player1) {
            currentP1++;
        } else if (point.nguoi_ghi_diem === player2) {
            currentP2++;
        }
        
        const isLastPoint = index === (game.danh_sach_diem || []).length - 1;
        const serverToUse = (!isLastPoint && point.nguoi_giao_bong)
            ? point.nguoi_giao_bong
            : (currentServer || point.nguoi_giao_bong || game.nguoi_giao_bong_truoc);
        
        return {
            ...point,
            thu_tu_diem: index + 1,
            ty_so_hien_tai: `${currentP1}-${currentP2}`,
            nguoi_giao_bong: serverToUse,
            khoi_nguon_giao_bong: point.khoi_nguon_giao_bong ? {
                ...point.khoi_nguon_giao_bong,
                nguoi_thuc_hien: (!isLastPoint && point.khoi_nguon_giao_bong.nguoi_thuc_hien)
                    ? point.khoi_nguon_giao_bong.nguoi_thuc_hien
                    : serverToUse
            } : {
                nguoi_thuc_hien: serverToUse,
                ky_thuat: null,
                dac_tinh: { diem_roi_ngang: null, do_dai: null, do_xoay: null, vi_tri_hong: null }
            }
        };
    });
    
    return {
        ...game,
        ty_so_chung_cuoc: `${currentP1}-${currentP2}`,
        danh_sach_diem: recalculatedPoints
    };
};
