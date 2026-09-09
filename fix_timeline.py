import re

with open('js/views/timeline.js', 'r') as f:
    content = f.read()

# find match definition
match_def = "    const match = state.matches.find(m => m.id_tran_dau === state.selectedMatchId);\n    if (!match) return `<p class=\"p-6 text-center text-slate-500\">Không tìm thấy trận đấu.</p>`;"

content = content.replace(match_def, "")

# insert it before selectedGameId check
insert_point = "    if (!state.selectedGameId) {"
content = content.replace(insert_point, match_def + "\n\n" + insert_point)

with open('js/views/timeline.js', 'w') as f:
    f.write(content)
