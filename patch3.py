with open('js/views/rallyEntry.js', 'r') as f:
    text = f.read()

target = '              strokeKey === "n0" && (rallyState.pointType === "unforced_error" || rallyState.pointType === "forced_error")'
repl = '              strokeKey === "n0"'

text = text.replace(target, repl)

with open('js/views/rallyEntry.js', 'w') as f:
    f.write(text)
