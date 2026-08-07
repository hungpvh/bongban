const fs = require('fs');
let content = fs.readFileSync('src/components/TouchCard.tsx', 'utf8');

content = content.replace(
  /const isMirrored = serveReceiver === player2;/g,
  `const currentReceiver = data?.nguoi_thuc_hien ? (data.nguoi_thuc_hien === player1 ? player2 : player1) : serveReceiver;
  const isMirrored = currentReceiver === player2;`
);

fs.writeFileSync('src/components/TouchCard.tsx', content);
