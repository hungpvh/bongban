/**
 * naturalLanguageParser.js
 * Domain-specific Vietnamese Natural Language Parser for Table Tennis query pipeline.
 * Deterministic mapping to QuerySpec and ambiguity detection.
 */

export function removeAccents(str = '') {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
}

export function createEmptyQuerySpec() {
    return {
        match: {
            matchIds: [],
            opponents: [],
            dateFrom: null,
            dateTo: null,
            matchTypes: [],
            tournamentText: null
        },
        point: {
            touchCount: {
                eq: null,
                min: null,
                max: null
            },
            server: 'ANY', // 'ANY' | 'SELF' | 'OPPONENT' | string name
            result: 'ANY', // 'ANY' | 'SELF_WIN' | 'SELF_LOSE'
            serve: {
                techniqueKeys: [],
                horizontalLanding: [],
                length: [],
                spin: []
            },
            rallyConditions: [],
            semanticTags: []
        },
        analysisDimension: null, // e.g. 'SERVE_TECHNIQUE'
        aggregation: null // e.g. 'MOST_LOSSES'
    };
}

const TECHNIQUE_SYNONYMS = [
    { key: 'giat_phai', phrases: ['giat phai', 'giật phải', 'topspin phai', 'forehand topspin'] },
    { key: 'giat_trai', phrases: ['giat trai', 'giật trái', 'topspin trai', 'backhand topspin'] },
    { key: 'giao_bong_con_lac_nguoc', phrases: ['giao bong con lac nguoc', 'giao bóng con lắc ngược', 'con lac nguoc', 'con lắc ngược', 'reverse pendulum'] },
    { key: 'giao_bong_thuan', phrases: ['giao bong thuan', 'giao bóng thuận', 'giao bong con lac', 'giao bóng con lắc', 'con lac', 'con lắc', 'pendulum'] },
    { key: 'giao_bong_trai', phrases: ['giao bong trai tay', 'giao bóng trái tay', 'giao bong trai', 'giao bóng trái', 'giao trai'] },
    { key: 'giao_bong_duc', phrases: ['giao bong duc', 'giao bóng đục', 'giao duc', 'giao đục'] },
    { key: 'giao_bong_tomahawk', phrases: ['giao bong tomahawk', 'giao bóng tomahawk', 'tomahawk', 'giao tomahawk'] },
    { key: 'doi_cong_phai', phrases: ['doi cong phai', 'đôi công phải', 'cong phai', 'công phải'] },
    { key: 'doi_cong_trai', phrases: ['doi cong trai', 'đôi công trái', 'cong trai', 'công trái'] },
    { key: 'flick_phai', phrases: ['flick phai', 'flick phải', 'hat phai', 'hất phải'] },
    { key: 'flick_trai', phrases: ['flick trai', 'flick trái', 'hat trai', 'hất trái'] },
    { key: 'bat_dap_bong', phrases: ['bat dap bong', 'bạt đập bóng', 'bat / dap', 'bạt / đập', 'dap bong', 'đập bóng', 'dap', 'đập', 'bat', 'bạt', 'smash'] },
    { key: 'doi_giat_xa_ban', phrases: ['doi giat xa ban', 'đối giật xa bàn', 'doi giat', 'đối giật'] },
    { key: 'phong_thu_phai', phrases: ['phong thu phai', 'phòng thủ phải', 'ke chan phai', 'kê chặn phải', 'chan phai', 'chặn phải', 'ke phai', 'kê phải'] },
    { key: 'phong_thu_trai', phrases: ['phong thu trai', 'phòng thủ trái', 'ke chan trai', 'kê chặn trái', 'chan trai', 'chặn trái', 'ke trai', 'kê trái'] },
    { key: 'go_day_bong', phrases: ['go day bong', 'gò đẩy bóng', 'go / cat / day', 'gò / cắt / đẩy', 'go bong', 'gò bóng', 'day bong', 'đẩy bóng', 'cat bong', 'cắt bóng', 'go day', 'gò đẩy', 'go', 'gò'] },
    { key: 'bat_ngan_tha_long', phrases: ['bat ngan tha long', 'bắt ngắn thả lỏng', 'bat ngan / tha long', 'bắt ngắn / thả lỏng', 'bat ngan', 'bắt ngắn', 'tha long', 'thả lỏng'] },
    { key: 'cau_bong_bong', phrases: ['cau bong bong', 'câu bóng bổng', 'cau bong', 'câu bóng'] },
    { key: 'loi_khac', phrases: ['loi khac', 'lỗi khác', 'giao hong', 'giao hỏng'] }
];

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchPhrase(textNorm, phraseNorm) {
    // If phrase is short (<= 3 chars or single word), enforce word boundaries
    if (phraseNorm.length <= 4 || !phraseNorm.includes(' ')) {
        const regex = new RegExp(`(^|[^a-z0-9])${escapeRegex(phraseNorm)}($|[^a-z0-9])`, 'i');
        return regex.test(textNorm);
    }
    return textNorm.includes(phraseNorm);
}

