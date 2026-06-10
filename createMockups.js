const fs = require('fs');
const path = require('path');

const routes = [
  "hr", 
  "admin/archive", 
  "admin/contracts", 
  "admin/settlements", 
  "admin/crm", 
  "admin/marketing", 
  "admin/vrtours", 
  "admin/cards", 
  "crm", 
  "client-portal", 
  "web"
];

routes.forEach(r => {
  const dir = path.join(__dirname, 'src', 'app', r);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const content = `import React from 'react';

/**
 * @id Mockup_${r.replace(/[\/\-]/g, '_')}
 * @milestone M_Mockup
 * @why 전역 프론트엔드 목업 선행 전개
 */
export default function Page() {
  return (
    <div className="p-10 min-h-[calc(100vh-64px)] bg-[#0d1117] text-[#c9d1d9]">
      <div className="max-w-6xl mx-auto border border-[#30363d] rounded-2xl bg-[#161b22] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-8xl pointer-events-none">
          MOCKUP
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4 flex items-center gap-3">
          <span className="text-[#58a6ff]">/{r}</span> Page
        </h1>
        <p className="text-gray-400 font-mono text-sm mb-10 border-l-4 border-[#FFD700] pl-4 py-1">
          대표님의 지시(SEQ_001)에 따라 백엔드 구축 이전에 선행 전개된 프론트엔드 목업입니다.<br/>
          현재 UI 청사진을 그리는 중이며, 확정 후 DB가 연결될 예정입니다.
        </p>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-64 bg-[#0d1117] rounded-xl border border-dashed border-[#484f58] flex items-center justify-center text-gray-600 font-bold">
            주요 컴포넌트 영역 (Draft)
          </div>
          <div className="col-span-1 h-64 bg-[#0d1117] rounded-xl border border-dashed border-[#484f58] flex items-center justify-center text-gray-600 font-bold">
            사이드 위젯 (Draft)
          </div>
        </div>
      </div>
    </div>
  );
}
`;
  
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
});

console.log("Mockup pages generated successfully.");
