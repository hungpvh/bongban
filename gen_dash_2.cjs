const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const replacementBody = `
// --- Utilities ---
const getPlayerPerspective = (m, perspective) => perspective === 'doi_thu_1' ? m.thong_tin.doi_thu_1 : m.thong_tin.doi_thu_2;
const getOpponentPerspective = (m, perspective) => perspective === 'doi_thu_1' ? m.thong_tin.doi_thu_2 : m.thong_tin.doi_thu_1;
const isPointWon = (p, m, perspective) => p.nguoi_ghi_diem === getPlayerPerspective(m, perspective);

const safePct = (num, den) => den === 0 ? "0.0" : ((num / den) * 100).toFixed(1);

const getSequence = (point) => {
    const seq = [];
    if (point.khoi_nguon_giao_bong) seq.push({ type: 'serve', touch: point.khoi_nguon_giao_bong });
    if (point.tong_so_cham >= 3 && point.cu_tao_loi_the_N_2) seq.push({ type: 'n-2', touch: point.cu_tao_loi_the_N_2 });
    if (point.tong_so_cham >= 2 && point.cu_dap_tra_N_1) seq.push({ type: 'n-1', touch: point.cu_dap_tra_N_1 });
    if (point.cu_ket_thuc_N) seq.push({ type: 'n', touch: point.cu_ket_thuc_N });
    return seq;
};

const getNthBall = (point, n) => {
    // 2nd ball = return
    if (n === 2) return point.tong_so_cham >= 2 ? (point.tong_so_cham === 2 ? point.cu_ket_thuc_N : (point.tong_so_cham === 3 ? point.cu_dap_tra_N_1 : (point.tong_so_cham === 4 ? point.cu_tao_loi_the_N_2 : null))) : null;
    // 3rd ball
    if (n === 3) return point.tong_so_cham >= 3 ? (point.tong_so_cham === 3 ? point.cu_ket_thuc_N : (point.tong_so_cham === 4 ? point.cu_dap_tra_N_1 : null)) : null; // Need proper sequencing...
    // Let's use simpler logic for nth ball if we can't trace exactly. The requirement says "Dựa vào thứ tự chạm thực tế".
    // Serve = 1
    // N-2 = tong_so_cham - 2
    // N-1 = tong_so_cham - 1
    // N = tong_so_cham
    return null;
}

// Just extract the logic properly based on touches
const extractBall = (point, targetTouchNum) => {
    if (targetTouchNum === 1) return point.khoi_nguon_giao_bong;
    if (point.tong_so_cham === targetTouchNum) return point.cu_ket_thuc_N;
    if (point.tong_so_cham - 1 === targetTouchNum) return point.cu_dap_tra_N_1;
    if (point.tong_so_cham - 2 === targetTouchNum) return point.cu_tao_loi_the_N_2;
    return null;
}
`;

// we will inject this in Dashboard component