export function findTechniqueInText(rawText, dictionary = null) {
    const norm = removeAccents(rawText);

    // Build all candidate phrases sorted by length descending so specific/longer phrases match first
    const candidateList = [];
    for (const item of TECHNIQUE_SYNONYMS) {
        for (const phrase of item.phrases) {
            candidateList.push({
                key: item.key,
                phraseNorm: removeAccents(phrase)
            });
        }
    }
    if (dictionary?.ky_thuat) {
        for (const [key, label] of Object.entries(dictionary.ky_thuat)) {
            candidateList.push({
                key,
                phraseNorm: removeAccents(label)
            });
        }
    }

    candidateList.sort((a, b) => b.phraseNorm.length - a.phraseNorm.length);

    for (const item of candidateList) {
        if (matchPhrase(norm, item.phraseNorm)) {
            return item.key;
        }
    }
    return null;
}

export function parseNaturalLanguage(rawText = '', context = {}) {
    const text = rawText.trim();
    const norm = removeAccents(text);
    const querySpec = createEmptyQuerySpec();
    const understoodConditions = [];
    const ambiguities = [];
    const unsupportedParts = [];

    const matches = context.matches || [];
    const dictionary = context.dictionary || null;

    // 1. Check Opponent names in actual data
    const availableOpponents = Array.from(new Set(matches.map(m => m.thong_tin?.doi_thu_2).filter(Boolean)));
    for (const opp of availableOpponents) {
        const oppNorm = removeAccents(opp);
        if (norm.includes(oppNorm)) {
            querySpec.match.opponents.push(opp);
            understoodConditions.push(`Đối thủ: ${opp}`);
        }
    }

    // 2. Match Types
    if (norm.includes('thi dau giai') || norm.includes('tran giai') || norm.includes('danh giai') || norm.includes('giai dau') || norm.includes('cac tran giai')) {
        querySpec.match.matchTypes.push('Thi đấu giải');
        understoodConditions.push('Loại hình: Thi đấu giải');
    } else if (norm.includes('giao huu')) {
        querySpec.match.matchTypes.push('Giao hữu');
        understoodConditions.push('Loại hình: Giao hữu');
    } else if (norm.includes('danh bia') || norm.includes('tran bia')) {
        querySpec.match.matchTypes.push('Đánh bia');
        understoodConditions.push('Loại hình: Đánh bia');
    }

    // 3. Touch Count
    const touchMatch = norm.match(/(\d+)\s*cham/);
    if (touchMatch) {
        const n = parseInt(touchMatch[1], 10);
        querySpec.point.touchCount.eq = n;
        understoodConditions.push(`Số chạm: ${n} chạm`);
    } else if (norm.includes('ba cham')) {
        querySpec.point.touchCount.eq = 3;
        understoodConditions.push('Số chạm: 3 chạm');
    } else if (norm.includes('hai cham')) {
        querySpec.point.touchCount.eq = 2;
        understoodConditions.push('Số chạm: 2 chạm');
    } else if (norm.includes('bon cham')) {
        querySpec.point.touchCount.eq = 4;
        understoodConditions.push('Số chạm: 4 chạm');
    } else if (norm.includes('nam cham')) {
        querySpec.point.touchCount.eq = 5;
        understoodConditions.push('Số chạm: 5 chạm');
    }

    // 4. Server
    if (norm.includes('toi giao bong') || norm.includes('toi la nguoi giao') || norm.includes('khi toi giao') || norm.includes('giao bong cua toi') || norm.includes('toi giao')) {
        querySpec.point.server = 'SELF';
        understoodConditions.push('Người giao: Tôi');
    } else if (norm.includes('doi thu giao bong') || norm.includes('doi thu la nguoi giao') || norm.includes('khi doi thu giao') || norm.includes('doi thu giao')) {
        querySpec.point.server = 'OPPONENT';
        understoodConditions.push('Người giao: Đối thủ');
    }

    // 5. Result
    const anyResultPhrases = ['co the ghi diem hoac mat diem', 'bat ke thang thua', 'ca thang va thua', 'thang hoac thua', 'thang hay thua'];
    if (anyResultPhrases.some(p => norm.includes(p))) {
        querySpec.point.result = 'ANY';
        understoodConditions.push('Kết quả: Tất cả (thắng hoặc thua)');
    } else if (norm.includes('ghi diem') || norm.includes('toi thang') || norm.includes('thang pha') || norm.includes('thang diem') || norm.includes('thang')) {
        // Double check it's not "thuong thua"
        if (!norm.includes('thuong thua') && !norm.includes('mat diem')) {
            querySpec.point.result = 'SELF_WIN';
            understoodConditions.push('Kết quả: Tôi ghi điểm (Thắng)');
        }
    } else if (norm.includes('mat diem') || norm.includes('toi thua') || norm.includes('thua pha') || norm.includes('thua diem')) {
        querySpec.point.result = 'SELF_LOSE';
        understoodConditions.push('Kết quả: Tôi mất điểm (Thua)');
    }

    // 6. Semantic Rules
    // a. Direct serve win
    if (norm.includes('giao bong an diem truc tiep') || norm.includes('an diem truc tiep bang giao bong') || norm.includes('ace giao bong') || (norm.includes('giao bong an diem') && norm.includes('truc tiep'))) {
        querySpec.point.server = 'SELF';
        querySpec.point.result = 'SELF_WIN';
        querySpec.point.semanticTags.push('DIRECT_SERVE_WIN');
        understoodConditions.push('Pha bóng: Giao bóng ăn điểm trực tiếp');
    }

    // b. Opponent receive error on my serve
    if (norm.includes('do hong giao bong') || norm.includes('do giao bong hong') || norm.includes('bi do hong giao bong')) {
        querySpec.point.server = 'SELF';
        querySpec.point.result = 'SELF_WIN';
        querySpec.point.semanticTags.push('OPPONENT_RECEIVE_ERROR_ON_MY_SERVE');
        understoodConditions.push('Pha bóng: Đối thủ đỡ hỏng giao bóng của tôi');
    }

    // 7. Shot slots and techniques
    // Check finishing shot (N)
    if (norm.includes('ket thuc bang') || norm.includes('ket thuc voi') || norm.includes('cuoi bang')) {
        const afterFinish = norm.split(/ket thuc bang|ket thuc voi|cuoi bang/)[1] || '';
        const techKey = findTechniqueInText(afterFinish, dictionary);
        if (techKey) {
            let actor = 'ANY';
            if (norm.includes('toi ket thuc')) actor = 'SELF';
            else if (norm.includes('doi thu ket thuc')) actor = 'OPPONENT';

            querySpec.point.rallyConditions.push({
                slot: 'N',
                actor,
                techniqueKeys: [techKey],
                nature: [],
                horizontalLanding: [],
                length: [],
                spin: [],
                errorLocation: []
            });
            const techLabel = dictionary?.ky_thuat?.[techKey] || techKey;
            understoodConditions.push(`Cú kết thúc (N): ${techLabel}${actor === 'SELF' ? ' (Tôi)' : actor === 'OPPONENT' ? ' (Đối thủ)' : ''}`);
        }
    } else {
        // If query mentions technique without "kết thúc bằng", check if it's general or finishing
        const techKey = findTechniqueInText(norm, dictionary);
        if (techKey && !techKey.startsWith('giao_bong')) {
            // Check if already in conditions
            const alreadyIn = querySpec.point.rallyConditions.some(rc => rc.techniqueKeys.includes(techKey));
            if (!alreadyIn) {
                querySpec.point.rallyConditions.push({
                    slot: 'ANY',
                    actor: 'ANY',
                    techniqueKeys: [techKey],
                    nature: [],
                    horizontalLanding: [],
                    length: [],
                    spin: [],
                    errorLocation: []
                });
                const techLabel = dictionary?.ky_thuat?.[techKey] || techKey;
                understoodConditions.push(`Kỹ thuật pha bóng: ${techLabel}`);
            }
        }
    }

    // 8. Analysis Dimension and Aggregation
    if (norm.includes('kieu giao bong nao') || norm.includes('ky thuat giao bong nao') || norm.includes('loai giao bong nao')) {
        querySpec.analysisDimension = 'SERVE_TECHNIQUE';
        understoodConditions.push('Thống kê theo: Kỹ thuật giao bóng');
    }

    if (norm.includes('nhieu nhat') || norm.includes('nhieu lan nhat')) {
        querySpec.aggregation = 'MOST_LOSSES';
        understoodConditions.push('Sắp xếp: Tần suất nhiều nhất');
    }

    // 9. Ambiguity Detection (Clarification Gate)
    // A. TIME_AMBIGUITY: "gần đây", "dạo gần đây", "vừa qua"
    if (norm.includes('gan day') || norm.includes('dao gan day') || norm.includes('thoi gian vua qua') || norm.includes('vua roi')) {
        ambiguities.push({
            id: 'time_scope',
            type: 'TIME_AMBIGUITY',
            phrase: 'gần đây',
            title: 'Khoảng thời gian "gần đây"',
            prompt: 'Bạn muốn giới hạn phạm vi "gần đây" như thế nào?',
            options: [
                { id: 'last_5_matches', label: '5 trận gần nhất' },
                { id: 'last_10_matches', label: '10 trận gần nhất' },
                { id: 'last_30_days', label: '30 ngày gần nhất' },
                { id: 'last_3_months', label: '3 tháng gần nhất' },
                { id: 'all', label: 'Tất cả dữ liệu' }
            ],
            selected: 'last_10_matches'
        });
    }

    // B. DERIVED_CONCEPT_AMBIGUITY: "đối thủ tôi thường thua"
    if (norm.includes('doi thu toi thuong thua') || norm.includes('nhung doi thu toi thuong thua') || norm.includes('thuong thua')) {
        ambiguities.push({
            id: 'frequent_loss_opponents',
            type: 'DERIVED_CONCEPT_AMBIGUITY',
            phrase: 'đối thủ tôi thường thua',
            title: 'Khái niệm "đối thủ thường thua"',
            prompt: 'Bạn muốn xác định đối thủ "thường thua" theo tiêu chí nào?',
            options: [
                { id: 'losses_gt_wins', label: 'Số trận thua > số trận thắng' },
                { id: 'loss_rate_gt_50', label: 'Tỷ lệ ván thua > 50%' },
                { id: 'all_opponents', label: 'Tất cả đối thủ' }
            ],
            selected: 'losses_gt_wins'
        });
    }

    // C. DOMAIN_SEMANTIC_AMBIGUITY: "quả thứ ba tôi chủ động tấn công"
    if (norm.includes('qua thu ba toi chu dong tan cong') || norm.includes('qua thu 3 toi chu dong tan cong') || norm.includes('qua thu ba') || norm.includes('qua thu 3')) {
        ambiguities.push({
            id: 'third_ball_attack',
            type: 'DOMAIN_SEMANTIC_AMBIGUITY',
            phrase: 'quả thứ ba tôi chủ động tấn công',
            title: 'Khái niệm "quả thứ ba chủ động tấn công"',
            prompt: 'Bạn muốn định nghĩa cú đánh thứ ba như thế nào?',
            options: [
                { id: 'standard_third_ball', label: 'Standard Third-ball Attack (Tôi giao → Đối thủ đỡ → Tôi chủ động tấn công ở chạm 3)' },
                { id: 'any_touch_3', label: 'Chạm thứ 3 của pha bóng do tôi thực hiện (bất kể ai giao bóng)' },
                { id: 'ignore_third_ball', label: 'Bỏ qua điều kiện quả thứ 3' }
            ],
            selected: 'standard_third_ball'
        });
    }

    const status = ambiguities.length > 0 ? 'NEEDS_CLARIFICATION' : 'READY';

    return {
        status,
        originalText: text,
        querySpecDraft: querySpec,
        understoodConditions,
        ambiguities,
        unsupportedParts
    };
}

