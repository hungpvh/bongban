import { state, setState, showToast } from '../store.js';
import { loadData } from '../api.js';

window.app = window.app || {};
window.app.actions = window.app.actions || {};
window.app.actions.settings = {
    updateField: (field, value) => {
        state.github[field] = value;
        localStorage.setItem('gh_' + field, value);
    },
    saveAndLoad: async () => {
        const btn = document.getElementById('btn-save-settings');
        const ogText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Đang kết nối...`;
        btn.disabled = true;
        
        await loadData();
        
        btn.innerHTML = ogText;
        btn.disabled = false;
        
        if (!state.isMockMode) {
            setState({ view: 'matchList' });
        }
        window.app.render();
    },
    goToList: () => {
        setState({ view: 'matchList' });
    }
};

export function renderSettings() {
    return `
    <div class="max-w-xl mx-auto w-full">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-slate-800">Cấu hình kết nối</h2>
            <button onclick="window.app.actions.settings.goToList()" class="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        
        <div class="bg-white p-6 rounded-2xl border shadow-sm mb-6">
            <div class="mb-6 flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl">
                <i data-lucide="info" class="w-5 h-5 shrink-0 mt-0.5 text-blue-600"></i>
                <div class="text-sm font-medium leading-relaxed">
                    Dữ liệu trận đấu và từ điển được lưu trực tiếp trên <b>GitHub Repository</b> ở nhánh <b>data</b>. Vui lòng cung cấp <b>Personal Access Token (PAT)</b> có quyền <i>repo</i> để đọc/ghi file.
                </div>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1.5">GitHub Owner / Username</label>
                    <input type="text" value="${state.github.owner}" onchange="window.app.actions.settings.updateField('owner', this.value)" placeholder="VD: hungpv" class="w-full p-3 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1.5">Repository</label>
                    <input type="text" value="${state.github.repo}" onchange="window.app.actions.settings.updateField('repo', this.value)" placeholder="VD: table-tennis-data" class="w-full p-3 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1.5">Data Branch</label>
                    <input type="text" value="${state.github.branch}" onchange="window.app.actions.settings.updateField('branch', this.value)" placeholder="Mặc định: data" class="w-full p-3 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1.5">Personal Access Token (PAT)</label>
                    <input type="password" value="${state.github.token}" onchange="window.app.actions.settings.updateField('token', this.value)" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" class="w-full p-3 bg-slate-50 border rounded-xl font-mono text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition">
                    <div class="text-xs text-slate-500 mt-2 font-medium">Token của bạn được lưu an toàn tại Local Storage của trình duyệt.</div>
                </div>
            </div>
            
            <div class="mt-8">
                <button id="btn-save-settings" onclick="window.app.actions.settings.saveAndLoad()" class="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
                    <i data-lucide="save" class="w-5 h-5"></i> Lưu & Kết nối
                </button>
            </div>
        </div>
        
        <div class="text-center">
            <button onclick="window.app.actions.settings.goToList()" class="text-sm font-bold text-slate-500 hover:text-slate-800 transition underline underline-offset-4">Tiếp tục không cần lưu (Chế độ Mock)</button>
        </div>
    </div>
    `;
}
