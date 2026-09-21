/**
 * queryNormalizer.js
 * In-memory normalization and indexing for table tennis match points.
 * Read-only, no mutations to original data.
 */

export const ATTACK_TECHNIQUES = new Set([
    'giat_phai',
    'doi_cong_phai',
    'flick_phai',
    'giat_trai',
    'doi_cong_trai',
    'flick_trai',
    'bat_dap_bong',
    'doi_giat_xa_ban'
]);

export function getObservedPhaseForTouchNumber(pt, touchNumber) {
    const t = pt.touchCount !== undefined ? pt.touchCount : (pt.tong_so_cham || 0);
    if (touchNumber === 1) return pt.serve || pt.khoi_nguon_giao_bong;
    if (touchNumber === t) return pt.N || pt.cu_ket_thuc_N;
    if (touchNumber === t - 1) return pt.N_1 || pt.cu_dap_tra_N_1;
    if (touchNumber === t - 2) return pt.N_2 || pt.cu_tao_loi_the_N_2;
    return null;
}

export function getTechniqueLabel(dictionary, key) {
    if (!key) return 'Chưa xác định';
    if (dictionary?.ky_thuat?.[key]) {
        return dictionary.ky_thuat[key];
    }
    return key;
}

export function getNatureLabel(dictionary, key) {
    if (!key) return 'Chưa xác định';
    if (dictionary?.tinh_chat_ket_thuc?.[key]) {
        return dictionary.tinh_chat_ket_thuc[key];
    }
    return key;
}

export function getPropertyLabel(dictionary, group, key) {
    if (!key) return '';
    return dictionary?.thuoc_tinh_bong?.[group]?.[key] || key;
}

export function getErrorLocationLabel(dictionary, key) {
    if (!key) return '';
    return dictionary?.thuoc_tinh_loi?.vi_tri_hong?.[key] || key;
}

export function buildQueryIndex(matches = [], dictionary = null) {
    const indexedPoints = [];

    matches.forEach(match => {
        const info = match.thong_tin || {};
        const matchId = match.id_tran_dau || '';
        const matchDate = info.ngay_thi_dau || '';
        const matchType = info.loai_hinh || '';
        const matchDescription = info.mo_ta || '';
        const tournamentText = info.mo_ta || '';
        const selfName = info.doi_thu_1 || 'Tôi';
        const opponentName = info.doi_thu_2 || 'Đối thủ';
        const matchResult = info.ket_qua || '';

        (match.chi_tiet_game || []).forEach(game => {
            const gameNo = game.game_so || 1;
            const gameId = game.id_game || String(gameNo);

            (game.danh_sach_diem || []).forEach(pt => {
                const dataQualityFlags = [];

                // 1. Resolve winner
                let winnerName = pt.nguoi_ghi_diem;
                if (!winnerName) {
                    if (pt.loai_diem === 'thang') winnerName = selfName;
                    else if (pt.loai_diem === 'thua') winnerName = opponentName;
                }
                if (pt.nguoi_ghi_diem && pt.loai_diem) {
                    const expectedName = pt.loai_diem === 'thang' ? selfName : opponentName;
                    if (pt.nguoi_ghi_diem !== expectedName) {
                        dataQualityFlags.push(`Không nhất quán: nguoi_ghi_diem (${pt.nguoi_ghi_diem}) khác loai_diem (${pt.loai_diem})`);
                    }
                }

                let winnerRole = 'UNKNOWN';
                if (winnerName === selfName) winnerRole = 'SELF';
                else if (winnerName === opponentName) winnerRole = 'OPPONENT';

                // 2. Resolve server
                let server = pt.khoi_nguon_giao_bong?.nguoi_thuc_hien || pt.nguoi_giao_bong || 'UNKNOWN';
                if (pt.khoi_nguon_giao_bong?.nguoi_thuc_hien && pt.nguoi_giao_bong) {
                    if (pt.khoi_nguon_giao_bong.nguoi_thuc_hien !== pt.nguoi_giao_bong) {
                        dataQualityFlags.push(`Người giao bóng không khớp: ${pt.khoi_nguon_giao_bong.nguoi_thuc_hien} vs ${pt.nguoi_giao_bong}`);
                    }
                }

                let serverRole = 'UNKNOWN';
                if (server === selfName) serverRole = 'SELF';
                else if (server === opponentName) serverRole = 'OPPONENT';

                const receiver = server === selfName ? opponentName : (server === opponentName ? selfName : 'UNKNOWN');
                const receiverRole = serverRole === 'SELF' ? 'OPPONENT' : (serverRole === 'OPPONENT' ? 'SELF' : 'UNKNOWN');

                // 3. Shots
                const touchCount = typeof pt.tong_so_cham === 'number' ? pt.tong_so_cham : 0;
                const serve = pt.khoi_nguon_giao_bong || null;
                const N_2 = pt.cu_tao_loi_the_N_2 || null;
                const N_1 = pt.cu_dap_tra_N_1 || null;
                const N = pt.cu_ket_thuc_N || null;

                // 4. Discrepancy checks on final shot
                if (N) {
                    if (!N.nguoi_thuc_hien || !N.ky_thuat) {
                        dataQualityFlags.push('Cú kết thúc thiếu người thực hiện hoặc kỹ thuật');
                    }
                    if (N.tinh_chat === 'winner' && winnerName && N.nguoi_thuc_hien && N.nguoi_thuc_hien !== winnerName) {
                        dataQualityFlags.push(`Tính chất winner nhưng người thực hiện (${N.nguoi_thuc_hien}) khác người ghi điểm (${winnerName})`);
                    }
                    if ((N.tinh_chat === 'forced_error' || N.tinh_chat === 'unforced_error') && winnerName && N.nguoi_thuc_hien && N.nguoi_thuc_hien === winnerName) {
                        dataQualityFlags.push(`Tính chất lỗi (${N.tinh_chat}) nhưng người thực hiện lại là người ghi điểm (${winnerName})`);
                    }
                }

                indexedPoints.push({
                    pointId: `${matchId}_g${gameNo}_p${pt.thu_tu_diem}`,
                    matchId,
                    matchDate,
                    matchType,
                    matchDescription,
                    tournamentText,
                    selfName,
                    opponentName,
                    matchResult,
                    gameId,
                    gameNo,
                    pointNo: pt.thu_tu_diem,
                    score: pt.ty_so_hien_tai || '',
                    touchCount,
                    winnerName,
                    winnerRole,
                    server,
                    serverRole,
                    receiver,
                    receiverRole,
                    serve,
                    N_2,
                    N_1,
                    N,
                    dataQualityFlags,
                    rawPoint: pt,
                    rawGame: game,
                    rawMatch: match
                });
            });
        });
    });

    return indexedPoints;
}
