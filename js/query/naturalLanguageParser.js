/**
 * naturalLanguageParser.js
 * Domain-specific Vietnamese Natural Language Parser for Table Tennis query pipeline.
 * Robust token-based & semantic parsing to QuerySpec with Clarification Gate.
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

const WORD_TO_NUM = {
    'mot': 1, 'hai': 2, 'ba': 3, 'bon': 4, 'tu': 4, 'nam': 5,
    'sau': 6, 'bay': 7, 'tam': 8, 'chin': 9, 'muoi': 10
};

function parseNumWordOrDigits(token) {
    if (!token) return null;
    token = token.trim().toLowerCase();
    if (/^\d+$/.test(token)) return parseInt(token, 10);
    if (WORD_TO_NUM[token] !== undefined) return WORD_TO_NUM[token];
    return null;
}

export function parseTouchCondition(normText) {
    // 1. Between: "tu 3 den 5 cham", "tu 3-5 cham", "3 den 5 cham", "3-5 cham", "khoang 3 den 5 cham"
    const betweenRegex = /(?:tu|khoang|trong\s+khoang)?\s*(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*(?:den|toi|-)\s*(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham/i;
    const betweenMatch = normText.match(betweenRegex);
    if (betweenMatch) {
        const min = parseNumWordOrDigits(betweenMatch[1]);
        const max = parseNumWordOrDigits(betweenMatch[2]);
        if (min !== null && max !== null) {
            return { min: Math.min(min, max), max: Math.max(min, max), text: `Từ ${min} đến ${max} chạm` };
        }
    }

    // 2. GTE: "tu 3 cham tro len", "3 cham tro len", "it nhat 3 cham", "toi thieu 3 cham", ">= 3 cham", "3+ cham"
    const gteRegex = /(?:tu\s+(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham\s*tro\s*len)|(?:(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham\s*tro\s*len)|(?:(?:it\s+nhat|toi\s+thieu|>=)\s*(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham)|(?:(\d+)\+\s*cham)/i;
    const gteMatch = normText.match(gteRegex);
    if (gteMatch) {
        const numToken = gteMatch[1] || gteMatch[2] || gteMatch[3] || gteMatch[4];
        const n = parseNumWordOrDigits(numToken);
        if (n !== null) {
            return { min: n, text: `Từ ${n} chạm trở lên (>= ${n})` };
        }
    }

    // 3. GT: "tren 3 cham", "nhieu hon 3 cham", "lon hon 3 cham", "> 3 cham"
    const gtRegex = /(?:tren|nhieu\s+hon|lon\s+hon|>)\s*(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham/i;
    const gtMatch = normText.match(gtRegex);
    if (gtMatch) {
        const n = parseNumWordOrDigits(gtMatch[1]);
        if (n !== null) {
            return { min: n + 1, text: `Trên ${n} chạm (> ${n})` };
        }
    }

    // 4. LTE: "tu 4 cham tro xuong", "4 cham tro xuong", "toi da 4 cham", "khong qua 4 cham", "<= 4 cham"
    const lteRegex = /(?:tu\s+(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham\s*tro\s*xuong)|(?:(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham\s*tro\s*xuong)|(?:(?:toi\s+da|khong\s+qua|<=)\s*(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham)/i;
    const lteMatch = normText.match(lteRegex);
    if (lteMatch) {
        const numToken = lteMatch[1] || lteMatch[2] || lteMatch[3];
        const n = parseNumWordOrDigits(numToken);
        if (n !== null) {
            return { max: n, text: `Tối đa ${n} chạm (<= ${n})` };
        }
    }

    // 5. LT: "duoi 4 cham", "it hon 4 cham", "nho hon 4 cham", "< 4 cham"
    const ltRegex = /(?:duoi|it\s+hon|nho\s+hon|<)\s*(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham/i;
    const ltMatch = normText.match(ltRegex);
    if (ltMatch) {
        const n = parseNumWordOrDigits(ltMatch[1]);
        if (n !== null) {
            return { max: n - 1, text: `Dưới ${n} chạm (< ${n})` };
        }
    }

    // 6. EQ: "3 cham", "dung 3 cham", "chinh xac 3 cham"
    const eqRegex = /(?:dung|chinh\s+xac)?\s*(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*cham/i;
    const eqMatch = normText.match(eqRegex);
    if (eqMatch) {
        const n = parseNumWordOrDigits(eqMatch[1]);
        if (n !== null) {
            return { eq: n, text: `${n} chạm` };
        }
    }

    return null;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchPhrase(textNorm, phraseNorm) {
    if (phraseNorm.length <= 4 || !phraseNorm.includes(' ')) {
        const regex = new RegExp(`(^|[^a-z0-9])${escapeRegex(phraseNorm)}($|[^a-z0-9])`, 'i');
        return regex.test(textNorm);
    }
    return textNorm.includes(phraseNorm);
}

const COMPOUND_TECHNIQUES = [
    {
        regex: /(?:giat|topspin)\s+(?:phai\s+(?:hoac|hay|\/|va)\s+trai|trai\s+(?:hoac|hay|\/|va)\s+phai)/i,
        keys: ['giat_phai', 'giat_trai'],
        label: 'Giật (phải hoặc trái)'
    },
    {
        regex: /(?:flick|hat)\s+(?:phai\s+(?:hoac|hay|\/|va)\s+trai|trai\s+(?:hoac|hay|\/|va)\s+phai)/i,
        keys: ['flick_phai', 'flick_trai'],
        label: 'Flick / Hất (phải hoặc trái)'
    },
    {
        regex: /(?:doi\s+cong|cong)\s+(?:phai\s+(?:hoac|hay|\/|va)\s+trai|trai\s+(?:hoac|hay|\/|va)\s+phai)/i,
        keys: ['doi_cong_phai', 'doi_cong_trai'],
        label: 'Đôi công (phải hoặc trái)'
    },
    {
        regex: /(?:phong\s+thu|ke\s+chan|chan|ke)\s+(?:phai\s+(?:hoac|hay|\/|va)\s+trai|trai\s+(?:hoac|hay|\/|va)\s+phai)/i,
        keys: ['phong_thu_phai', 'phong_thu_trai'],
        label: 'Phòng thủ / Kê chặn (phải hoặc trái)'
    }
];

const TECHNIQUE_SYNONYMS = [
    // Serves
    { key: 'giao_bong_con_lac_nguoc', isServe: true, phrases: ['giao bong con lac nguoc', 'con lac nguoc', 'reverse pendulum', 'giao con lac nguoc'] },
    { key: 'giao_bong_thuan', isServe: true, phrases: ['giao bong thuan', 'giao thuan', 'giao bong con lac', 'con lac', 'pendulum'] },
    { key: 'giao_bong_trai', isServe: true, phrases: ['giao bong trai tay', 'giao bong trai', 'giao trai tay', 'giao trai'] },
    { key: 'giao_bong_duc', isServe: true, phrases: ['giao bong duc', 'giao duc'] },
    { key: 'giao_bong_tomahawk', isServe: true, phrases: ['giao bong tomahawk', 'giao tomahawk', 'tomahawk', 'giao bong xeng', 'giao xeng'] },

    // Specific rally
    { key: 'doi_giat_xa_ban', isServe: false, phrases: ['doi giat xa ban', 'doi giat'] },
    { key: 'giat_phai', isServe: false, phrases: ['giat phai', 'topspin phai', 'forehand topspin', 'giat forehand'] },
    { key: 'giat_trai', isServe: false, phrases: ['giat trai', 'topspin trai', 'backhand topspin', 'giat backhand'] },
    { key: 'doi_cong_phai', isServe: false, phrases: ['doi cong phai', 'cong phai'] },
    { key: 'doi_cong_trai', isServe: false, phrases: ['doi cong trai', 'cong trai'] },
    { key: 'flick_phai', isServe: false, phrases: ['flick phai', 'hat phai'] },
    { key: 'flick_trai', isServe: false, phrases: ['flick trai', 'hat trai'] },
    { key: 'phong_thu_phai', isServe: false, phrases: ['phong thu phai', 'ke chan phai', 'chan phai', 'ke phai', 'block phai'] },
    { key: 'phong_thu_trai', isServe: false, phrases: ['phong thu trai', 'ke chan trai', 'chan trai', 'ke trai', 'block trai'] },
    { key: 'bat_dap_bong', isServe: false, phrases: ['bat dap bong', 'bat / dap', 'dap bong', 'bat bong', 'dap', 'bat', 'smash'] },
    { key: 'go_day_bong', isServe: false, phrases: ['go day bong', 'go / cat / day', 'go bong', 'day bong', 'cat bong', 'go day', 'go', 'day', 'cat'] },
    { key: 'bat_ngan_tha_long', isServe: false, phrases: ['bat ngan tha long', 'bat ngan / tha long', 'bat ngan', 'tha long'] },
    { key: 'cau_bong_bong', isServe: false, phrases: ['cau bong bong', 'cau bong', 'lob'] },
    { key: 'loi_khac', isServe: false, phrases: ['loi khac', 'giao hong'] },

    // Generic families (when neither right nor left was specified)
    { keys: ['giat_phai', 'giat_trai'], isServe: false, family: 'giat', phrases: ['giat bong', 'qua giat', 'cu giat', 'pha giat', 'don giat', 'giat', 'topspin'] },
    { keys: ['flick_phai', 'flick_trai'], isServe: false, family: 'flick', phrases: ['flick bong', 'qua flick', 'cu flick', 'flick', 'hat bong', 'qua hat', 'cu hat', 'hat'] },
    { keys: ['doi_cong_phai', 'doi_cong_trai'], isServe: false, family: 'doi_cong', phrases: ['doi cong bong', 'doi cong'] },
    { keys: ['phong_thu_phai', 'phong_thu_trai'], isServe: false, family: 'phong_thu', phrases: ['phong thu bong', 'phong thu', 'ke chan', 'chan bong', 'ke bong', 'block'] }
];

function sanitizeForTechniqueMatching(textNorm) {
    // Mask temporal adverbs like "gan day", "dao gan day", "sau day", "tu day", "den day"
    return textNorm
        .replace(/\b(dao\s+gan\s+day|thoi\s+gian\s+gan\s+day|thoi\s+gian\s+vua\s+qua|gan\s+day|sau\s+day|tu\s+day|den\s+day)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function findTechniqueInText(rawText, dictionary = null) {
    const norm = sanitizeForTechniqueMatching(removeAccents(rawText));

    for (const comp of COMPOUND_TECHNIQUES) {
        if (comp.regex.test(norm)) {
            return comp.keys[0];
        }
    }

    const candidateList = [];
    for (const item of TECHNIQUE_SYNONYMS) {
        for (const phrase of item.phrases) {
            candidateList.push({
                key: item.keys ? item.keys[0] : item.key,
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

function extractTechniquesFromSegment(segmentNorm) {
    const cleanSegment = sanitizeForTechniqueMatching(segmentNorm);

    for (const comp of COMPOUND_TECHNIQUES) {
        if (comp.regex.test(cleanSegment)) {
            return { keys: comp.keys, label: comp.label, isServe: false };
        }
    }
    const candidates = [];
    for (const item of TECHNIQUE_SYNONYMS) {
        for (const p of item.phrases) {
            candidates.push({
                keys: item.keys || [item.key],
                isServe: item.isServe,
                label: item.family || item.key,
                phraseNorm: removeAccents(p)
            });
        }
    }
    candidates.sort((a, b) => b.phraseNorm.length - a.phraseNorm.length);

    for (const cand of candidates) {
        if (matchPhrase(cleanSegment, cand.phraseNorm)) {
            return { keys: cand.keys, isServe: cand.isServe, label: cand.label };
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

    // 1. Opponent names in actual data
    const availableOpponents = Array.from(new Set(matches.map(m => m.thong_tin?.doi_thu_2).filter(Boolean)));
    for (const opp of availableOpponents) {
        const oppNorm = removeAccents(opp);
        if (matchPhrase(norm, oppNorm)) {
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
    const touch = parseTouchCondition(norm);
    if (touch) {
        if (touch.eq !== undefined) querySpec.point.touchCount.eq = touch.eq;
        if (touch.min !== undefined) querySpec.point.touchCount.min = touch.min;
        if (touch.max !== undefined) querySpec.point.touchCount.max = touch.max;
        understoodConditions.push(`Số chạm: ${touch.text}`);
    }

    // 4. Server
    if (norm.includes('toi giao bong') || norm.includes('toi la nguoi giao') || norm.includes('khi toi giao') || norm.includes('giao bong cua toi') || norm.includes('qua giao bong cua toi') || norm.includes('toi phat bong') || norm.includes('toi giao')) {
        querySpec.point.server = 'SELF';
        understoodConditions.push('Người giao: Tôi');
    } else if (norm.includes('doi thu giao bong') || norm.includes('doi thu la nguoi giao') || norm.includes('khi doi thu giao') || norm.includes('doi phuong giao') || norm.includes('doi thu giao') || norm.includes('giao bong cua doi thu')) {
        querySpec.point.server = 'OPPONENT';
        understoodConditions.push('Người giao: Đối thủ');
    }

    // 5. Result
    const anyResultPhrases = ['co the ghi diem hoac mat diem', 'bat ke thang thua', 'ca thang va thua', 'thang hoac thua', 'thang hay thua', 'thang/thua'];
    if (anyResultPhrases.some(p => norm.includes(p))) {
        querySpec.point.result = 'ANY';
        understoodConditions.push('Kết quả: Tất cả (thắng hoặc thua)');
    } else if (norm.includes('khong mat diem') || norm.includes('khong thua')) {
        querySpec.point.result = 'SELF_WIN';
        understoodConditions.push('Kết quả: Tôi ghi điểm (Thắng)');
    } else if (norm.includes('khong ghi diem') || norm.includes('khong an diem') || norm.includes('khong thang')) {
        querySpec.point.result = 'SELF_LOSE';
        understoodConditions.push('Kết quả: Tôi mất điểm (Thua)');
    } else if (norm.includes('ghi diem') || norm.includes('toi thang') || norm.includes('minh thang') || norm.includes('thang pha') || norm.includes('thang diem') || norm.includes('an diem') || norm.includes('thang')) {
        if (!norm.includes('thuong thua') && !norm.includes('mat diem') && !norm.includes('thua diem')) {
            querySpec.point.result = 'SELF_WIN';
            understoodConditions.push('Kết quả: Tôi ghi điểm (Thắng)');
        }
    } else if (norm.includes('mat diem') || norm.includes('toi thua') || norm.includes('minh thua') || norm.includes('thua pha') || norm.includes('thua diem') || norm.includes('bi mat diem') || norm.includes('thua')) {
        querySpec.point.result = 'SELF_LOSE';
        understoodConditions.push('Kết quả: Tôi mất điểm (Thua)');
    }

    // 6. Semantic Rules
    if (norm.includes('giao bong an diem truc tiep') || norm.includes('an diem truc tiep bang giao bong') || norm.includes('ace giao bong') || norm.includes('giao bong ace') || (norm.includes('giao bong an diem') && norm.includes('truc tiep'))) {
        querySpec.point.server = 'SELF';
        querySpec.point.result = 'SELF_WIN';
        querySpec.point.semanticTags.push('DIRECT_SERVE_WIN');
        understoodConditions.push('Pha bóng: Giao bóng ăn điểm trực tiếp');
    }

    if (norm.includes('do hong giao bong') || norm.includes('do giao bong hong') || norm.includes('bi do hong giao bong') || norm.includes('doi thu do hong giao bong')) {
        querySpec.point.server = 'SELF';
        querySpec.point.result = 'SELF_WIN';
        querySpec.point.semanticTags.push('OPPONENT_RECEIVE_ERROR_ON_MY_SERVE');
        understoodConditions.push('Pha bóng: Đối thủ đỡ hỏng giao bóng của tôi');
    }

    // 7. Serve technique and properties
    const serveTech = extractTechniquesFromSegment(norm);
    if (serveTech && serveTech.isServe) {
        querySpec.point.serve.techniqueKeys = serveTech.keys;
        const labels = serveTech.keys.map(k => dictionary?.ky_thuat?.[k] || k).join(' hoặc ');
        understoodConditions.push(`Kỹ thuật giao bóng: ${labels}`);
    }

    if (norm.includes('giao bong ngan') || norm.includes('giao ngan')) {
        querySpec.point.serve.length.push('ngan');
        understoodConditions.push('Độ dài giao bóng: Ngắn');
    } else if (norm.includes('giao bong dai') || norm.includes('giao dai')) {
        querySpec.point.serve.length.push('dai');
        understoodConditions.push('Độ dài giao bóng: Dài');
    }
    if (norm.includes('giao xoay xuong') || norm.includes('giao nang')) {
        querySpec.point.serve.spin.push('xuong');
        understoodConditions.push('Độ xoáy giao bóng: Xoáy xuống');
    }

    // 8. Finishing & Rally conditions
    const finishMatch = norm.match(/(?:ket\s+thuc|cuoi\s+cung|pha\s+cuoi|cu\s+cuoi|cu\s+ket\s+thuc|qua\s+ket\s+thuc)\s+(?:bang|voi|la|qua|cu)?\s*([^,.;]+)/i);
    let finishingHandled = false;

    if (finishMatch) {
        const finishSegment = finishMatch[1] || '';
        const techMatch = extractTechniquesFromSegment(finishSegment);

        let actor = 'ANY';
        if (norm.includes('toi ket thuc') || norm.includes('toi danh ket thuc')) {
            actor = 'SELF';
        } else if (norm.includes('doi thu ket thuc') || norm.includes('doi phuong ket thuc')) {
            actor = 'OPPONENT';
        } else if (/trong\s+do\s+toi\s+giao\s+bong\s+va\s+ket\s+thuc/i.test(norm) || /toi\s+giao\s+bong\s+va\s+ket\s+thuc/i.test(norm)) {
            actor = 'SELF';
        }

        const rallyCond = {
            slot: 'N',
            actor,
            techniqueKeys: techMatch ? techMatch.keys : [],
            excludeTechniqueKeys: [],
            nature: [],
            excludeNature: [],
            horizontalLanding: [],
            length: [],
            spin: [],
            errorLocation: [],
            excludeErrorLocation: []
        };

        if (finishSegment.includes('winner') || finishSegment.includes('truc tiep')) rallyCond.nature.push('winner');
        if (finishSegment.includes('tu danh hong') || finishSegment.includes('tu hong')) rallyCond.nature.push('unforced_error');
        if (finishSegment.includes('bi ep hong')) rallyCond.nature.push('forced_error');

        if (finishSegment.includes('khong ruc luoi')) rallyCond.excludeErrorLocation.push('ruc_luoi');
        else if (finishSegment.includes('ruc luoi')) rallyCond.errorLocation.push('ruc_luoi');

        if (finishSegment.includes('khong ra ngoai')) {
            rallyCond.excludeErrorLocation.push('ra_ngoai_dai', 'ra_ngoai_bien');
        } else if (finishSegment.includes('ra ngoai bien')) {
            rallyCond.errorLocation.push('ra_ngoai_bien');
        } else if (finishSegment.includes('ra ngoai')) {
            rallyCond.errorLocation.push('ra_ngoai_dai');
        }

        if (techMatch || rallyCond.nature.length > 0 || rallyCond.errorLocation.length > 0 || rallyCond.excludeErrorLocation.length > 0) {
            querySpec.point.rallyConditions.push(rallyCond);
            const techLabel = techMatch ? (techMatch.keys.map(k => dictionary?.ky_thuat?.[k] || k).join(' / ')) : 'Bất kỳ';
            understoodConditions.push(`Cú kết thúc (N): ${techLabel}${actor === 'SELF' ? ' (Tôi)' : actor === 'OPPONENT' ? ' (Đối thủ)' : ''}`);
            finishingHandled = true;
        }
    }

    if (!finishingHandled) {
        let rallyText = norm;
        if (serveTech && serveTech.isServe) {
            rallyText = rallyText.replace(/giao\s+bong\s+[a-z\s]+/i, ' ');
        }
        const generalTech = extractTechniquesFromSegment(rallyText);
        if (generalTech && !generalTech.isServe) {
            let actor = 'ANY';
            if (norm.includes('toi ') || norm.includes('minh ')) actor = 'SELF';
            else if (norm.includes('doi thu ') || norm.includes('doi phuong ')) actor = 'OPPONENT';

            querySpec.point.rallyConditions.push({
                slot: 'ANY',
                actor,
                techniqueKeys: generalTech.keys,
                excludeTechniqueKeys: [],
                nature: [],
                excludeNature: [],
                horizontalLanding: [],
                length: [],
                spin: [],
                errorLocation: [],
                excludeErrorLocation: []
            });
            const techLabel = generalTech.keys.map(k => dictionary?.ky_thuat?.[k] || k).join(' / ');
            understoodConditions.push(`Kỹ thuật pha bóng: ${techLabel}${actor === 'SELF' ? ' (Tôi)' : ''}`);
        }
    }

    // 9. Analysis Dimension and Aggregation
    if (norm.includes('kieu giao bong nao') || norm.includes('ky thuat giao bong nao') || norm.includes('loai giao bong nao')) {
        querySpec.analysisDimension = 'SERVE_TECHNIQUE';
        understoodConditions.push('Thống kê theo: Kỹ thuật giao bóng');
    }

    if (norm.includes('nhieu nhat') || norm.includes('nhieu lan nhat')) {
        querySpec.aggregation = 'MOST_LOSSES';
        understoodConditions.push('Sắp xếp: Tần suất nhiều nhất');
    }

    // 10. Ambiguity Detection (Clarification Gate)
    // A. TIME_AMBIGUITY: "gần đây", "dạo gần đây", "thời gian gần đây", "vừa qua"
    if (norm.includes('gan day') || norm.includes('dao gan day') || norm.includes('thoi gian gan day') || norm.includes('thoi gian vua qua') || norm.includes('vua roi') || norm.includes('vua qua')) {
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
        if (!finalSpec.point.touchCount.min || finalSpec.point.touchCount.min < 3) {
            finalSpec.point.touchCount.min = 3;
        }
    } else if (thirdBallChoice === 'any_touch_3') {
        if (!finalSpec.point.touchCount.min || finalSpec.point.touchCount.min < 3) {
            finalSpec.point.touchCount.min = 3;
        }
        finalSpec.point.rallyConditions.push({
            slot: 'TOUCH_3',
            actor: 'SELF',
            techniqueKeys: [
                'giat_phai', 'giat_trai', 'flick_phai', 'flick_trai',
                'doi_cong_phai', 'doi_cong_trai', 'bat_dap_bong', 'doi_giat_xa_ban'
            ],
            excludeTechniqueKeys: [],
            nature: [],
            excludeNature: [],
            horizontalLanding: [],
            length: [],
            spin: [],
            errorLocation: [],
            excludeErrorLocation: []
        });
    }

    return finalSpec;
}
