import { state, subscribe, setState } from './store.js';
import { loadData } from './api.js';

import { renderSettings } from './views/settings.js';
import { renderMatchList } from './views/matchList.js';
import { renderMatchDetail } from './views/matchDetail.js';
import { renderRallyEntry } from './views/rallyEntry.js';
import { renderTimeline } from './views/timeline.js';
import { renderDashboard } from './views/dashboard.js';
import * as logic from './logic.js';
window.app.logic = logic;

window.app = window.app || {};
window.app.actions = window.app.actions || {};
window.app.state = state;
window.app.setState = setState;
window.app.navigate = (view, params = {}) => {
    setState({ view, ...params });
};

async function init() {
    await loadData();
    if (state.github.token && state.github.owner && state.github.repo) {
        setState({ view: 'matchList' });
    }
    render();
}

function renderToast() {
    if (state.notifications.length === 0) return '';
    return `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        ${state.notifications.map(n => `
            <div class="px-4 py-3 rounded-lg shadow-lg font-bold text-sm text-white ${n.type === 'error' ? 'bg-danger' : n.type === 'success' ? 'bg-success' : 'bg-slate-800'}">
                ${n.message}
            </div>
        `).join('')}
    </div>
    `;
}

function render() {
    const root = document.getElementById('app');
    
    let headerHTML = `
    <header class="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div class="flex items-center gap-3">
            <h1 class="text-xl font-black text-slate-800 cursor-pointer tracking-tight" onclick="window.app.navigate('matchList')">SỔ TAY BÓNG BÀN</h1>
            ${state.isMockMode 
                ? '<span class="hidden sm:inline-flex px-2 py-1 bg-amber-100 text-amber-800 text-[10px] uppercase font-black tracking-wider rounded-md whitespace-nowrap"><i data-lucide="database" class="w-3 h-3 mr-1 inline-block"></i> DỮ LIỆU MẪU</span>' 
                : '<span class="hidden sm:inline-flex px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] uppercase font-black tracking-wider rounded-md whitespace-nowrap"><i data-lucide="cloud-cog" class="w-3 h-3 mr-1 inline-block"></i> GITHUB</span>'}
        </div>
        <div class="flex items-center gap-2">
            ${state.view === 'matchList' ? `<button onclick="window.app.navigate('dashboard', { dashboardMatchId: 'all' })" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm flex items-center gap-1.5 transition"><i data-lucide="pie-chart" class="w-4 h-4"></i> <span class="hidden sm:inline">Phân tích Tổng</span></button>` : ''}
            <button onclick="window.app.navigate('settings')" class="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"><i data-lucide="settings" class="w-5 h-5"></i></button>
        </div>
    </header>
    `;
    
    let contentHTML = '';
    
    if (state.isMockMode && state.view !== 'settings') {
        contentHTML += `
        <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm font-medium flex gap-3 items-start shadow-sm">
            <i data-lucide="alert-circle" class="w-5 h-5 shrink-0 mt-0.5 text-amber-600"></i>
            <div>
                <strong class="block mb-0.5 text-amber-800">Chế độ Dữ liệu mẫu (Mock Mode)</strong>
                Ứng dụng đang sử dụng dữ liệu giả lập. Các thay đổi được lưu tạm thời trên trình duyệt và sẽ mất khi tải lại trang. Hãy cấu hình GitHub trong <button class="underline font-bold" onclick="window.app.navigate('settings')">Cài đặt</button> để lưu vĩnh viễn.
            </div>
        </div>
        `;
    }

    switch(state.view) {
        case 'settings': contentHTML += renderSettings(); break;
        case 'matchList': contentHTML += renderMatchList(); break;
        case 'matchDetail': contentHTML += renderMatchDetail(); break;
        case 'rallyEntry': contentHTML += renderRallyEntry(); break;
        case 'timeline': contentHTML += renderTimeline(); break;
        case 'dashboard': contentHTML += renderDashboard(); break;
        default: contentHTML += '<div>404</div>';
    }
    
    root.innerHTML = headerHTML + `
        <main class="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 flex flex-col relative">
            ${contentHTML}
        </main>
        ${renderToast()}
    `;
    
    if(window.lucide) window.lucide.createIcons();
}

window.app.render = render;
subscribe(render);
init();
