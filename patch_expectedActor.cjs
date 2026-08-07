const fs = require('fs');

// Patch TouchCard.tsx
let touchContent = fs.readFileSync('src/components/TouchCard.tsx', 'utf8');
touchContent = touchContent.replace(
  `serveReceiver: string;`,
  `serveReceiver: string;\n  expectedActor?: string;`
);
touchContent = touchContent.replace(
  `export function TouchCard({ title, data, onChange, isOptional, isServe, isLast, player1, player2, serveReceiver }: Props) {`,
  `export function TouchCard({ title, data, onChange, isOptional, isServe, isLast, player1, player2, serveReceiver, expectedActor }: Props) {`
);
touchContent = touchContent.replace(
  `nguoi_thuc_hien: '', ky_thuat: ''`,
  `nguoi_thuc_hien: expectedActor || '', ky_thuat: ''`
);
touchContent = touchContent.replace(
  `nguoi_thuc_hien: '', ky_thuat: ''`,
  `nguoi_thuc_hien: expectedActor || '', ky_thuat: ''` // Replace the other one too if present
);
fs.writeFileSync('src/components/TouchCard.tsx', touchContent);

// Patch RallyWorkflow.tsx
let workflowContent = fs.readFileSync('src/components/RallyWorkflow.tsx', 'utf8');

// We need to determine expected actors for N, N-1, N-2 based on whichever is known.
const expectedLogic = `
  const knownNActor = cuN?.nguoi_thuc_hien || (cuN2?.nguoi_thuc_hien) || (cuN1?.nguoi_thuc_hien ? getOtherPlayer(cuN1.nguoi_thuc_hien) : null);
  const knownN1Actor = cuN1?.nguoi_thuc_hien || (knownNActor ? getOtherPlayer(knownNActor) : null);
  const knownN2Actor = knownNActor;

  // Render Step 4: Data Entry`;

workflowContent = workflowContent.replace(`  // Render Step 4: Data Entry`, expectedLogic);

workflowContent = workflowContent.replace(
  `sequence.push({ title: \`Pha cuối (N)\`, touch: cuN, setTouch: handleSetCuN, isLast: true });`,
  `sequence.push({ title: \`Pha cuối (N)\`, touch: cuN, setTouch: handleSetCuN, isLast: true, expectedActor: knownNActor || undefined });`
);
workflowContent = workflowContent.replace(
  `sequence.push({ title: \`Pha cuối (N)\`, touch: cuN, setTouch: handleSetCuN, isLast: true });`,
  `sequence.push({ title: \`Pha cuối (N)\`, touch: cuN, setTouch: handleSetCuN, isLast: true, expectedActor: knownNActor || undefined });`
);

workflowContent = workflowContent.replace(
  `sequence.push({ title: \`Pha (N-1)\`, touch: cuN1, setTouch: handleSetCuN1, isOptional: true });`,
  `sequence.push({ title: \`Pha (N-1)\`, touch: cuN1, setTouch: handleSetCuN1, isOptional: true, expectedActor: knownN1Actor || undefined });`
);
workflowContent = workflowContent.replace(
  `sequence.push({ title: \`Pha (N-1)\`, touch: cuN1, setTouch: handleSetCuN1, isOptional: true });`,
  `sequence.push({ title: \`Pha (N-1)\`, touch: cuN1, setTouch: handleSetCuN1, isOptional: true, expectedActor: knownN1Actor || undefined });`
);

workflowContent = workflowContent.replace(
  `sequence.push({ title: \`Pha (N-2)\`, touch: cuN2, setTouch: handleSetCuN2, isOptional: true });`,
  `sequence.push({ title: \`Pha (N-2)\`, touch: cuN2, setTouch: handleSetCuN2, isOptional: true, expectedActor: knownN2Actor || undefined });`
);
workflowContent = workflowContent.replace(
  `sequence.push({ title: \`Pha (N-2)\`, touch: cuN2, setTouch: handleSetCuN2, isOptional: true });`,
  `sequence.push({ title: \`Pha (N-2)\`, touch: cuN2, setTouch: handleSetCuN2, isOptional: true, expectedActor: knownN2Actor || undefined });`
);

workflowContent = workflowContent.replace(
  `let sequence: { title: string; touch: TouchData | null; setTouch: (t: TouchData | null) => void; isOptional?: boolean; isServe?: boolean; isLast?: boolean; expectedActor?: string }[] = [];`,
  `// already patched`
);
workflowContent = workflowContent.replace(
  `let sequence: { title: string; touch: TouchData | null; setTouch: (t: TouchData | null) => void; isOptional?: boolean; isServe?: boolean; isLast?: boolean }[] = [];`,
  `let sequence: { title: string; touch: TouchData | null; setTouch: (t: TouchData | null) => void; isOptional?: boolean; isServe?: boolean; isLast?: boolean; expectedActor?: string }[] = [];`
);


// In TouchCard component invocation
workflowContent = workflowContent.replace(
  `serveReceiver={serveReceiver}`,
  `serveReceiver={serveReceiver}\n          expectedActor={seq.expectedActor}`
);

fs.writeFileSync('src/components/RallyWorkflow.tsx', workflowContent);

