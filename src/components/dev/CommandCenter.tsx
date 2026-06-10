import React from 'react';

const CommandCenter = ({ data, onSelectNode, toggleFolder }: { data: any, onSelectNode: (node:any)=>void, toggleFolder: (f:any)=>void }) => {
  if (!data || !data.isCeoMode) return <div className="animate-pulse text-gray-500 font-mono flex items-center justify-center h-full">SYNCHRONIZING EXECUTIVE REPORT...</div>;

  const getGroupedMilestones = () => {
    if (!data.milestones) return [];
    
    const groups = [
      { name: '🧠 Core (비즈니스 모델 및 관제)', keys: ['M0', 'M16'] },
      { name: '🏢 ERP (백오피스 구축)', keys: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'] },
      { name: '📈 CRM (영업지원 및 프롭테크)', keys: ['M10', 'M11', 'M12', 'M15', 'M17'] },
      { name: '🌍 B2C (고객 포털 및 VR)', keys: ['M13', 'M14'] }
    ];

    return groups.map(g => ({
      ...g,
      items: data.milestones.filter((m:any) => g.keys.includes(m.rawId))
    }));
  };

  const groupedMilestones = getGroupedMilestones();
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${String(today.getMonth()+1).padStart(2,'0')}월 ${String(today.getDate()).padStart(2,'0')}일`;

  const getInProgressTask = (m: any) => {
    if (!m.criteria) return m.insight;
    const pending = m.criteria.filter((c:any) => c.status !== 'PASS');
    if (pending.length > 0) return `[${pending.length}대 과제 대기 중] ${pending[0].question}`;
    return m.insight;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#09090b] text-[#d4d4d8]">
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-8 border-b border-[#27272a] bg-[#09090b]">
        <h1 className="text-[11px] font-semibold tracking-[0.2em] text-[#a1a1aa] mb-2 uppercase">{dateStr} 개발 포커스</h1>
        <h2 className="text-2xl font-bold text-[#fafafa] tracking-tight">1. 커맨드 센터 UI 엑셀 폼(Data Grid) 완벽 정리</h2>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar flex justify-center">
        <table className="w-full max-w-6xl text-left border-collapse border border-[#27272a] bg-[#09090b] rounded-xl overflow-hidden shadow-lg">
          <thead>
            <tr className="bg-[#18181b] text-[#a1a1aa] text-[11px] uppercase tracking-[0.1em]">
              <th className="p-4 border-b border-r border-[#27272a] font-semibold w-[25%]">마일스톤</th>
              <th className="p-4 border-b border-r border-[#27272a] font-semibold w-[12%] text-center">진행도</th>
              <th className="p-4 border-b border-r border-[#27272a] font-semibold w-[9%] text-center">문서팩</th>
              <th className="p-4 border-b border-r border-[#27272a] font-semibold w-[9%] text-center">코드팩</th>
              <th className="p-4 border-b border-r border-[#27272a] font-semibold w-[30%]">중요과제요약</th>
              <th className="p-4 border-b border-[#27272a] font-semibold w-[15%]">긴급이슈</th>
            </tr>
          </thead>
          <tbody>
            {groupedMilestones.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                {/* Group Header */}
                <tr className="bg-[#09090b]">
                  <td colSpan={6} className="p-3 border border-[#27272a] text-[12px] font-bold text-[#fafafa] tracking-wider pl-4 bg-[#18181b]/50">
                    {group.name}
                  </td>
                </tr>
                {/* Milestone Rows */}
                {group.items.map((m: any) => {
                  const isDev = m.status === 'IN_DEV';
                  const isLive = m.status === 'LIVE' || m.status === 'COMPLETED';
                  const rowClass = isDev ? 'bg-[#18181b] hover:bg-[#27272a]' : 'hover:bg-[#18181b]';
                  const nameColor = isDev ? 'text-[#60a5fa] font-bold' : isLive ? 'text-[#4ade80] font-bold' : 'text-[#a1a1aa]';
                  
                  let alert = '';
                  if (data.diagnosis?.orphans?.length > 0 && m.rawId === 'M16') {
                    alert = `고아 노드 ${data.diagnosis.orphans.length}건 탐지`;
                  }
                  
                  return (
                    <tr key={m.id} className={`transition-colors ${rowClass}`}>
                      <td className={`p-4 border border-[#27272a] text-[13px] ${nameColor}`}>
                        <div className="flex items-center">
                            {isDev && <span className="animate-pulse mr-2 text-sm">🔥</span>}
                            {isLive && <span className="mr-2 text-sm">✅</span>}
                            {!isDev && !isLive && <span className="mr-2 text-sm opacity-50">⏳</span>}
                            {m.id}
                        </div>
                      </td>
                      <td className="p-4 border border-[#27272a] text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-mono text-[11px] font-bold w-8 text-[#fafafa]">{m.progress}%</span>
                          <div className="w-16 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                            <div className={`h-full ${isDev ? 'bg-[#60a5fa]' : isLive ? 'bg-[#4ade80]' : 'bg-[#52525b]'}`} style={{ width: `${m.progress}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 border border-[#27272a] text-center">
                        <button 
                            onClick={() => {
                                toggleFolder(group.name);
                            }}
                            className={`text-[11px] font-semibold hover:underline px-2 py-1 rounded transition-colors ${m.docsCount > 0 ? 'text-[#60a5fa] hover:text-[#fafafa] bg-[#60a5fa]/10' : 'text-[#52525b] bg-transparent cursor-default hover:no-underline'}`}
                        >
                        {m.docsCount > 0 ? `link / graph (${m.docsCount})` : '-'}
                        </button>
                      </td>
                      <td className="p-4 border border-[#27272a] text-center">
                         <button 
                            onClick={() => toggleFolder(group.name)}
                            className={`text-[11px] font-semibold hover:underline px-2 py-1 rounded transition-colors ${m.codeCount > 0 ? 'text-[#c084fc] hover:text-[#fafafa] bg-[#c084fc]/10' : 'text-[#52525b] bg-transparent cursor-default hover:no-underline'}`}
                        >
                        {m.codeCount > 0 ? `link / graph (${m.codeCount})` : '-'}
                        </button>
                      </td>
                      <td className="p-4 border border-[#27272a] text-[13px] text-[#d4d4d8] truncate max-w-[250px]" title={getInProgressTask(m)}>
                        {getInProgressTask(m)}
                      </td>
                      <td className="p-4 border border-[#27272a] text-[12px] text-[#f87171] font-semibold truncate max-w-[150px]">
                        {alert}
                      </td>
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommandCenter;
