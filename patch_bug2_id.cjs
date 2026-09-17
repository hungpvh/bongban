const fs = require('fs');
let code = fs.readFileSync('js/views/rallyEntry.js', 'utf8');

// Replace totalPointsBefore logic
// We need to calculate max thu_tu_diem for new points, not just length.
// For editing, we keep the original thu_tu_diem.
const regex = /const totalPointsBefore =[\s\S]*?rallyState\.editingPointIndex !== -1[\s\S]*?\? rallyState\.editingPointIndex[\s\S]*?: game\.danh_sach_diem\.length;/;

const replacement = `    // Calculate ID (thu_tu_diem)
    const isEditing = rallyState.editingPointIndex !== -1;
    let nextId;
    if (isEditing) {
        nextId = game.danh_sach_diem[rallyState.editingPointIndex].thu_tu_diem;
    } else {
        const maxId = game.danh_sach_diem.reduce((max, p) => Math.max(max, p.thu_tu_diem || 0), 0);
        nextId = maxId + 1;
    }
    const totalPointsBefore = game.danh_sach_diem.length; // Use length for determining the server as it counts the number of points played`;

code = code.replace(regex, replacement);

// Then replace thu_tu_diem: totalPointsBefore + 1 with thu_tu_diem: nextId
code = code.replace(/thu_tu_diem:\s*totalPointsBefore \+ 1,/, 'thu_tu_diem: nextId,');

fs.writeFileSync('js/views/rallyEntry.js', code);
console.log("Bug 2 ID logic patched.");
