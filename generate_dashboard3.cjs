const fs = require('fs');
const content = fs.readFileSync('js/views/dashboard.js', 'utf8');

const updated = content.replace('<!-- Heatmap -->', `
                <!-- Insights & Training -->
                <div class="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl shadow-sm border border-blue-100 xl:col-span-2">
                    <h3 class="font-bold text-indigo-900 text-lg mb-4 flex items-center gap-2"><i data-lucide="lightbulb" class="w-5 h-5 text-indigo-600"></i> Insight & Đề Xuất Tập Luyện</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
                            <h4 class="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wide">Điểm Mạnh (Cần Phát Huy)</h4>
                            <ul class="list-disc list-inside text-sm text-slate-600 space-y-2">
                                <li><strong>Win Rate:</strong> \${winRate} là tỷ lệ thắng điểm tổng thể.</li>
                                \${stats.pointsWonOnServe > stats.pointsWonOnReceive ? '<li>Khả năng ghi điểm khi <strong>cầm giao bóng</strong> tốt hơn khi đỡ giao.</li>' : '<li>Khả năng ghi điểm khi <strong>đỡ giao bóng</strong> tốt hơn khi cầm giao.</li>'}
                                \${Object.entries(stats.nBall).filter(x=>x[1].atts > 5 && x[1].wins/x[1].atts > 0.5).map(x=> \`<li><strong>\${x[0]}th Ball Attack</strong> rất hiệu quả (\${pct(x[1].wins, x[1].atts)}).</li>\`).join('')}
                            </ul>
                        </div>
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
                            <h4 class="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wide">Điểm Yếu (Đề Xuất Tập Luyện)</h4>
                            <ul class="list-disc list-inside text-sm text-slate-600 space-y-2">
                                \${Object.entries(stats.techniques).filter(x=>x[1].u > 2).sort((a,b)=>b[1].u - a[1].u).slice(0,2).map(x=> \`<li>Tập kiểm soát <strong>\${dict.ky_thuat?.[x[0]] || x[0]}</strong> (có \${x[1].u} lỗi tự đánh hỏng).</li>\`).join('')}
                                \${Object.entries(stats.nBall).filter(x=>x[1].atts > 3 && x[1].wins/x[1].atts < 0.4).map(x=> \`<li>Cải thiện <strong>\${x[0]}th Ball Attack</strong> (hiệu suất thấp \${pct(x[1].wins, x[1].atts)}).</li>\`).join('')}
                                \${stats.loseStreak > 4 ? \`<li>Khả năng cắt chuỗi thua chưa tốt (Lose streak dài nhất: \${stats.loseStreak}). Cần rèn luyện tâm lý tĩnh.</li>\` : ''}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Heatmap -->
`);

fs.writeFileSync('js/views/dashboard.js', updated);
