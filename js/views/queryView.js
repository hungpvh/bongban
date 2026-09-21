/**
 * queryView.js
 * "Vấn tin pha bóng" View
 * Natural language query screen with Clarification Gate, Faceted Filters,
 * Statistics, and Match Drill-down.
 */

import { state } from '../store.js';
import { buildQueryIndex, getTechniqueLabel, getNatureLabel, getPropertyLabel, getErrorLocationLabel } from '../query/queryNormalizer.js';
import { parseNaturalLanguage, resolveAmbiguities } from '../query/naturalLanguageParser.js';
import { executeQuery, applyFacetedFilters } from '../query/queryEngine.js';
import { calculateQueryStatistics, groupResultsByMatch } from '../query/queryStatistics.js';

let queryIndex = null;
let searchQuery = '';
let parsedResult = null;
let clarificationChoices = {};
let finalQuerySpec = null;
let rawResults = [];
let filteredResults = [];
let hasSearched = false;
let expandedPointId = null;

let facetFilters = {
    matchId: 'ALL',
    opponent: 'ALL',
    matchType: 'ALL',
    gameNo: 'ALL',
    result: 'ALL',
    touchCount: 'ALL',
    serveTechnique: 'ALL',
    rallyTechnique: 'ALL',
    finishingNature: 'ALL',
    errorLocation: 'ALL'
};

function resetFacetFilters() {
    facetFilters = {
        matchId: 'ALL',
        opponent: 'ALL',
        matchType: 'ALL',
        gameNo: 'ALL',
        result: 'ALL',
        touchCount: 'ALL',
        serveTechnique: 'ALL',
        rallyTechnique: 'ALL',
        finishingNature: 'ALL',
        errorLocation: 'ALL'
    };
}

function ensureIndex() {
    if (!queryIndex) {
        queryIndex = buildQueryIndex(state.matches || [], state.dictionary || null);
    }
    return queryIndex;
}

window.app = window.app || {};
window.app.actions = window.app.actions || {};
window.app.actions.query = {
    setQueryText: (text) => {
        searchQuery = text;
    },
    quickSearch: (text) => {
        searchQuery = text;
        window.app.actions.query.submitSearch();
    },
    clearSearch: () => {
        searchQuery = '';
        parsedResult = null;
        clarificationChoices = {};
        finalQuerySpec = null;
        rawResults = [];
        filteredResults = [];
        hasSearched = false;
        resetFacetFilters();
        window.app.render();
    },
    submitSearch: () => {
        if (!searchQuery.trim()) return;

        const index = ensureIndex();
        resetFacetFilters();
        expandedPointId = null;

        const parsed = parseNaturalLanguage(searchQuery, {
            matches: state.matches || [],
            dictionary: state.dictionary || null
        });

        parsedResult = parsed;
        clarificationChoices = {};

        if (parsed.status === 'NEEDS_CLARIFICATION') {
            // Set initial defaults for choices
            parsed.ambiguities.forEach(amb => {
                clarificationChoices[amb.id] = amb.selected;
            });
            finalQuerySpec = null;
            rawResults = [];
            filteredResults = [];
            hasSearched = true;
        } else {
            // Ready to execute immediately
            finalQuerySpec = parsed.querySpecDraft;
            rawResults = executeQuery(index, finalQuerySpec);
            filteredResults = applyFacetedFilters(rawResults, facetFilters);
            hasSearched = true;
        }

        window.app.render();
    },
    setClarificationChoice: (ambiguityId, optionId) => {
        clarificationChoices[ambiguityId] = optionId;
        window.app.render();
    },
    applyClarificationAndSearch: () => {
        if (!parsedResult) return;

        const index = ensureIndex();
        finalQuerySpec = resolveAmbiguities(
            parsedResult.querySpecDraft,
            clarificationChoices,
            { matches: state.matches || [], dictionary: state.dictionary || null }
        );

        parsedResult.status = 'READY';
        rawResults = executeQuery(index, finalQuerySpec);
        resetFacetFilters();
        filteredResults = applyFacetedFilters(rawResults, facetFilters);
        hasSearched = true;
        window.app.render();
    },
    updateFacetFilter: (field, value) => {
        facetFilters[field] = value;
        filteredResults = applyFacetedFilters(rawResults, facetFilters);
        window.app.render();
    },
    resetFacets: () => {
        resetFacetFilters();
        filteredResults = applyFacetedFilters(rawResults, facetFilters);
        window.app.render();
    },
    focusMatch: (matchId) => {
        facetFilters.matchId = matchId;
        filteredResults = applyFacetedFilters(rawResults, facetFilters);
        window.app.render();
    },
    togglePointAccordion: (pointId) => {
        expandedPointId = expandedPointId === pointId ? null : pointId;
        window.app.render();
    }
};

