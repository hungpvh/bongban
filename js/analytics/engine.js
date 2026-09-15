export function analyzeMatch(matches, dict, filters, perspectiveStr) {
    let filteredMatches = matches;
    if (filters.matchId) {
        filteredMatches = filteredMatches.filter(m => m.id_tran_dau === filters.matchId);
    }

    const stats = {
        empty: true,
        dataQuality: [],
        totalGames: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalRallies: 0,
        pointsWon: 0,
        pointsLost: 0,
        winStreak: 0,
        loseStreak: 0,
        serveCount: 0,
        receiveCount: 0,
        pointsWonOnServe: 0,
        pointsWonOnReceive: 0,
        gamesDetails: [],
        techniques: {}, // 4a
        inducedErrors: {}, // 4b
        involvedFinishing: {}, // 4c
        serveTechniques: {}, // 4d1
        opponentServeTechniques: {}, // 4d2
        nBall: {
            2: { opps: 0, atts: 0, wins: 0, losses: 0 },
            3: { opps: 0, atts: 0, wins: 0, losses: 0 },
            4: { opps: 0, atts: 0, wins: 0, losses: 0 },
            5: { opps: 0, atts: 0, wins: 0, losses: 0 }
        }, 
        patternsServe: {}, 
        patternsReceive: {}, 
        heatmaps: {
            win: { ngan: { trai: 0, giua: 0, phai: 0 }, dai: { trai: 0, giua: 0, phai: 0 } },
            loss: { ngan: { trai: 0, giua: 0, phai: 0 }, dai: { trai: 0, giua: 0, phai: 0 } }
        }
    };

    if (!filteredMatches.length) return stats;
    stats.empty = false;

    const ATTACK_TECHNIQUES_RAW = [
        'giat_phai', 'doi_cong_phai', 'flick_phai', 
        'giat_trai', 'doi_cong_trai', 'flick_trai', 
        'bat_dap_bong', 'doi_giat_xa_ban'
    ];
    
    const ATTACK_TECHNIQUES = new Set();
    const dictKTC = dict?.ky_thuat || {};
    ATTACK_TECHNIQUES_RAW.forEach(tk => {
        if (dictKTC[tk]) {
            ATTACK_TECHNIQUES.add(tk);
        } else {
            stats.dataQuality.push(`Kỹ thuật tấn công "${tk}" không tồn tại trong từ điển.`);
        }
    });

    const getObservedPhaseForTouchNumber = (pt, touchNumber) => {
        const t = pt.tong_so_cham || 0;
        if (touchNumber === 1) return pt.khoi_nguon_giao_bong;
        if (touchNumber === t) return pt.cu_ket_thuc_N;
        if (touchNumber === t - 1) return pt.cu_dap_tra_N_1;
        if (touchNumber === t - 2) return pt.cu_tao_loi_the_N_2;
        return null;
    };

    const getDisplayTech = (tk) => {
        if (!tk) return 'Chưa xác định';
        return dictKTC[tk] || tk;
    };

    const isServeTechnique = (tk) => tk && tk.startsWith('giao_bong');
    const posKey = (x, y) => (x && y) ? `${x}-${y}` : 'Chưa xác định';

    filteredMatches.forEach(match => {
        const p1 = match.thong_tin.doi_thu_1;
        const p2 = match.thong_tin.doi_thu_2;
        const myName = perspectiveStr === 'doi_thu_1' ? p1 : p2;
        const oppName = perspectiveStr === 'doi_thu_1' ? p2 : p1;

        (match.chi_tiet_game || []).forEach(game => {
            if (game.game_so === undefined) return;
            stats.totalGames++;
            
            const pts = game.danh_sach_diem || [];
            
            let gameTotalRallies = pts.length;
            let gamePtsWon = 0;
            let gamePtsLost = 0;
            let gameWinStreak = 0;
            let gameLoseStreak = 0;
            let maxGameWinStreak = 0;
            let maxGameLoseStreak = 0;
            let gamePointsWonOnServe = 0;
            let gamePointsWonOnReceive = 0;
            let gameServeCount = 0;
            let gameReceiveCount = 0;

            pts.forEach((pt) => {
                stats.totalRallies++;
                
                // 1. Resolve server
                let server = pt.nguoi_giao_bong;
                if (!server) server = pt.khoi_nguon_giao_bong?.nguoi_thuc_hien;
                
                if (!server) {
                    stats.dataQuality.push(`Game ${game.game_so} Point ${pt.thu_tu_diem}: Thiếu người giao bóng.`);
                    return; 
                }

                const receiver = (server === myName) ? oppName : myName;
                const winner = pt.nguoi_ghi_diem;
                const loser = (winner === myName) ? oppName : myName;

                const isWin = winner === myName;
                if (isWin) {
                    stats.pointsWon++;
                    gamePtsWon++;
                    gameWinStreak++;
                    if (gameLoseStreak > maxGameLoseStreak) maxGameLoseStreak = gameLoseStreak;
                    gameLoseStreak = 0;
                    if (server === myName) {
                        stats.pointsWonOnServe++;
                        gamePointsWonOnServe++;
                    } else {
                        stats.pointsWonOnReceive++;
                        gamePointsWonOnReceive++;
                    }
                } else {
                    stats.pointsLost++;
                    gamePtsLost++;
                    gameLoseStreak++;
                    if (gameWinStreak > maxGameWinStreak) maxGameWinStreak = gameWinStreak;
                    gameWinStreak = 0;
                }

                if (server === myName) {
                    stats.serveCount++;
                    gameServeCount++;
                } else {
                    stats.receiveCount++;
                    gameReceiveCount++;
                }

                const t = pt.tong_so_cham || 0;
                const finalPhase = pt.cu_ket_thuc_N;
                const phaseN1 = pt.cu_dap_tra_N_1;
                const servePhase = pt.khoi_nguon_giao_bong;

                // II. Ending Technique (4a)
                if (finalPhase && finalPhase.nguoi_thuc_hien === myName && finalPhase.ky_thuat) {
                    const tk = finalPhase.ky_thuat;
                    if (!stats.techniques[tk]) {
                        stats.techniques[tk] = { count: 0, won: 0, lost: 0 };
                    }
                    stats.techniques[tk].count++;
                    if (isWin) stats.techniques[tk].won++;
                    else stats.techniques[tk].lost++;
                }

                // III. Induced Error Technique (4b)
                if (finalPhase && finalPhase.nguoi_thuc_hien === oppName && finalPhase.tinh_chat === 'forced_error') {
                    if (phaseN1 && phaseN1.nguoi_thuc_hien === myName && phaseN1.ky_thuat) {
                        const tk = phaseN1.ky_thuat;
                        if (!stats.inducedErrors[tk]) {
                            stats.inducedErrors[tk] = { count: 0, won: 0 };
                        }
                        stats.inducedErrors[tk].count++;
                        if (isWin) stats.inducedErrors[tk].won++;
                    }
                }

                // 4c. Kỹ Thuật Tham gia Kết thúc Điểm
                let involvedTech = null;
                if (finalPhase && finalPhase.nguoi_thuc_hien === myName) {
                    // Case 1
                    involvedTech = finalPhase.ky_thuat;
                } else if (finalPhase && finalPhase.nguoi_thuc_hien === oppName) {
                    if (t >= 3 && phaseN1 && phaseN1.nguoi_thuc_hien === myName) {
                        // Case 2a
                        involvedTech = phaseN1.ky_thuat;
                    } else if (t <= 2 && servePhase && servePhase.nguoi_thuc_hien === myName) {
                        // Case 2b
                        involvedTech = servePhase.ky_thuat;
                    }
                }
                if (involvedTech) {
                    if (!stats.involvedFinishing[involvedTech]) {
                        stats.involvedFinishing[involvedTech] = { count: 0, won: 0, lost: 0 };
                    }
                    stats.involvedFinishing[involvedTech].count++;
                    if (isWin) stats.involvedFinishing[involvedTech].won++;
                    else stats.involvedFinishing[involvedTech].lost++;
                }

                // 4d1. Kỹ thuật Giao bóng
                if (server === myName) {
                    const tk = servePhase?.ky_thuat;
                    if (isServeTechnique(tk)) {
                        if (!stats.serveTechniques[tk]) {
                            stats.serveTechniques[tk] = { 
                                count: 0, won: 0, lost: 0, 
                                directWon: 0, directLost: 0, 
                                winPositions: {}, lossPositions: {} 
                            };
                        }
                        stats.serveTechniques[tk].count++;
                        
                        const pKey = posKey(servePhase?.dac_tinh?.diem_roi_ngang, servePhase?.dac_tinh?.do_dai);
                        
                        if (isWin) {
                            stats.serveTechniques[tk].won++;
                            if (t <= 2) stats.serveTechniques[tk].directWon++;
                            stats.serveTechniques[tk].winPositions[pKey] = (stats.serveTechniques[tk].winPositions[pKey] || 0) + 1;
                        } else {
                            stats.serveTechniques[tk].lost++;
                            if (t <= 2) stats.serveTechniques[tk].directLost++;
                            stats.serveTechniques[tk].lossPositions[pKey] = (stats.serveTechniques[tk].lossPositions[pKey] || 0) + 1;
                        }
                    }
                }

                // 4d2. Kỹ thuật Giao bóng của Đối thủ
                if (server === oppName) {
                    const tk = servePhase?.ky_thuat;
                    if (isServeTechnique(tk)) {
                        if (!stats.opponentServeTechniques[tk]) {
                            stats.opponentServeTechniques[tk] = { 
                                count: 0, wonP1: 0, wonP2: 0, 
                                directWonP1: 0, directWonP2: 0, 
                                winPositionsP1: {}, winPositionsP2: {} 
                            };
                        }
                        stats.opponentServeTechniques[tk].count++;
                        
                        const pKey = posKey(servePhase?.dac_tinh?.diem_roi_ngang, servePhase?.dac_tinh?.do_dai);

                        if (isWin) {
                            stats.opponentServeTechniques[tk].wonP1++;
                            if (t <= 2) stats.opponentServeTechniques[tk].directWonP1++;
                            stats.opponentServeTechniques[tk].winPositionsP1[pKey] = (stats.opponentServeTechniques[tk].winPositionsP1[pKey] || 0) + 1;
                        } else {
                            stats.opponentServeTechniques[tk].wonP2++;
                            if (t <= 2) stats.opponentServeTechniques[tk].directWonP2++;
                            stats.opponentServeTechniques[tk].winPositionsP2[pKey] = (stats.opponentServeTechniques[tk].winPositionsP2[pKey] || 0) + 1;
                        }
                    } else if (tk) {
                        stats.dataQuality.push(`Game ${game.game_so} Point ${pt.thu_tu_diem}: Kỹ thuật giao bóng của đối thủ không hợp lệ (${tk})`);
                    }
                }


                // IV. N-Ball
                [2, 3, 4, 5].forEach(n => {
                    const expectedServerForN = (n % 2 === 0) ? receiver : server; 
                    if (expectedServerForN !== myName) return; 

                    // Check if phase is observable
                    if (n >= t - 2 && n <= t) {
                        const phaseN = getObservedPhaseForTouchNumber(pt, n);
                        if (phaseN && phaseN.nguoi_thuc_hien === myName) {
                            stats.nBall[n].opps++;
                            if (phaseN.ky_thuat && ATTACK_TECHNIQUES.has(phaseN.ky_thuat)) {
                                stats.nBall[n].atts++;
                                if (isWin) stats.nBall[n].wins++;
                                else stats.nBall[n].losses++;
                            } else if (phaseN.ky_thuat && !dictKTC[phaseN.ky_thuat]) {
                                stats.dataQuality.push(`Kỹ thuật "${phaseN.ky_thuat}" không có trong từ điển, không thể phân loại Attack.`);
                            }
                        }
                    }
                });

                // V. Top Patterns
                let patArr = [];
                for (let i = 1; i <= t; i++) {
                    const phase = getObservedPhaseForTouchNumber(pt, i);
                    if (phase) {
                        patArr.push(getDisplayTech(phase.ky_thuat));
                    } else {
                        if (patArr[patArr.length - 1] !== '...') {
                            patArr.push('...');
                        }
                    }
                }
                const patKey = patArr.join(' → ') + ` (${t} chạm)`;
                const patDict = server === myName ? stats.patternsServe : stats.patternsReceive;
                if (!patDict[patKey]) patDict[patKey] = { count: 0, won: 0, lost: 0 };
                patDict[patKey].count++;
                if (isWin) patDict[patKey].won++;
                else patDict[patKey].lost++;

                // VI. Heatmap
                let hmLocation = null;
                const finalPerformer = finalPhase?.nguoi_thuc_hien;
                
                if (isWin) {
                    if (t <= 2) {
                        if (finalPerformer === myName) {
                            hmLocation = finalPhase?.dac_tinh;
                        } else if (finalPerformer === oppName && servePhase?.nguoi_thuc_hien === myName) {
                            hmLocation = servePhase?.dac_tinh;
                        }
                    } else {
                        if (finalPerformer === myName) {
                            hmLocation = finalPhase?.dac_tinh;
                        } else if (finalPerformer === oppName && phaseN1?.nguoi_thuc_hien === myName) {
                            hmLocation = phaseN1?.dac_tinh;
                        }
                    }
                    if (hmLocation && hmLocation.diem_roi_ngang && hmLocation.do_dai) {
                        if (stats.heatmaps.win[hmLocation.do_dai] && stats.heatmaps.win[hmLocation.do_dai][hmLocation.diem_roi_ngang] !== undefined) {
                            stats.heatmaps.win[hmLocation.do_dai][hmLocation.diem_roi_ngang]++;
                        }
                    }
                } else {
                    if (t <= 2) {
                        if (finalPerformer === oppName) {
                            hmLocation = finalPhase?.dac_tinh;
                        } else if (finalPerformer === myName && servePhase?.nguoi_thuc_hien === oppName) {
                            hmLocation = servePhase?.dac_tinh;
                        }
                    } else {
                        if (finalPerformer === oppName) {
                            hmLocation = finalPhase?.dac_tinh;
                        } else if (finalPerformer === myName && phaseN1?.nguoi_thuc_hien === oppName) {
                            hmLocation = phaseN1?.dac_tinh;
                        }
                    }
                    if (hmLocation && hmLocation.diem_roi_ngang && hmLocation.do_dai) {
                        if (stats.heatmaps.loss[hmLocation.do_dai] && stats.heatmaps.loss[hmLocation.do_dai][hmLocation.diem_roi_ngang] !== undefined) {
                            stats.heatmaps.loss[hmLocation.do_dai][hmLocation.diem_roi_ngang]++;
                        }
                    }
                }
            });
            
            if (gameWinStreak > maxGameWinStreak) maxGameWinStreak = gameWinStreak;
            if (gameLoseStreak > maxGameLoseStreak) maxGameLoseStreak = gameLoseStreak;
            
            if (maxGameWinStreak > stats.winStreak) stats.winStreak = maxGameWinStreak;
            if (maxGameLoseStreak > stats.loseStreak) stats.loseStreak = maxGameLoseStreak;

            stats.gamesDetails.push({
                gameNum: game.game_so,
                startScore: game.ty_so_bat_dau,
                endScore: game.ty_so_chung_cuoc,
                ptsWon: gamePtsWon,
                ptsLost: gamePtsLost,
                rallies: gameTotalRallies,
                maxWinStreak: maxGameWinStreak,
                maxLoseStreak: maxGameLoseStreak,
                ptsWonOnServe: gamePointsWonOnServe,
                ptsWonOnReceive: gamePointsWonOnReceive,
                serveCount: gameServeCount,
                receiveCount: gameReceiveCount
            });
        });
    });

    return stats;
}
