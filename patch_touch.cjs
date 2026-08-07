const fs = require('fs');
let content = fs.readFileSync('src/components/TouchCard.tsx', 'utf8');

const targetLogic = `  const isError = isLast && (data?.tinh_chat === 'unforced_error' || data?.tinh_chat === 'forced_error');
  const isMirrored = serveReceiver === player2;`;

const newLogic = `  const isError = isLast && (data?.tinh_chat === 'unforced_error' || data?.tinh_chat === 'forced_error');
  const currentReceiver = data?.nguoi_thuc_hien 
    ? (data.nguoi_thuc_hien === player1 ? player2 : player1)
    : serveReceiver;
  const isMirrored = currentReceiver === player2;`;

content = content.replace(targetLogic, newLogic);

content = content.replace(
  `Người đỡ: {serveReceiver}`,
  `Người đỡ: {currentReceiver}`
);

fs.writeFileSync('src/components/TouchCard.tsx', content);
