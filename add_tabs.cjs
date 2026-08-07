const fs = require('fs');

const appFile = fs.readFileSync('src/App.tsx', 'utf8');

const newTabsHeader = `
                        {[
                            {id: 'overview', label: 'Tổng quan', icon: <PieChart size={16}/>},
                            {id: 'technique', label: 'Kỹ thuật', icon: <Activity size={16}/>},
                            {id: 'serve', label: 'Giao bóng', icon: <Target size={16}/>},
                            {id: 'heatmap', label: 'Điểm rơi', icon: <Crosshair size={16}/>},
                            {id: 'pattern', label: 'Pattern', icon: <Zap size={16}/>},
                            {id: 'insight', label: 'Insight', icon: <TrendingUp size={16}/>},
                        ].map(t => (
`;

const newTabsContent = `

                    {activeTab === 'pattern' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
                                <Zap size={48} className="mx-auto mb-4 text-primary opacity-50"/>
                                <h3 className="font-bold text-xl text-slate-800 mb-2">Chiến Thuật / Pattern</h3>
                                <p className="text-slate-500 max-w-lg mx-auto">Chức năng phân tích kết hợp Giao bóng &rarr; Đỡ giao &rarr; Tấn công đang được tổng hợp dữ liệu, sẽ hiển thị pattern ghi điểm nhiều nhất của bạn.</p>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'insight' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm p-8">
                                <h3 className="font-bold text-2xl text-indigo-900 mb-6 flex items-center gap-2"><TrendingUp/> Training Insight</h3>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                                        <div className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-lg"><Activity className="text-emerald-500"/> Khuyến nghị tập luyện</div>
                                        <ul className="space-y-3 mt-4 text-slate-600">
                                            {techniques.length > 0 && techniques.some((t: any) => t.used > 5 && (t.win/t.used) < 0.4) ? (
                                                techniques.filter((t: any) => t.used > 5 && (t.win/t.used) < 0.4).slice(0,2).map((t: any) => (
                                                    <li key={t.key} className="flex gap-2 items-start"><AlertTriangle size={16} className="text-amber-500 mt-1 shrink-0"/> Cải thiện độ ổn định của <strong>{t.label}</strong> (hiệu suất chỉ đạt {safePct(t.win, t.used)}%)</li>
                                                ))
                                            ) : (
                                                <li className="flex gap-2 items-start"><AlertTriangle size={16} className="text-emerald-500 mt-1 shrink-0"/> Các kỹ thuật hiện tại đang có hiệu suất ổn định.</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                                        <div className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-lg"><Zap className="text-amber-500"/> Điểm mạnh nổi bật</div>
                                        <ul className="space-y-3 mt-4 text-slate-600">
                                            {techniques.length > 0 && techniques.some((t: any) => t.used > 5 && (t.win/t.used) >= 0.6) ? (
                                                techniques.filter((t: any) => t.used > 5 && (t.win/t.used) >= 0.6).slice(0,2).map((t: any) => (
                                                    <li key={t.key} className="flex gap-2 items-start"><Target size={16} className="text-emerald-500 mt-1 shrink-0"/> Phát huy <strong>{t.label}</strong> (tỷ lệ ghi điểm {safePct(t.win, t.used)}%)</li>
                                                ))
                                            ) : (
                                                <li className="flex gap-2 items-start"><Target size={16} className="text-amber-500 mt-1 shrink-0"/> Cần thêm dữ liệu trận đấu để tìm ra điểm mạnh tuyệt đối.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
`;

let replaced = appFile;
replaced = replaced.replace(/\{\[\s*\{\s*id:\s*'overview'.*?\]\.map\(t => \(/s, newTabsHeader);

replaced = replaced.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}\s*\/\/\s*---\s*App\s*Content\s*Overlay\s*---/, newTabsContent + '\n        </div>\n    );\n}\n\n// --- App Content Overlay ---');

fs.writeFileSync('src/App.tsx', replaced);