export function renderQueryView() {
    ensureIndex();

    const dict = state.dictionary || {};
    const matches = state.matches || [];

    // Quick query examples
    const examples = [
        "Tìm kiếm các pha bóng 3 chạm trong đó tôi giao bóng và kết thúc bằng quả giật phải, có thể ghi điểm hoặc mất điểm.",
        "Tìm kiếm các pha bóng 3 chạm trong đó tôi giao bóng và kết thúc ghi điểm.",
        "Tìm kiếm các pha giao bóng ăn điểm trực tiếp của tôi.",
        "Tìm kiếm trong các trận đấu với đối thủ Vũ Kim Ngọc mà tôi bị đỡ hỏng giao bóng.",
        "Trong các trận giải gần đây với những đối thủ tôi thường thua, xem kiểu giao bóng nào dẫn đến quả thứ ba tôi chủ động tấn công nhưng vẫn mất điểm nhiều nhất."
    ];

    // Compute stats
    const stats = calculateQueryStatistics(filteredResults, dict);
    const groupedMatches = groupResultsByMatch(filteredResults);

    // Available values for facets based on rawResults
    const availableMatchIds = Array.from(new Set(rawResults.map(p => p.matchId)));
    const availableOpponents = Array.from(new Set(rawResults.map(p => p.opponentName)));
    const availableMatchTypes = Array.from(new Set(rawResults.map(p => p.matchType).filter(Boolean)));
    const availableGames = Array.from(new Set(rawResults.map(p => String(p.gameNo)))).sort((a, b) => Number(a) - Number(b));
    const availableServeTechs = Array.from(new Set(rawResults.map(p => p.serve?.ky_thuat).filter(Boolean)));
    const availableRallyTechs = Array.from(new Set(rawResults.flatMap(p => [p.N_2?.ky_thuat, p.N_1?.ky_thuat, p.N?.ky_thuat]).filter(Boolean)));
    const availableNatures = Array.from(new Set(rawResults.map(p => p.N?.tinh_chat).filter(Boolean)));
    const availableErrorLocations = Array.from(new Set(rawResults.flatMap(p => [p.N_2?.dac_tinh?.vi_tri_hong, p.N_1?.dac_tinh?.vi_tri_hong, p.N?.dac_tinh?.vi_tri_hong]).filter(Boolean)));

    return `
    <div id="query-container" class="space-y-6">
        <!-- Screen Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b">
            <div>
                <h2 class="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <i data-lucide="sparkles" class="w-6 h-6 text-primary"></i> Vấn tin pha bóng
                </h2>
                <p class="text-sm text-slate-500 font-medium">Tìm kiếm và phân tích các tình huống trận đấu bằng ngôn ngữ tự nhiên</p>
            </div>
            <button onclick="window.app.navigate('matchList')" class="self-start md:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg flex items-center gap-1.5 transition">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Danh sách trận đấu
            </button>
        </div>

        <!-- Search Box -->
        <div class="bg-white p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row gap-2.5">
                <div class="relative flex-1">
                    <i data-lucide="search" class="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400"></i>
                    <input 
                        id="query-input"
                        type="text" 
                        value="${escapeHtml(searchQuery)}" 
                        oninput="window.app.actions.query.setQueryText(this.value)"
                        onkeydown="if(event.key==='Enter') window.app.actions.query.submitSearch()"
                        placeholder="Nhập câu hỏi, ví dụ: Pha 3 chạm tôi giao bóng kết thúc bằng giật phải..."
                        class="w-full pl-11 pr-10 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-slate-800 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                    ${searchQuery ? `
                        <button onclick="window.app.actions.query.clearSearch()" class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
                <button 
                    onclick="window.app.actions.query.submitSearch()" 
                    class="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition shrink-0"
                >
                    <i data-lucide="search" class="w-5 h-5"></i> Tìm kiếm
                </button>
            </div>

            <!-- Quick Example Chips -->
            <div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Gợi ý câu hỏi mẫu:</span>
                <div class="flex flex-wrap gap-2">
                    ${examples.map((ex, idx) => `
                        <button 
                            onclick="window.app.actions.query.quickSearch('${escapeHtml(ex)}')" 
                            class="text-xs text-left bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
                        >
                            ${idx + 1}. ${ex.length > 55 ? ex.substring(0, 55) + '...' : ex}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Understood Conditions & Tags -->
            ${parsedResult ? `
                <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    ${parsedResult.understoodConditions.length > 0 ? `
                        <div class="flex flex-wrap items-center gap-1.5">
                            <span class="text-xs font-bold text-slate-500 mr-1">Hệ thống hiểu câu hỏi:</span>
                            ${parsedResult.understoodConditions.map(cond => `
                                <span class="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-md text-xs font-bold flex items-center gap-1">
                                    <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> ${escapeHtml(cond)}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${parsedResult.unsupportedParts?.length > 0 ? `
                        <div class="flex items-center gap-2 text-xs text-amber-700 font-medium">
                            <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600"></i>
                            <span>Chưa hiểu điều kiện: <strong>${escapeHtml(parsedResult.unsupportedParts.join(', '))}</strong></span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>

        <!-- Clarification Gate Card (When status === 'NEEDS_CLARIFICATION') -->
        ${parsedResult && parsedResult.status === 'NEEDS_CLARIFICATION' ? `
            <div class="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div class="flex items-start gap-3">
                    <div class="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                        <i data-lucide="help-circle" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-amber-900">Cần làm rõ trước khi tìm kiếm</h3>
                        <p class="text-sm text-amber-800 font-medium">Hệ thống đã nhận diện được ý định của bạn, nhưng cần làm rõ thêm một số tiêu chí để kết quả chính xác nhất:</p>
                    </div>
                </div>

                <div class="space-y-4 bg-white/90 p-4 rounded-xl border border-amber-200/70">
                    ${parsedResult.ambiguities.map(amb => `
                        <div class="space-y-2 pb-3 border-b border-amber-100 last:border-b-0 last:pb-0">
                            <label class="block text-sm font-bold text-slate-800">
                                ${escapeHtml(amb.title)} <span class="font-normal text-slate-500">("${escapeHtml(amb.phrase)}")</span>
                            </label>
                            <p class="text-xs text-slate-600 font-medium">${escapeHtml(amb.prompt)}</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                ${amb.options.map(opt => `
                                    <label class="flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${clarificationChoices[amb.id] === opt.id ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}">
                                        <input 
                                            type="radio" 
                                            name="amb_${amb.id}" 
                                            value="${opt.id}" 
                                            ${clarificationChoices[amb.id] === opt.id ? 'checked' : ''}
                                            onchange="window.app.actions.query.setClarificationChoice('${amb.id}', '${opt.id}')"
                                            class="w-4 h-4 text-primary focus:ring-primary"
                                        />
                                        <span>${escapeHtml(opt.label)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <span class="text-xs text-amber-800 font-medium">Chọn tiêu chí phù hợp và bấm nút bên phải để bắt đầu quét dữ liệu</span>
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button 
                            onclick="window.app.actions.query.clearSearch()" 
                            class="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onclick="window.app.actions.query.applyClarificationAndSearch()" 
                            class="flex-1 sm:flex-none px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm shadow transition flex items-center justify-center gap-2"
                        >
                            <i data-lucide="check" class="w-4 h-4"></i> Áp dụng & Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>
        ` : ''}

        <!-- Search Results Section -->
        ${hasSearched && parsedResult?.status === 'READY' ? `
            ${rawResults.length === 0 ? `
                <div class="bg-white p-8 rounded-2xl border text-center space-y-3">
                    <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <i data-lucide="search-x" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-800">Không tìm thấy pha bóng phù hợp</h3>
                    <p class="text-sm text-slate-500 max-w-md mx-auto">Không có pha bóng nào trong dữ liệu đáp ứng đầy đủ tất cả các điều kiện đã chọn. Bạn có thể thử nới lỏng câu hỏi hoặc xóa bớt bộ lọc.</p>
                </div>
            ` : `
                <!-- Summary Metrics Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Số pha bóng</span>
                        <div class="text-2xl font-black text-slate-800">${stats.totalPoints}</div>
                    </div>
                    <div class="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 shadow-sm">
                        <span class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Ghi điểm (Thắng)</span>
                        <div class="text-2xl font-black text-emerald-800">${stats.win}</div>
                    </div>
                    <div class="bg-rose-50/70 p-4 rounded-xl border border-rose-200/80 shadow-sm">
                        <span class="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-1">Mất điểm (Thua)</span>
                        <div class="text-2xl font-black text-rose-800">${stats.lose}</div>
                    </div>
                    <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tỷ lệ Thắng</span>
                        <div class="text-2xl font-black text-emerald-600">${stats.winRate}%</div>
                    </div>
                    <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tỷ lệ Thua</span>
                        <div class="text-2xl font-black text-rose-600">${stats.loseRate}%</div>
                    </div>
                    <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Số trận / Đối thủ</span>
                        <div class="text-2xl font-black text-slate-800">${stats.matchCount} / ${stats.opponentCount}</div>
                    </div>
                </div>

                <!-- Faceted Filters Bar -->
                <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <i data-lucide="sliders-horizontal" class="w-4 h-4 text-primary"></i> Bộ lọc nhanh (Faceted Filters)
                        </span>
                        <button onclick="window.app.actions.query.resetFacets()" class="text-xs font-bold text-primary hover:text-primary-hover transition flex items-center gap-1">
                            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Đặt lại
                        </button>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                        <!-- Trận đấu -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Trận đấu</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('matchId', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700 truncate">
                                <option value="ALL">Tất cả trận (${availableMatchIds.length})</option>
                                ${availableMatchIds.map(mid => {
                                    const m = matches.find(x => x.id_tran_dau === mid);
                                    const label = m ? `${formatDate(m.thong_tin.ngay_thi_dau)} · ${m.thong_tin.doi_thu_2} · ${m.thong_tin.ket_qua}` : mid;
                                    return `<option value="${mid}" ${facetFilters.matchId === mid ? 'selected' : ''}>${escapeHtml(label)}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <!-- Đối thủ -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Đối thủ</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('opponent', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700">
                                <option value="ALL">Tất cả đối thủ (${availableOpponents.length})</option>
                                ${availableOpponents.map(opp => `
                                    <option value="${escapeHtml(opp)}" ${facetFilters.opponent === opp ? 'selected' : ''}>${escapeHtml(opp)}</option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Loại hình -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Loại hình</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('matchType', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700">
                                <option value="ALL">Tất cả loại hình</option>
                                ${availableMatchTypes.map(mt => `
                                    <option value="${escapeHtml(mt)}" ${facetFilters.matchType === mt ? 'selected' : ''}>${escapeHtml(mt)}</option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Kết quả -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Kết quả</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('result', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700">
                                <option value="ALL" ${facetFilters.result === 'ALL' ? 'selected' : ''}>Tất cả kết quả</option>
                                <option value="WIN" ${facetFilters.result === 'WIN' ? 'selected' : ''}>Thắng (Ghi điểm)</option>
                                <option value="LOSE" ${facetFilters.result === 'LOSE' ? 'selected' : ''}>Thua (Mất điểm)</option>
                            </select>
                        </div>

                        <!-- Số chạm -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Số chạm</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('touchCount', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700">
                                <option value="ALL">Tất cả số chạm</option>
                                <option value="1" ${facetFilters.touchCount === '1' ? 'selected' : ''}>1 chạm</option>
                                <option value="2" ${facetFilters.touchCount === '2' ? 'selected' : ''}>2 chạm</option>
                                <option value="3" ${facetFilters.touchCount === '3' ? 'selected' : ''}>3 chạm</option>
                                <option value="4" ${facetFilters.touchCount === '4' ? 'selected' : ''}>4 chạm</option>
                                <option value="5+" ${facetFilters.touchCount === '5+' ? 'selected' : ''}>5+ chạm</option>
                            </select>
                        </div>

                        <!-- Kỹ thuật giao bóng -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">KT Giao bóng</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('serveTechnique', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700 truncate">
                                <option value="ALL">Tất cả KT giao bóng</option>
                                ${availableServeTechs.map(st => `
                                    <option value="${st}" ${facetFilters.serveTechnique === st ? 'selected' : ''}>${escapeHtml(getTechniqueLabel(dict, st))}</option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Kỹ thuật rally -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">KT Rally</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('rallyTechnique', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700 truncate">
                                <option value="ALL">Tất cả KT rally</option>
                                ${availableRallyTechs.map(rt => `
                                    <option value="${rt}" ${facetFilters.rallyTechnique === rt ? 'selected' : ''}>${escapeHtml(getTechniqueLabel(dict, rt))}</option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Tính chất kết thúc -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Tính chất kết thúc</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('finishingNature', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700">
                                <option value="ALL">Tất cả tính chất</option>
                                ${availableNatures.map(nat => `
                                    <option value="${nat}" ${facetFilters.finishingNature === nat ? 'selected' : ''}>${escapeHtml(getNatureLabel(dict, nat))}</option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Vị trí hỏng -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Vị trí hỏng</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('errorLocation', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700">
                                <option value="ALL">Tất cả vị trí hỏng</option>
                                ${availableErrorLocations.map(el => `
                                    <option value="${el}" ${facetFilters.errorLocation === el ? 'selected' : ''}>${escapeHtml(getErrorLocationLabel(dict, el))}</option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Game số -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Game số</label>
                            <select onchange="window.app.actions.query.updateFacetFilter('gameNo', this.value)" class="w-full p-2 bg-slate-50 border rounded-lg font-medium text-slate-700">
                                <option value="ALL">Tất cả game</option>
                                ${availableGames.map(g => `
                                    <option value="${g}" ${facetFilters.gameNo === g ? 'selected' : ''}>Game ${g}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Statistics Tables -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Table 1: KỸ THUẬT GIAO BÓNG -->
                    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                        <div class="p-4 border-b bg-slate-50/50">
                            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <i data-lucide="circle-dot" class="w-4 h-4 text-primary"></i> Thống kê Kỹ thuật Giao bóng
                            </h3>
                            <p class="text-xs text-slate-500">Mỗi pha bóng đóng góp tối đa 1 kỹ thuật giao bóng</p>
                        </div>
                        <div class="overflow-x-auto flex-1">
                            <table class="w-full text-xs text-left">
                                <thead class="bg-slate-50 text-slate-600 font-bold border-b">
                                    <tr>
                                        <th class="p-3">Kỹ thuật giao</th>
                                        <th class="p-3 text-center">Số pha</th>
                                        <th class="p-3 text-center text-emerald-700">Thắng</th>
                                        <th class="p-3 text-center text-rose-700">Thua</th>
                                        <th class="p-3 text-center">% Thắng</th>
                                        <th class="p-3 text-center">% Thua</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${stats.serveTechniques.map(st => `
                                        <tr class="hover:bg-slate-50/60 transition">
                                            <td class="p-3 font-semibold text-slate-800">${escapeHtml(st.label)}</td>
                                            <td class="p-3 text-center font-bold text-slate-700">${st.count}</td>
                                            <td class="p-3 text-center font-bold text-emerald-700">${st.win}</td>
                                            <td class="p-3 text-center font-bold text-rose-700">${st.lose}</td>
                                            <td class="p-3 text-center font-bold text-emerald-600">${st.winRate}%</td>
                                            <td class="p-3 text-center font-bold text-rose-600">${st.loseRate}%</td>
                                        </tr>
                                    `).join('')}
                                    ${stats.serveTechniques.length === 0 ? `
                                        <tr><td colspan="6" class="p-4 text-center text-slate-400">Không có dữ liệu giao bóng</td></tr>
                                    ` : ''}
                                </tbody>
                                <tfoot class="bg-slate-100/70 font-bold text-slate-800 border-t">
                                    <tr>
                                        <td class="p-3">TỔNG CỘNG</td>
                                        <td class="p-3 text-center">${stats.totalPoints}</td>
                                        <td class="p-3 text-center text-emerald-700">${stats.win}</td>
                                        <td class="p-3 text-center text-rose-700">${stats.lose}</td>
                                        <td class="p-3 text-center text-emerald-600">${stats.winRate}%</td>
                                        <td class="p-3 text-center text-rose-600">${stats.loseRate}%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Table 2: KỸ THUẬT RALLY -->
                    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                        <div class="p-4 border-b bg-slate-50/50">
                            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <i data-lucide="layers" class="w-4 h-4 text-primary"></i> Thống kê Kỹ thuật Rally
                            </h3>
                            <p class="text-xs text-slate-500">Phân theo vị trí cú đánh (N-2, N-1, N). Cột hiển thị: Số lần xuất hiện</p>
                        </div>
                        <div class="overflow-x-auto flex-1">
                            <table class="w-full text-xs text-left">
                                <thead class="bg-slate-50 text-slate-600 font-bold border-b">
                                    <tr>
                                        <th class="p-3">Vị trí</th>
                                        <th class="p-3">Kỹ thuật</th>
                                        <th class="p-3 text-center">Số lần xuất hiện</th>
                                        <th class="p-3 text-center text-emerald-700">Thắng</th>
                                        <th class="p-3 text-center text-rose-700">Thua</th>
                                        <th class="p-3 text-center">% Thắng</th>
                                        <th class="p-3 text-center">% Thua</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${stats.rallyTechniques.map(rt => `
                                        <tr class="hover:bg-slate-50/60 transition">
                                            <td class="p-3 font-bold text-slate-500">${rt.slot}</td>
                                            <td class="p-3 font-semibold text-slate-800">${escapeHtml(rt.label)}</td>
                                            <td class="p-3 text-center font-bold text-slate-700">${rt.count}</td>
                                            <td class="p-3 text-center font-bold text-emerald-700">${rt.win}</td>
                                            <td class="p-3 text-center font-bold text-rose-700">${rt.lose}</td>
                                            <td class="p-3 text-center font-bold text-emerald-600">${rt.winRate}%</td>
                                            <td class="p-3 text-center font-bold text-rose-600">${rt.loseRate}%</td>
                                        </tr>
                                    `).join('')}
                                    ${stats.rallyTechniques.length === 0 ? `
                                        <tr><td colspan="7" class="p-4 text-center text-slate-400">Không có dữ liệu kỹ thuật rally</td></tr>
                                    ` : ''}
                                </tbody>
                                <tfoot class="bg-slate-100/70 font-bold text-slate-800 border-t">
                                    <tr>
                                        <td colspan="2" class="p-3">TỔNG CỘNG</td>
                                        <td class="p-3 text-center">${stats.rallyTechniques.reduce((sum, x) => sum + x.count, 0)}</td>
                                        <td class="p-3 text-center text-emerald-700">${stats.rallyTechniques.reduce((sum, x) => sum + x.win, 0)}</td>
                                        <td class="p-3 text-center text-rose-700">${stats.rallyTechniques.reduce((sum, x) => sum + x.lose, 0)}</td>
                                        <td colspan="2" class="p-3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Drill-down Section -->
                <div class="space-y-4">
                    ${groupedMatches.length > 1 && facetFilters.matchId === 'ALL' ? `
                        <!-- Multi-match overview list (No unrolling all points directly to avoid cognitive overload) -->
                        <div class="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-base font-bold text-slate-800">Danh sách trận đấu có pha bóng phù hợp (${groupedMatches.length} trận)</h3>
                                    <p class="text-xs text-slate-500">Bấm vào từng trận để xem chi tiết các pha bóng cụ thể</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                ${groupedMatches.map(gm => `
                                    <div class="p-4 rounded-xl border border-slate-200/80 hover:border-primary/50 hover:shadow-sm bg-slate-50/50 hover:bg-white transition flex flex-col justify-between gap-3">
                                        <div class="space-y-1">
                                            <div class="flex items-center justify-between">
                                                <span class="text-xs font-bold text-slate-400">${formatDate(gm.matchDate)}</span>
                                                <span class="px-2 py-0.5 rounded text-[11px] font-bold ${gm.matchType === 'Thi đấu giải' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">${gm.matchType}</span>
                                            </div>
                                            <h4 class="text-base font-black text-slate-800">${gm.selfName} vs ${gm.opponentName}</h4>
                                            <p class="text-xs text-slate-500 line-clamp-1">${escapeHtml(gm.tournamentText || 'Không có mô tả')}</p>
                                        </div>

                                        <div class="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                            <div class="flex items-center gap-2">
                                                <span class="px-2.5 py-1 bg-primary/10 text-primary font-bold text-xs rounded-lg">
                                                    ${gm.points.length} pha bóng
                                                </span>
                                                <span class="text-xs font-bold text-emerald-700">${gm.winCount}W</span> - <span class="text-xs font-bold text-rose-700">${gm.loseCount}L</span>
                                            </div>
                                            <button 
                                                onclick="window.app.actions.query.focusMatch('${gm.matchId}')" 
                                                class="px-3 py-1.5 bg-primary text-white hover:bg-primary-hover text-xs font-bold rounded-lg transition flex items-center gap-1"
                                            >
                                                Xem chi tiết <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <!-- Single-match Drilldown (Full Point List by Game) -->
                        ${groupedMatches.length === 1 || facetFilters.matchId !== 'ALL' ? `
                            ${renderSingleMatchDrilldown(groupedMatches[0] || null, dict)}
                        ` : ''}
                    `}
                </div>
            `}
        ` : ''}
    </div>
    `;
}

function renderSingleMatchDrilldown(matchData, dict) {
    if (!matchData) return '';

    // Group points by gameNo
    const gameMap = {};
    matchData.points.forEach(pt => {
        if (!gameMap[pt.gameNo]) gameMap[pt.gameNo] = [];
        gameMap[pt.gameNo].push(pt);
    });

    const gameKeys = Object.keys(gameMap).sort((a, b) => Number(a) - Number(b));

    return `
    <div class="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
                <div class="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <span>${formatDate(matchData.matchDate)}</span> · 
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">${matchData.matchType}</span> · 
                    <span>Tỷ số: ${matchData.matchResult}</span>
                </div>
                <h3 class="text-lg font-black text-slate-800">
                    Chi tiết pha bóng: ${matchData.selfName} vs ${matchData.opponentName}
                </h3>
                <p class="text-xs text-slate-500 font-medium">${escapeHtml(matchData.tournamentText || '')}</p>
            </div>
            ${facetFilters.matchId !== 'ALL' ? `
                <button onclick="window.app.actions.query.updateFacetFilter('matchId', 'ALL')" class="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Quay lại tất cả trận
                </button>
            ` : ''}
        </div>

        <div class="space-y-6">
            ${gameKeys.map(gNo => `
                <div class="space-y-2.5">
                    <h4 class="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-primary inline-block"></span> Game ${gNo} (${gameMap[gNo].length} pha bóng)
                    </h4>

                    <div class="space-y-2">
                        ${gameMap[gNo].map(pt => renderPointRow(pt, dict)).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

function renderPointRow(pt, dict) {
    const isExpanded = expandedPointId === pt.pointId;
    const isWin = pt.winnerRole === 'SELF';
    const serverLabel = pt.serverRole === 'SELF' ? `${pt.selfName} (Giao)` : `${pt.opponentName} (Giao)`;

    return `
    <div class="border border-slate-200/80 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition shadow-sm">
        <!-- Compact Point Summary Row -->
        <div 
            onclick="window.app.actions.query.togglePointAccordion('${pt.pointId}')" 
            class="p-3 md:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition"
        >
            <div class="flex items-center gap-3">
                <span class="px-2.5 py-1 rounded-lg text-xs font-black ${isWin ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                    ${isWin ? 'THẮNG' : 'THUA'}
                </span>
                <span class="text-xs font-black text-slate-700">Điểm ${pt.pointNo}</span>
                <span class="text-xs font-semibold text-slate-400">(Tỷ số: ${pt.score || 'N/A'})</span>
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">${pt.touchCount} chạm</span>
                ${pt.dataQualityFlags?.length > 0 ? `
                    <span title="${escapeHtml(pt.dataQualityFlags.join('; '))}" class="p-1 bg-amber-100 text-amber-700 rounded-md">
                        <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
                    </span>
                ` : ''}
            </div>

            <!-- Sequence Preview -->
            <div class="flex-1 md:text-center text-xs font-medium text-slate-600 line-clamp-1">
                <span class="font-bold text-slate-800">${escapeHtml(getTechniqueLabel(dict, pt.serve?.ky_thuat))}</span>
                ${pt.N_2 ? ` → <span>${escapeHtml(getTechniqueLabel(dict, pt.N_2.ky_thuat))}</span>` : ''}
                ${pt.N_1 ? ` → <span>${escapeHtml(getTechniqueLabel(dict, pt.N_1.ky_thuat))}</span>` : ''}
                ${pt.N ? ` → <span class="font-bold text-slate-800">${escapeHtml(getTechniqueLabel(dict, pt.N.ky_thuat))}</span>` : ''}
            </div>

            <div class="flex items-center justify-between md:justify-end gap-2 text-xs font-semibold text-slate-500 shrink-0">
                <span>${serverLabel}</span>
                <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" class="w-4 h-4 text-slate-400"></i>
            </div>
        </div>

        <!-- Expanded Detailed Accordion -->
        ${isExpanded ? `
            <div class="p-4 bg-slate-50/80 border-t border-slate-100 text-xs space-y-3">
                ${pt.dataQualityFlags?.length > 0 ? `
                    <div class="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                        <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 shrink-0"></i>
                        <span>${escapeHtml(pt.dataQualityFlags.join('; '))}</span>
                    </div>
                ` : ''}

                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <!-- Khởi nguồn giao bóng -->
                    <div class="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1.5">
                        <div class="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-primary flex items-center gap-1">
                            <i data-lucide="circle-dot" class="w-3.5 h-3.5"></i> Giao bóng (Chạm 1)
                        </div>
                        <div><strong>Người thực hiện:</strong> ${escapeHtml(pt.serve?.nguoi_thuc_hien || 'Chưa ghi')}</div>
                        <div><strong>Kỹ thuật:</strong> ${escapeHtml(getTechniqueLabel(dict, pt.serve?.ky_thuat))}</div>
                        ${renderShotProps(pt.serve?.dac_tinh, dict)}
                    </div>

                    <!-- Cú tạo lợi thế (N-2) -->
                    <div class="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1.5 ${!pt.N_2 ? 'opacity-40' : ''}">
                        <div class="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <i data-lucide="corner-down-right" class="w-3.5 h-3.5"></i> Cú N-2
                        </div>
                        ${pt.N_2 ? `
                            <div><strong>Người thực hiện:</strong> ${escapeHtml(pt.N_2.nguoi_thuc_hien || 'Chưa ghi')}</div>
                            <div><strong>Kỹ thuật:</strong> ${escapeHtml(getTechniqueLabel(dict, pt.N_2.ky_thuat))}</div>
                            ${renderShotProps(pt.N_2.dac_tinh, dict)}
                        ` : '<div class="text-slate-400 italic">Không có</div>'}
                    </div>

                    <!-- Cú đáp trả (N-1) -->
                    <div class="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1.5 ${!pt.N_1 ? 'opacity-40' : ''}">
                        <div class="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <i data-lucide="corner-down-right" class="w-3.5 h-3.5"></i> Cú N-1
                        </div>
                        ${pt.N_1 ? `
                            <div><strong>Người thực hiện:</strong> ${escapeHtml(pt.N_1.nguoi_thuc_hien || 'Chưa ghi')}</div>
                            <div><strong>Kỹ thuật:</strong> ${escapeHtml(getTechniqueLabel(dict, pt.N_1.ky_thuat))}</div>
                            ${renderShotProps(pt.N_1.dac_tinh, dict)}
                        ` : '<div class="text-slate-400 italic">Không có</div>'}
                    </div>

                    <!-- Cú kết thúc (N) -->
                    <div class="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1.5">
                        <div class="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-primary flex items-center gap-1">
                            <i data-lucide="flag" class="w-3.5 h-3.5"></i> Cú kết thúc (N)
                        </div>
                        <div><strong>Người thực hiện:</strong> ${escapeHtml(pt.N?.nguoi_thuc_hien || 'Chưa ghi')}</div>
                        <div><strong>Kỹ thuật:</strong> ${escapeHtml(getTechniqueLabel(dict, pt.N?.ky_thuat))}</div>
                        <div><strong>Tính chất:</strong> <span class="font-bold text-slate-800">${escapeHtml(getNatureLabel(dict, pt.N?.tinh_chat))}</span></div>
                        ${renderShotProps(pt.N?.dac_tinh, dict)}
                    </div>
                </div>
            </div>
        ` : ''}
    </div>
    `;
}

function renderShotProps(props, dict) {
    if (!props) return '';
    const items = [];
    if (props.diem_roi_ngang) items.push(`Điểm rơi: ${getPropertyLabel(dict, 'diem_roi_ngang', props.diem_roi_ngang)}`);
    if (props.do_dai) items.push(`Độ dài: ${getPropertyLabel(dict, 'do_dai', props.do_dai)}`);
    if (props.do_xoay) items.push(`Độ xoáy: ${getPropertyLabel(dict, 'do_xoay', props.do_xoay)}`);
    if (props.vi_tri_hong) items.push(`Vị trí hỏng: <span class="text-rose-700 font-bold">${getErrorLocationLabel(dict, props.vi_tri_hong)}</span>`);
    if (items.length === 0) return '';
    return `<div class="text-[11px] text-slate-500 pt-1 border-t border-slate-100">${items.join(' · ')}</div>`;
}

function formatDate(dStr) {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
}

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
