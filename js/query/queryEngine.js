/**
 * queryEngine.js
 * Deterministic Query Execution Engine for Table Tennis points.
 * Operates purely in-memory over the normalized queryIndex.
 */

import { ATTACK_TECHNIQUES, getObservedPhaseForTouchNumber } from './queryNormalizer.js';
import { removeAccents } from './naturalLanguageParser.js';

export function executeQuery(queryIndex = [], finalQuerySpec = {}) {
    const spec = finalQuerySpec || {};
    const matchFilter = spec.match || {};
    const pointFilter = spec.point || {};
    const touchFilter = pointFilter.touchCount || {};
    const serveFilter = pointFilter.serve || {};
    const rallyConditions = pointFilter.rallyConditions || [];
    const semanticTags = pointFilter.semanticTags || [];

    return queryIndex.filter(pt => {
        // --- 1. Match Filters ---
        if (matchFilter.matchIds && matchFilter.matchIds.length > 0) {
            if (!matchFilter.matchIds.includes(pt.matchId)) return false;
        }

        if (matchFilter.opponents && matchFilter.opponents.length > 0) {
            const ptOppNorm = removeAccents(pt.opponentName);
            const matchesOpp = matchFilter.opponents.some(op => removeAccents(op) === ptOppNorm);
            if (!matchesOpp) return false;
        }

        if (matchFilter.matchTypes && matchFilter.matchTypes.length > 0) {
            if (!matchFilter.matchTypes.includes(pt.matchType)) return false;
        }

        if (matchFilter.dateFrom) {
            if (pt.matchDate < matchFilter.dateFrom) return false;
        }

        if (matchFilter.dateTo) {
            if (pt.matchDate > matchFilter.dateTo) return false;
        }

        if (matchFilter.tournamentText) {
            const queryTourNorm = removeAccents(matchFilter.tournamentText);
            const ptTourNorm = removeAccents(pt.tournamentText);
            if (!ptTourNorm.includes(queryTourNorm)) return false;
        }

        // --- 2. Point Filters ---
        // Touch Count
        if (touchFilter.eq !== null && touchFilter.eq !== undefined) {
            if (pt.touchCount !== touchFilter.eq) return false;
        }
        if (touchFilter.min !== null && touchFilter.min !== undefined) {
            if (pt.touchCount < touchFilter.min) return false;
        }
        if (touchFilter.max !== null && touchFilter.max !== undefined) {
            if (pt.touchCount > touchFilter.max) return false;
        }

        // Server
        if (pointFilter.server && pointFilter.server !== 'ANY') {
            if (pointFilter.server === 'SELF') {
                if (pt.serverRole !== 'SELF') return false;
            } else if (pointFilter.server === 'OPPONENT') {
                if (pt.serverRole !== 'OPPONENT') return false;
            } else {
                if (pt.server !== pointFilter.server) return false;
            }
        }

        // Result
        if (pointFilter.result && pointFilter.result !== 'ANY') {
            if (pointFilter.result === 'SELF_WIN') {
                if (pt.winnerRole !== 'SELF') return false;
            } else if (pointFilter.result === 'SELF_LOSE') {
                if (pt.winnerRole !== 'OPPONENT') return false;
            }
        }

        // Serve technique and properties
        if (serveFilter.techniqueKeys && serveFilter.techniqueKeys.length > 0) {
            const st = pt.serve?.ky_thuat;
            if (!st || !serveFilter.techniqueKeys.includes(st)) return false;
        }
        if (serveFilter.horizontalLanding && serveFilter.horizontalLanding.length > 0) {
            const hl = pt.serve?.dac_tinh?.diem_roi_ngang;
            if (!hl || !serveFilter.horizontalLanding.includes(hl)) return false;
        }
        if (serveFilter.length && serveFilter.length.length > 0) {
            const l = pt.serve?.dac_tinh?.do_dai;
            if (!l || !serveFilter.length.includes(l)) return false;
        }
        if (serveFilter.spin && serveFilter.spin.length > 0) {
            const sp = pt.serve?.dac_tinh?.do_xoay;
            if (!sp || !serveFilter.spin.includes(sp)) return false;
        }

        // Rally Conditions
        for (const cond of rallyConditions) {
            let candidateShots = [];
            if (cond.slot === 'N') candidateShots = [pt.N];
            else if (cond.slot === 'N_1') candidateShots = [pt.N_1];
            else if (cond.slot === 'N_2') candidateShots = [pt.N_2];
            else if (cond.slot === 'TOUCH_3') candidateShots = [getObservedPhaseForTouchNumber(pt, 3)];
            else if (cond.slot === 'ANY' || !cond.slot) candidateShots = [pt.N_2, pt.N_1, pt.N].filter(Boolean);

            const matchesThisCondition = candidateShots.some(shot => {
                if (!shot) return false;

                // Actor
                if (cond.actor && cond.actor !== 'ANY') {
                    if (cond.actor === 'SELF' && shot.nguoi_thuc_hien !== pt.selfName) return false;
                    if (cond.actor === 'OPPONENT' && shot.nguoi_thuc_hien !== pt.opponentName) return false;
                    if (cond.actor !== 'SELF' && cond.actor !== 'OPPONENT' && shot.nguoi_thuc_hien !== cond.actor) return false;
                }

                // Technique
                if (cond.techniqueKeys && cond.techniqueKeys.length > 0) {
                    if (!shot.ky_thuat || !cond.techniqueKeys.includes(shot.ky_thuat)) return false;
                }
                if (cond.excludeTechniqueKeys && cond.excludeTechniqueKeys.length > 0) {
                    if (shot.ky_thuat && cond.excludeTechniqueKeys.includes(shot.ky_thuat)) return false;
                }

                // Nature
                if (cond.nature && cond.nature.length > 0) {
                    if (!shot.tinh_chat || !cond.nature.includes(shot.tinh_chat)) return false;
                }
                if (cond.excludeNature && cond.excludeNature.length > 0) {
                    if (shot.tinh_chat && cond.excludeNature.includes(shot.tinh_chat)) return false;
                }

                // Landing
                if (cond.horizontalLanding && cond.horizontalLanding.length > 0) {
                    if (!shot.dac_tinh?.diem_roi_ngang || !cond.horizontalLanding.includes(shot.dac_tinh.diem_roi_ngang)) return false;
                }

                // Length
                if (cond.length && cond.length.length > 0) {
                    if (!shot.dac_tinh?.do_dai || !cond.length.includes(shot.dac_tinh.do_dai)) return false;
                }

                // Spin
                if (cond.spin && cond.spin.length > 0) {
                    if (!shot.dac_tinh?.do_xoay || !cond.spin.includes(shot.dac_tinh.do_xoay)) return false;
                }

                // Error Location
                if (cond.errorLocation && cond.errorLocation.length > 0) {
                    if (!shot.dac_tinh?.vi_tri_hong || !cond.errorLocation.includes(shot.dac_tinh.vi_tri_hong)) return false;
                }
                if (cond.excludeErrorLocation && cond.excludeErrorLocation.length > 0) {
                    if (shot.dac_tinh?.vi_tri_hong && cond.excludeErrorLocation.includes(shot.dac_tinh.vi_tri_hong)) return false;
                }

                return true;
            });

            if (!matchesThisCondition) return false;
        }

        // Semantic Tags
        for (const tag of semanticTags) {
            if (tag === 'DIRECT_SERVE_WIN') {
                const isMyServe = pt.serverRole === 'SELF';
                const isMyWin = pt.winnerRole === 'SELF';
                const shortRally = pt.touchCount <= 2;
                const oppFinishOrDirect = pt.touchCount === 1 || (pt.N && pt.N.nguoi_thuc_hien === pt.opponentName);
                if (!(isMyServe && isMyWin && shortRally && oppFinishOrDirect)) return false;
            }

            if (tag === 'OPPONENT_RECEIVE_ERROR_ON_MY_SERVE') {
                const isMyServe = pt.serverRole === 'SELF';
                const isMyWin = pt.winnerRole === 'SELF';
                const shortRally = pt.touchCount <= 2;
                const oppReceiverShot = pt.N && pt.N.nguoi_thuc_hien === pt.opponentName;
                const isError = oppReceiverShot && (
                    pt.N.dac_tinh?.vi_tri_hong != null ||
                    ['forced_error', 'unforced_error'].includes(pt.N.tinh_chat)
                );
                if (!(isMyServe && isMyWin && shortRally && isError)) return false;
            }

            if (tag === 'THIRD_BALL_ATTACK') {
                const isMyServe = pt.serverRole === 'SELF';
                const has3Touches = pt.touchCount >= 3;
                if (!isMyServe || !has3Touches) return false;

                const phase3 = getObservedPhaseForTouchNumber(pt, 3);
                if (!phase3 || phase3.nguoi_thuc_hien !== pt.selfName) return false;
                if (!phase3.ky_thuat || !ATTACK_TECHNIQUES.has(phase3.ky_thuat)) return false;
            }
        }

        return true;
    });
}

