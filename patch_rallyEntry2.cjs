const fs = require('fs');
let code = fs.readFileSync('js/views/rallyEntry.js', 'utf8');

// Fix performSaveRally
const performSaveRallyRegex = /const success = await saveData\(\);\s*if \(success\) \{/g;
code = code.replace(performSaveRallyRegex, `const result = await saveData();
        if (result === true || (result && result.success)) {`);

// Wait, the catch block was assuming exception is thrown. But saveData now returns { success: false, error: e }.
const tryCatchRegex = /try \{\s*const result = await saveData\(\);\s*if \(result === true \|\| \(result && result\.success\)\) \{\s*resetForm\(\);\s*showToast\("Đã lưu Rally!"\);\s*window\.app\.setState\(\{\}\);\s*return;\s*\} else \{\s*\/\/ This is the false path from saveData not due to error throwing but maybe something else\s*throw new Error\("Lỗi khi lưu file"\);\s*\}\s*\} catch \(err\) \{\s*if \(err\.status === 409 \|\| \(err\.message && err\.message\.includes\('Lỗi khi lưu file'\)\)\) \{/;

const tryCatchReplacement = `
        const result = await saveData();
        if (result === true || (result && result.success)) {
          resetForm();
          showToast("Đã lưu Rally!");
          window.app.setState({});
          return;
        } else {
          const err = result.error || new Error("Lỗi khi lưu file");
          if (err.status === 409 || (err.message && err.message.includes('Lỗi khi lưu file'))) {
            // Rollback local changes
`;

code = code.replace(/try\s*\{\s*const result = await saveData\(\);\s*if \(result === true \|\| \(result && result\.success\)\) \{[\s\S]*?catch \(err\) \{[\s\S]*?if \(err\.status === 409[\s\S]*?'Lỗi khi lưu file'\)\)\) \{/, `
      const result = await saveData();
      if (result === true || (result && result.success)) {
        resetForm();
        showToast("Đã lưu Rally!");
        window.app.setState({});
        return;
      } else {
        const err = result.error || new Error("Lỗi khi lưu file");
        if (err.status === 409 || (err.message && err.message.includes('Lỗi khi lưu file'))) {
`);

fs.writeFileSync('js/views/rallyEntry.js', code);
console.log("rallyEntry try-catch replaced");
