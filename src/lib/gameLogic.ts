import { GameData } from '../types';

export const parseScore = (scoreStr: string) => {
  const parts = scoreStr.split('-');
  if (parts.length !== 2) return { p1: 0, p2: 0 };
  const p1 = parseInt(parts[0].trim(), 10);
  const p2 = parseInt(parts[1].trim(), 10);
  return { p1: isNaN(p1) ? 0 : p1, p2: isNaN(p2) ? 0 : p2 };
};

export const calculateServer = (
  totalScoreBeforePoint: number,
  startingServer: string,
  player1: string,
  player2: string
): string => {
  // Table tennis rule:
  // Usually changes every 2 points.
  // After 10-10 (total score 20+), changes every 1 point.
  let changes = 0;
  if (totalScoreBeforePoint < 20) {
    changes = Math.floor(totalScoreBeforePoint / 2);
  } else {
    // 10 changes for the first 20 points, then 1 change per point
    changes = 10 + (totalScoreBeforePoint - 20);
  }

  const isPlayer1Starting = startingServer === player1;
  const isPlayer1ServingNow = (changes % 2 === 0) ? isPlayer1Starting : !isPlayer1Starting;

  return isPlayer1ServingNow ? player1 : player2;
};

export const recalculateGame = (game: GameData, player1: string, player2: string): GameData => {
  const startingScore = parseScore(game.ty_so_bat_dau || "0-0");
  const startingServer = game.nguoi_giao_bong_truoc || player1;
  
  let p1Score = startingScore.p1;
  let p2Score = startingScore.p2;

  const recalculatedPoints = game.danh_sach_diem.map((point) => {
    const totalScoreBeforePoint = p1Score + p2Score;
    const currentServer = calculateServer(totalScoreBeforePoint, startingServer, player1, player2);
    
    // Determine who won this point and update score
    if (point.loai_diem === 'thang') {
      p1Score++;
    } else {
      p2Score++;
    }

    return {
      ...point,
      ty_so_hien_tai: `${p1Score}-${p2Score}`,
      khoi_nguon_giao_bong: {
        ...point.khoi_nguon_giao_bong,
        nguoi_thuc_hien: currentServer
      }
    };
  });

  return {
    ...game,
    ty_so_bat_dau: game.ty_so_bat_dau || "0-0",
    nguoi_giao_bong_truoc: startingServer,
    ty_so_chung_cuoc: `${p1Score}-${p2Score}`,
    danh_sach_diem: recalculatedPoints
  };
};

