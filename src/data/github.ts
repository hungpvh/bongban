import { TableTennisDictionary, MatchData } from '../types';

const REPO_OWNER_KEY = 'tt_repo_owner';
const REPO_NAME_KEY = 'tt_repo_name';
const GH_TOKEN_KEY = 'tt_gh_token';

export const getGitHubConfig = () => {
  return {
    owner: localStorage.getItem(REPO_OWNER_KEY) || '',
    repo: localStorage.getItem(REPO_NAME_KEY) || '',
    token: localStorage.getItem(GH_TOKEN_KEY) || ''
  };
};

export const saveGitHubConfig = (owner: string, repo: string, token: string) => {
  localStorage.setItem(REPO_OWNER_KEY, owner);
  localStorage.setItem(REPO_NAME_KEY, repo);
  localStorage.setItem(GH_TOKEN_KEY, token);
};

const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
});

// Fetch File Content from GitHub via API
export const fetchFileFromGitHub = async (filename: string): Promise<{ content: any, sha: string }> => {
  const { owner, repo, token } = getGitHubConfig();
  if (!owner || !repo || !token) throw new Error("Missing GitHub Configuration");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=data`;
  
  const response = await fetch(url, { headers: getHeaders(token) });
  if (!response.ok) {
    if (response.status === 404) {
       return { content: null, sha: '' };
    }
    throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
  }

  const data = await response.json();
  const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
  return { content, sha: data.sha };
};

export const fetchDictionary = async (): Promise<TableTennisDictionary> => {
  const { content } = await fetchFileFromGitHub('tu_dien_bong_ban_v2.json');
  if (!content) throw new Error("Dictionary not found");
  return content;
};

export const fetchMatchData = async (): Promise<{ data: MatchData[], sha: string }> => {
  const res = await fetchFileFromGitHub('dulieubongban_v2.json');
  return { data: res.content || [], sha: res.sha };
};

export const saveMatchDataToGitHub = async (matchData: MatchData[], sha: string): Promise<string> => {
  const { owner, repo, token } = getGitHubConfig();
  if (!owner || !repo || !token) throw new Error("Missing GitHub Configuration");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/dulieubongban_v2.json`;
  
  // Encode content properly to Base64 (UTF-8 safe)
  const contentStr = JSON.stringify(matchData, null, 2);
  const base64Content = btoa(unescape(encodeURIComponent(contentStr)));

  const body = {
    message: "Update match data via App",
    content: base64Content,
    sha: sha,
    branch: "data"
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Failed to save data: ${response.statusText}`);
  }

  const result = await response.json();
  return result.content.sha;
};
