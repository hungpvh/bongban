import React, { useState } from 'react';
import { getGitHubConfig, saveGitHubConfig } from '../data/github';
import { useAppContext } from '../context/AppContext';

export function Settings({ onComplete }: { onComplete: () => void }) {
  const { checkConfig } = useAppContext();
  const config = getGitHubConfig();
  const [owner, setOwner] = useState(config.owner);
  const [repo, setRepo] = useState(config.repo);
  const [token, setToken] = useState(config.token);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGitHubConfig(owner, repo, token);
    checkConfig();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Cấu hình GitHub</h2>
        <p className="text-sm text-slate-600 mb-6">
          Ứng dụng cần quyền truy cập vào kho lưu trữ GitHub chứa file dữ liệu.
        </p>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chủ sở hữu (Owner)</label>
            <input 
              type="text"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Ví dụ: hungpv"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên kho (Repository)</label>
            <input 
              type="text"
              value={repo}
              onChange={e => setRepo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Ví dụ: my-ping-pong-data"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token</label>
            <input 
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="ghp_xxxxxxxxxxxx"
              required
            />
          </div>
          
          <div className="flex flex-col gap-3 mt-6">
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors">
              Lưu & Tiếp tục
            </button>
            <button type="button" onClick={onComplete} className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors">
              Bỏ qua (Dùng dữ liệu mẫu)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
