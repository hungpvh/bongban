/**
 * queryStatistics.js
 * Statistics and aggregation calculations for query results.
 */

import { getTechniqueLabel } from './queryNormalizer.js';

export function calculateQueryStatistics(results = [], dictionary = null) {
    let win = 0;
    let lose = 0;
    const matchIds = new Set();
    const opponentNames = new Set();

    const serveTechMap = {};
    const rallyTechMap = {};

    results.forEach(pt => {
        if (pt.matchId) matchIds.add(pt.matchId);
        if (pt.opponentName) opponentNames.add(pt.opponentName);

        const isWin = pt.winnerRole === 'SELF';
        const isLose = pt.winnerRole === 'OPPONENT';

        if (isWin) win++;
        else if (isLose) lose++;

        // 1. Serve Techniques
        const stKey = pt.serve?.ky_thuat || 'Chưa ghi nhận';
        if (!serveTechMap[stKey]) {
            serveTechMap[stKey] = {
                key: stKey,
                label: getTechniqueLabel(dictionary, stKey),
                count: 0,
                win: 0,
                lose: 0
            };
        }
        serveTechMap[stKey].count++;
        if (isWin) serveTechMap[stKey].win++;
        else if (isLose) serveTechMap[stKey].lose++;

        // 2. Rally Techniques (by slot N-2, N-1, N)
        const checkShot = (slotName, shot) => {
            if (!shot || !shot.ky_thuat) return;
            const tk = shot.ky_thuat;
            const mapKey = `${slotName}_${tk}`;
            if (!rallyTechMap[mapKey]) {
                rallyTechMap[mapKey] = {
                    slot: slotName,
                    techniqueKey: tk,
                    label: getTechniqueLabel(dictionary, tk),
                    count: 0,
                    win: 0,
                    lose: 0
                };
            }
            rallyTechMap[mapKey].count++;
            if (isWin) rallyTechMap[mapKey].win++;
            else if (isLose) rallyTechMap[mapKey].lose++;
        };

        checkShot('N-2', pt.N_2);
        checkShot('N-1', pt.N_1);
        checkShot('N', pt.N);
    });

    const totalDecided = win + lose;
    const winRate = totalDecided > 0 ? ((win / totalDecided) * 100).toFixed(1) : '0.0';
    const loseRate = totalDecided > 0 ? ((lose / totalDecided) * 100).toFixed(1) : '0.0';

    // Format serve techniques array
    const serveTechniques = Object.values(serveTechMap).map(item => {
        const decided = item.win + item.lose;
        return {
            ...item,
            winRate: decided > 0 ? ((item.win / decided) * 100).toFixed(1) : '0.0',
            loseRate: decided > 0 ? ((item.lose / decided) * 100).toFixed(1) : '0.0'
        };
    }).sort((a, b) => b.count - a.count);

    // Format rally techniques array
    const rallyTechniques = Object.values(rallyTechMap).map(item => {
        const decided = item.win + item.lose;
        return {
            ...item,
            winRate: decided > 0 ? ((item.win / decided) * 100).toFixed(1) : '0.0',
            loseRate: decided > 0 ? ((item.lose / decided) * 100).toFixed(1) : '0.0'
        };
    }).sort((a, b) => b.count - a.count);

    return {
        totalPoints: results.length,
        win,
        lose,
        winRate,
        loseRate,
        matchCount: matchIds.size,
        opponentCount: opponentNames.size,
        serveTechniques,
        rallyTechniques
    };
}

export function groupResultsByMatch(results = []) {
    const matchMap = {};

    results.forEach(pt => {
        if (!matchMap[pt.matchId]) {
            matchMap[pt.matchId] = {
                matchId: pt.matchId,
                matchDate: pt.matchDate,
                selfName: pt.selfName,
                opponentName: pt.opponentName,
                matchResult: pt.matchResult,
                matchType: pt.matchType,
                tournamentText: pt.tournamentText,
                points: [],
                winCount: 0,
                loseCount: 0
            };
        }
        matchMap[pt.matchId].points.push(pt);
        if (pt.winnerRole === 'SELF') matchMap[pt.matchId].winCount++;
        else if (pt.winnerRole === 'OPPONENT') matchMap[pt.matchId].loseCount++;
    });

    return Object.values(matchMap).sort((a, b) => b.matchDate.localeCompare(a.matchDate));
}
