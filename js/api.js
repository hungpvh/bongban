import { state, showToast } from './store.js';
import { MOCK_DICTIONARY, MOCK_MATCHES } from './mockData.js';

function setMockMode() {
    state.isMockMode = true;
    state.dictionary = JSON.parse(JSON.stringify(MOCK_DICTIONARY));
    state.matches = JSON.parse(JSON.stringify(MOCK_MATCHES));
}

export async function loadData() {
    if (!state.github.token || !state.github.owner || !state.github.repo) {
        setMockMode();
        return true;
    }

    try {
        const baseUrl = `https://api.github.com/repos/${state.github.owner}/${state.github.repo}/contents`;
        const headers = { 
            'Authorization': `Bearer ${state.github.token}`, 
            'Accept': 'application/vnd.github.v3+json' 
        };
        
        let mRes = await fetch(`${baseUrl}/dulieubongban_v2.json?ref=${state.github.branch}`, {headers});
        if (mRes.ok) {
            const data = await mRes.json();
            const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
            state.matches = content;
            state.files.matchesSha = data.sha;
        } else {
            throw new Error(`Không thể tải dữ liệu trận đấu (dulieubongban_v2.json): ${mRes.status}`);
        }
        
        let dRes = await fetch(`${baseUrl}/tu_dien_bong_ban_v2.json?ref=${state.github.branch}`, {headers});
        if (dRes.ok) {
            const data = await dRes.json();
            const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
            state.dictionary = content;
            state.files.dictSha = data.sha;
        } else {
            throw new Error(`Không thể tải từ điển (tu_dien_bong_ban_v2.json): ${dRes.status}`);
        }
        
        state.isMockMode = false;
        showToast('Tải dữ liệu từ GitHub thành công', 'success');
        return true;
    } catch(e) {
        console.error(e);
        showToast(e.message + ' - Đang dùng dữ liệu mẫu.', 'error');
        setMockMode();
        return true;
    }
}

export async function saveData() {
    if (state.isMockMode) {
        showToast("Mock Mode: Đã lưu dữ liệu vào bộ nhớ tạm.", 'info');
        return true;
    }

    try {
        const baseUrl = `https://api.github.com/repos/${state.github.owner}/${state.github.repo}/contents`;
        
        const headersGet = { 
            'Authorization': `Bearer ${state.github.token}`, 
            'Accept': 'application/vnd.github.v3+json' 
        };
        let getRes = await fetch(`${baseUrl}/dulieubongban_v2.json?ref=${state.github.branch}`, {headers: headersGet});
        if (!getRes.ok) throw new Error('Không thể lấy SHA mới nhất của file');
        const getData = await getRes.json();
        const currentSha = getData.sha;

        const headersPut = { 
            'Authorization': `Bearer ${state.github.token}`, 
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state.matches, null, 2))));
        
        const res = await fetch(`${baseUrl}/dulieubongban_v2.json`, {
            method: 'PUT',
            headers: headersPut,
            body: JSON.stringify({
                message: 'Update match data from app',
                content: encoded,
                sha: currentSha,
                branch: state.github.branch
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            state.files.matchesSha = data.content.sha;
            showToast('Lưu dữ liệu lên GitHub thành công', 'success');
            return true;
        } else {
            const err = await res.json();
            throw new Error(err.message || 'Lỗi khi lưu file');
        }
    } catch(e) {
        console.error(e);
        showToast(`Lưu dữ liệu thất bại: ${e.message}`, 'error');
        return false;
    }
}
