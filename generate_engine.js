const fs = require('fs');

const content = `
import { calculateServerForPoint } from '../logic.js';

export function analyzeMatch(matches, dict, filters, perspectiveStr) {
    if (!matches || matches.length === 0) return { empty: true };
    
    // Filter matches
    let filteredMatches = matches;
    if (filters.matchId) {
        filteredMatches = filteredMatches.filter(m => m.id === filters.matchId);
    }
    if (filters.opponent) {
        filteredMatches = filteredMatches.filter(m => m.thong_tin_tran_dau.doi_thu_2 === filters.opponent);
    }
    
    let stats = {
        totalMatches: filteredMatches.length,
        totalGames: 0,
        totalRallies: 0,
        pointsWon: 0,
        pointsLost: 0,
        pointsWonOnServe: 0,
        pointsWonOnReceive: 0,
        serveCount: 0,
        receiveCount: 0,
        gamesWon: 0,
        gamesLost: 0,
        winStreak: 0,
        loseStreak: 0,
        
        techniques: {}, // count, won, lost, success, winner, unforced, forced
        serves: {}, // same
        receives: {},
        heatmaps: {
            serve: { ngan: { trai: 0, giua: 0, phai: 0 }, dai: { trai: 0, giua: 0, phai: 0 } },
            receive: { ngan: { trai: 0, giua: 0, phai: 0 }, dai: { trai: 0, giua: 0, phai: 0 } },
            all: { ngan: { trai: 0, giua: 0, phai: 0 }, dai: { trai: 0, giua: 0, phai: 0 } }
        },
        nBall: {
            2: { opps: 0, atts: 0, wins: 0, losses: 0, w:0, f:0, u:0 },
            3: { opps: 0, atts: 0, wins: 0, losses: 0, w:0, f:0, u:0 },
            4: { opps: 0, atts: 0, wins: 0, losses: 0, w:0, f:0, u:0 },
            5: { opps: 0, atts: 0, wins: 0, losses: 0, w:0, f:0, u:0 }
        },
        patterns: {},
        combinations: {},
        dataQuality: [],
        
        gamesDetails: []
    };

    let currentWinStreak = 0;
    let currentLoseStreak = 0;

    filteredMatches.forEach(match => {
        const p1 = match.thong_tin_tran_dau.doi_thu_1;
        const p2 = match.thong_tin_tran_dau.doi_thu_2;
        const myName = perspectiveStr === 'doi_thu_1' ? p1 : p2;
        const oppName = perspectiveStr === 'doi_thu_1' ? p2 : p1;

        match.danh_sach_game.forEach(game => {
            stats.totalGames++;
            const pts = game.danh_sach_diem || [];
            
            let gamePtsWon = 0;
            let gamePtsLost = 0;
            let gameWinStreak = 0;
            let gameLoseStreak = 0;
            let maxGameWinStreak = 0;
            let maxGameLoseStreak = 0;

            pts.forEach((pt, idx) => {
                // Ensure server is correct or fallback to point's server
                let calculatedServer = calculateServerForPoint(idx, game.nguoi_giao_bong_truoc, p1, p2);
                let actualServer = pt.khoi_nguon_giao_bong?.nguoi_thuc_hien || calculatedServer;
                
                if (actualServer !== calculatedServer) {
                    stats.dataQuality.push(\`Game \${game.game_so} Point \${pt.thu_tu_diem}: Server mismatch (Data: \${actualServer}, Calc: \${calculatedServer})\`);
                }

                stats.totalRallies++;
                const isMyPoint = pt.nguoi_ghi_diem === myName;
                const amIServer = actualServer === myName;

                if (isMyPoint) {
                    stats.pointsWon++;
                    gamePtsWon++;
                    gameWinStreak++;
                    if (gameLoseStreak > maxGameLoseStreak) maxGameLoseStreak = gameLoseStreak;
                    gameLoseStreak = 0;
                    if (amIServer) stats.pointsWonOnServe++;
                    else stats.pointsWonOnReceive++;
                } else {
                    stats.pointsLost++;
                    gamePtsLost++;
                    gameLoseStreak++;
                    if (gameWinStreak > maxGameWinStreak) maxGameWinStreak = gameWinStreak;
                    gameWinStreak = 0;
                }
                
                if (amIServer) stats.serveCount++;
                else stats.receiveCount++;

                // Track techniques from N, N-1, N-2, Serve
                const trackTech = (stroke, isMe, isEnd) => {
                    if (!stroke || !stroke.ky_thuat) return;
                    const tk = stroke.ky_thuat;
                    if (!stats.techniques[tk]) stats.techniques[tk] = { count: 0, won: 0, lost: 0, w:0, f:0, u:0, meCount: 0, oppCount: 0 };
                    
                    if (isMe) stats.techniques[tk].meCount++;
                    else stats.techniques[tk].oppCount++;
                    
                    stats.techniques[tk].count++;
                    
                    if (isEnd) {
                        if (isMyPoint) stats.techniques[tk].won++;
                        else stats.techniques[tk].lost++;
                        
                        if (pt.cu_ket_thuc_N.tinh_chat === 'winner') stats.techniques[tk].w++;
                        if (pt.cu_ket_thuc_N.tinh_chat === 'forced_error') stats.techniques[tk].f++;
                        if (pt.cu_ket_thuc_N.tinh_chat === 'unforced_error') stats.techniques[tk].u++;
                    }
                };

                // Heatmap logic (canonical: view from receiver's perspective)
                // If I receive, my view: trái = left, phải = right.
                const addHeatmap = (mapObj, dropX, dropY, receiverIsMe) => {
                    if (!dropX || !dropY) return;
                    // canonical coordinates are absolute: "trai", "phai", "giua".
                    // mirror it depending on receiver? Wait, canonical JSON is always absolute to table?
                    // "Hiển thị đúng góc nhìn người nhận: - doi_thu_1 nhận: trái trái màn hình, phải phải màn hình, ngắn trên, dài dưới. - doi_thu_2 nhận: trái phải màn hình, phải trái màn hình, ngắn dưới, dài trên. Không đổi canonical JSON."
                    // So we just store it canonically and let UI mirror it based on perspective!
                    if (!mapObj[dropY]) mapObj[dropY] = { trai: 0, giua: 0, phai: 0 };
                    if (mapObj[dropY][dropX] !== undefined) mapObj[dropY][dropX]++;
                };

                // Analyze based on touches
                const touches = pt.tong_so_cham || 0;
                let strokeN = pt.cu_ket_thuc_N;
                let strokeN1 = pt.cu_dap_tra_N_1;
                let strokeN2 = pt.cu_tao_loi_the_N_2;
                let strokeServe = pt.khoi_nguon_giao_bong;

                if (strokeServe) {
                    trackTech(strokeServe, amIServer, touches === 1);
                    if (amIServer) {
                        const tk = strokeServe.ky_thuat;
                        if (tk) {
                            if (!stats.serves[tk]) stats.serves[tk] = { count: 0, won: 0, lost: 0 };
                            stats.serves[tk].count++;
                            if (isMyPoint) stats.serves[tk].won++;
                            else stats.serves[tk].lost++;
                        }
                    }
                }

                if (strokeN) trackTech(strokeN, strokeN.nguoi_thuc_hien === myName, true);
                if (strokeN1) trackTech(strokeN1, strokeN1.nguoi_thuc_hien === myName, false);
                if (strokeN2) trackTech(strokeN2, strokeN2.nguoi_thuc_hien === myName, false);
                
                // N-Ball generic
                const trackNBall = (n, opps, atts, won, w, f, u) => {
                    if (!stats.nBall[n]) stats.nBall[n] = { opps: 0, atts: 0, wins: 0, losses: 0, w:0, f:0, u:0 };
                    if (opps) stats.nBall[n].opps++;
                    if (atts) {
                        stats.nBall[n].atts++;
                        if (won) stats.nBall[n].wins++;
                        else stats.nBall[n].losses++;
                        if (w) stats.nBall[n].w++;
                        if (f) stats.nBall[n].f++;
                        if (u) stats.nBall[n].u++;
                    }
                };
                
                // Example: 3rd ball (n=3)
                // amIServer -> my touches are 1, 3, 5
                // if touches >= 2, I have opportunity for 3rd ball
                if (amIServer) {
                    if (touches >= 2) {
                        const isAtt = touches >= 3;
                        const won = isMyPoint;
                        const w = strokeN?.tinh_chat === 'winner';
                        const f = strokeN?.tinh_chat === 'forced_error';
                        const u = strokeN?.tinh_chat === 'unforced_error';
                        trackNBall(3, true, isAtt, won, w && won, f && won, u && !won);
                    }
                    if (touches >= 4) {
                        const isAtt = touches >= 5;
                        const won = isMyPoint;
                        trackNBall(5, true, isAtt, won, false, false, false); // Simplify for now
                    }
                } else {
                    if (touches >= 1) {
                        const isAtt = touches >= 2;
                        const won = isMyPoint;
                        trackNBall(2, true, isAtt, won, false, false, false);
                    }
                }
                
                // Patterns
                // Build simple pattern string
                let patArr = [];
                if (touches >= 1 && strokeServe) patArr.push(strokeServe.ky_thuat || 'Serve');
                if (touches >= 2 && touches <= 3 && strokeN1) patArr.push(strokeN1.ky_thuat || 'Return');
                if (touches >= 3 && touches <= 4 && strokeN2) patArr.push(strokeN2.ky_thuat || 'N2');
                if (strokeN) patArr.push(strokeN.ky_thuat || 'N');
                
                if (patArr.length > 0) {
                    const patStr = patArr.join(' → ');
                    if (!stats.patterns[patStr]) stats.patterns[patStr] = { count: 0, won: 0, lost: 0, w:0, f:0, u:0 };
                    stats.patterns[patStr].count++;
                    if (isMyPoint) stats.patterns[patStr].won++;
                    else stats.patterns[patStr].lost++;
                }
            });
            
            if (gameWinStreak > maxGameWinStreak) maxGameWinStreak = gameWinStreak;
            if (gameLoseStreak > maxGameLoseStreak) maxGameLoseStreak = gameLoseStreak;
            
            if (maxGameWinStreak > stats.winStreak) stats.winStreak = maxGameWinStreak;
            if (maxGameLoseStreak > stats.loseStreak) stats.loseStreak = maxGameLoseStreak;

            let [p1Score, p2Score] = (game.ty_so_chung_cuoc || '0-0').split('-').map(Number);
            let myScore = perspectiveStr === 'doi_thu_1' ? p1Score : p2Score;
            let oppScore = perspectiveStr === 'doi_thu_1' ? p2Score : p1Score;

            if (myScore > oppScore) stats.gamesWon++;
            else if (oppScore > myScore) stats.gamesLost++;

            stats.gamesDetails.push({
                gameNum: game.game_so,
                startScore: game.ty_so_bat_dau,
                endScore: game.ty_so_chung_cuoc,
                ptsWon: gamePtsWon,
                ptsLost: gamePtsLost,
                rallies: pts.length,
                maxWinStreak: maxGameWinStreak
            });
        });
    });

    return stats;
}
`;

fs.writeFileSync('js/analytics/engine.js', content);
console.log('Engine created');
