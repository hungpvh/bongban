const fs = require('fs');
const file = 'src/components/MatchList.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="flex flex-wrap items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                <button 
                  onClick={() => onSelectMatch(match.id_tran_dau)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <FileText size={14}/> Xem / Nhập điểm
                </button>
                {/* <button 
                  onClick={() => onAnalyzeMatch && onAnalyzeMatch(match.id_tran_dau)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                  <BarChart2 size={14}/> Phân tích
                </button> */}`;

const replacement = `<div className="flex flex-wrap items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                <button 
                  onClick={() => onSelectMatch(match.id_tran_dau)}
                  className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                   Xem
                </button>
                <button 
                  onClick={() => onSelectMatch(match.id_tran_dau)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <FileText size={14}/> Nhập điểm
                </button>
                <button 
                  onClick={() => onAnalyzeMatch ? onAnalyzeMatch(match.id_tran_dau) : onSelectMatch(match.id_tran_dau)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                  <BarChart2 size={14}/> Phân tích
                </button>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
