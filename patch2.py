with open('js/views/rallyEntry.js', 'r') as f:
    text = f.read()

text = text.replace("\\`<button", "`<button")
text = text.replace("</button>\\`", "</button>`")

with open('js/views/rallyEntry.js', 'w') as f:
    f.write(text)