export function resolveAmbiguities(querySpecDraft, selectedChoices = {}, context = {}) {
    const finalSpec = JSON.parse(JSON.stringify(querySpecDraft));
    const matches = context.matches || [];

    // 1. Time scope
    const timeChoice = selectedChoices['time_scope'];
    if (timeChoice) {
        // Sort matches by date desc
        const sortedMatches = [...matches].sort((a, b) => {
            const da = a.thong_tin?.ngay_thi_dau || '';
            const db = b.thong_tin?.ngay_thi_dau || '';
            return db.localeCompare(da);
        });

        if (timeChoice === 'last_5_matches') {
            finalSpec.match.matchIds = sortedMatches.slice(0, 5).map(m => m.id_tran_dau);
        } else if (timeChoice === 'last_10_matches') {
            finalSpec.match.matchIds = sortedMatches.slice(0, 10).map(m => m.id_tran_dau);
        } else if (timeChoice === 'last_30_days') {
            if (sortedMatches.length > 0) {
                const latestDate = new Date(sortedMatches[0].thong_tin?.ngay_thi_dau || Date.now());
                const cutoff = new Date(latestDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                finalSpec.match.dateFrom = cutoff;
            }
        } else if (timeChoice === 'last_3_months') {
            if (sortedMatches.length > 0) {
                const latestDate = new Date(sortedMatches[0].thong_tin?.ngay_thi_dau || Date.now());
                const cutoff = new Date(latestDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                finalSpec.match.dateFrom = cutoff;
            }
        }
    }

    // 2. Opponents frequent loss
    const oppChoice = selectedChoices['frequent_loss_opponents'];
    if (oppChoice && oppChoice !== 'all_opponents') {
        const oppStats = {};
        matches.forEach(m => {
            const opp = m.thong_tin?.doi_thu_2;
            if (!opp) return;
            if (!oppStats[opp]) oppStats[opp] = { wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 };
            const kq = m.thong_tin?.ket_qua || '';
            const parts = kq.split('-').map(x => parseInt(x.trim(), 10));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                oppStats[opp].gamesWon += parts[0];
                oppStats[opp].gamesLost += parts[1];
                if (parts[0] > parts[1]) oppStats[opp].wins++;
                else if (parts[0] < parts[1]) oppStats[opp].losses++;
            }
        });

        const qualifiedOpponents = [];
        for (const [opp, s] of Object.entries(oppStats)) {
            if (oppChoice === 'losses_gt_wins' && s.losses > s.wins) {
                qualifiedOpponents.push(opp);
            } else if (oppChoice === 'loss_rate_gt_50' && (s.gamesLost > s.gamesWon || s.losses > s.wins)) {
                qualifiedOpponents.push(opp);
            }
        }

        if (qualifiedOpponents.length > 0) {
            finalSpec.match.opponents = qualifiedOpponents;
        }
    }

    // 3. Third-ball attack
    const thirdBallChoice = selectedChoices['third_ball_attack'];
    if (thirdBallChoice === 'standard_third_ball') {
        finalSpec.point.server = 'SELF';
        if (!finalSpec.point.semanticTags.includes('THIRD_BALL_ATTACK')) {
            finalSpec.point.semanticTags.push('THIRD_BALL_ATTACK');
        }
    } else if (thirdBallChoice === 'any_touch_3') {
        finalSpec.point.touchCount.min = 3;
        finalSpec.point.rallyConditions.push({
            slot: 'TOUCH_3',
            actor: 'SELF',
            techniqueKeys: [],
            nature: [],
            horizontalLanding: [],
            length: [],
            spin: [],
            errorLocation: []
        });
    }

    return finalSpec;
}
