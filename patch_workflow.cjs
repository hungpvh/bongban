const fs = require('fs');
let content = fs.readFileSync('src/components/RallyWorkflow.tsx', 'utf8');

const targetState = `  const [cuN, setCuN] = useState<TouchData | null>(initialData?.cu_ket_thuc_N || null);`;

const wrapperStr = `  const [cuN, setCuN] = useState<TouchData | null>(initialData?.cu_ket_thuc_N || null);

  const getOtherPlayer = (p: string) => p === match.thong_tin.doi_thu_1 ? match.thong_tin.doi_thu_2 : match.thong_tin.doi_thu_1;

  const handleSetCuN = (touch: TouchData | null) => {
    setCuN(touch);
    if (touch && touch.nguoi_thuc_hien) {
      const actor = touch.nguoi_thuc_hien;
      const other = getOtherPlayer(actor);
      if (cuN1) setCuN1(prev => prev ? { ...prev, nguoi_thuc_hien: other } : null);
      if (cuN2) setCuN2(prev => prev ? { ...prev, nguoi_thuc_hien: actor } : null);
    }
  };

  const handleSetCuN1 = (touch: TouchData | null) => {
    setCuN1(touch);
    if (touch && touch.nguoi_thuc_hien) {
      const actor = touch.nguoi_thuc_hien;
      const other = getOtherPlayer(actor);
      if (cuN) setCuN(prev => prev ? { ...prev, nguoi_thuc_hien: other } : null);
      if (cuN2) setCuN2(prev => prev ? { ...prev, nguoi_thuc_hien: other } : null);
    }
  };

  const handleSetCuN2 = (touch: TouchData | null) => {
    setCuN2(touch);
    if (touch && touch.nguoi_thuc_hien) {
      const actor = touch.nguoi_thuc_hien;
      const other = getOtherPlayer(actor);
      if (cuN1) setCuN1(prev => prev ? { ...prev, nguoi_thuc_hien: other } : null);
      if (cuN) setCuN(prev => prev ? { ...prev, nguoi_thuc_hien: actor } : null);
    }
  };`;

content = content.replace(targetState, wrapperStr);

content = content.replace(`setTouch: setCuN,`, `setTouch: handleSetCuN,`);
content = content.replace(`setTouch: setCuN,`, `setTouch: handleSetCuN,`); // Need to replace twice or globally

content = content.replace(/setTouch: setCuN,/g, `setTouch: handleSetCuN,`);
content = content.replace(/setTouch: setCuN1,/g, `setTouch: handleSetCuN1,`);
content = content.replace(/setTouch: setCuN2,/g, `setTouch: handleSetCuN2,`);

fs.writeFileSync('src/components/RallyWorkflow.tsx', content);
