with open('js/views/rallyEntry.js', 'r') as f:
    text = f.read()

target1 = """      nguoi_ghi_diem: rallyState.pointWinner,
      tong_so_cham: rallyState.touches,
      khoi_nguon_giao_bong:"""
repl1 = """      nguoi_ghi_diem: rallyState.pointWinner,
      tong_so_cham: rallyState.touches,
      nguoi_giao_bong: currentServer,
      khoi_nguon_giao_bong:"""
text = text.replace(target1, repl1)

target2 = """            ${
              strokeKey === "n0"
                ? `
            <div class="mt-3 grid grid-cols-2 gap-2">
                <button onclick="window.app.actions.rally.setStrokeProp('n0', 'netOut', 'luoi')" class="${rallyState.strokes.n0.netOut === "luoi" ? "bg-danger text-white" : "bg-white border text-slate-600"} p-2 rounded-lg text-sm font-bold transition">Rúc lưới</button>
                <button onclick="window.app.actions.rally.setStrokeProp('n0', 'netOut', 'ra_ngoai')" class="${rallyState.strokes.n0.netOut === "ra_ngoai" ? "bg-danger text-white" : "bg-white border text-slate-600"} p-2 rounded-lg text-sm font-bold transition">Ra ngoài</button>
            </div>
            `
                : ""
            }"""

repl2 = """            ${
              strokeKey === "n0" && (rallyState.pointType === "unforced_error" || rallyState.pointType === "forced_error")
                ? `
            <div class="mt-3">
                <label class="block text-xs font-semibold text-slate-500 mb-1">Vị trí hỏng</label>
                <div class="grid grid-cols-2 gap-2">
                ${Object.entries(dict.thuoc_tinh_loi?.vi_tri_hong || {})
                  .map(
                    ([k, v]) =>
                      \`<button onclick="window.app.actions.rally.setStrokeProp('n0', 'netOut', '${k}')" class="${rallyState.strokes.n0.netOut === k ? "bg-danger text-white" : "bg-white border text-slate-600"} p-2 rounded-lg text-sm font-bold transition">${v}</button>\`
                  )
                  .join("")}
                </div>
            </div>
            `
                : ""
            }"""

text = text.replace(target2, repl2)

with open('js/views/rallyEntry.js', 'w') as f:
    f.write(text)
