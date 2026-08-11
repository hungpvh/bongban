export const state = {
    view: 'settings', 
    isMockMode: false,
    matches: [],
    dictionary: null,
    github: {
        token: localStorage.getItem('gh_token') || '',
        owner: localStorage.getItem('gh_owner') || '',
        repo: localStorage.getItem('gh_repo') || '',
        branch: localStorage.getItem('gh_branch') || 'data'
    },
    files: { matchesSha: null, dictSha: null },
    selectedMatchId: null,
    selectedGameId: null,
    notifications: []
};

export const listeners = [];

export function setState(updates) {
    Object.assign(state, updates);
    listeners.forEach(fn => fn());
}

export function subscribe(fn) { listeners.push(fn); }

export function showToast(message, type = 'info') {
    const id = Date.now();
    state.notifications.push({ id, message, type });
    setState({});
    setTimeout(() => {
        state.notifications = state.notifications.filter(n => n.id !== id);
        setState({});
    }, 3000);
}