export function applyFacetedFilters(results = [], facetFilters = {}) {
    const f = facetFilters || {};

    return results.filter(pt => {
        if (f.matchId && f.matchId !== 'ALL' && pt.matchId !== f.matchId) return false;
        if (f.opponent && f.opponent !== 'ALL' && pt.opponentName !== f.opponent) return false;
        if (f.matchType && f.matchType !== 'ALL' && pt.matchType !== f.matchType) return false;
        if (f.gameNo && f.gameNo !== 'ALL' && String(pt.gameNo) !== String(f.gameNo)) return false;
        
        if (f.result && f.result !== 'ALL') {
            if (f.result === 'WIN' && pt.winnerRole !== 'SELF') return false;
            if (f.result === 'LOSE' && pt.winnerRole !== 'OPPONENT') return false;
        }

        if (f.touchCount && f.touchCount !== 'ALL') {
            const tc = parseInt(f.touchCount, 10);
            if (!isNaN(tc)) {
                if (f.touchCount === '5+' ? pt.touchCount < 5 : pt.touchCount !== tc) return false;
            }
        }

        if (f.serveTechnique && f.serveTechnique !== 'ALL') {
            if (pt.serve?.ky_thuat !== f.serveTechnique) return false;
        }

        if (f.rallyTechnique && f.rallyTechnique !== 'ALL') {
            const hasTech = [pt.N_2?.ky_thuat, pt.N_1?.ky_thuat, pt.N?.ky_thuat].includes(f.rallyTechnique);
            if (!hasTech) return false;
        }

        if (f.finishingNature && f.finishingNature !== 'ALL') {
            if (pt.N?.tinh_chat !== f.finishingNature) return false;
        }

        if (f.errorLocation && f.errorLocation !== 'ALL') {
            const hasErr = [pt.N_2?.dac_tinh?.vi_tri_hong, pt.N_1?.dac_tinh?.vi_tri_hong, pt.N?.dac_tinh?.vi_tri_hong].includes(f.errorLocation);
            if (!hasErr) return false;
        }

        return true;
    });
}
