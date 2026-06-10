import React, { useEffect, useRef } from 'react';

const isMasterNode = (id: string) => id === 'developer_master_book';

interface SidebarProps {
  isLeftOpen: boolean;
  setIsLeftOpen: (open: boolean) => void;
  isLoading: boolean;
  graphData: any;
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  handleNodeClick: (node: any) => void;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isLeftOpen, setIsLeftOpen, isLoading, graphData, selectedNode, setSelectedNode, handleNodeClick, expandedFolders, toggleFolder
}) => {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [expandedSub, setExpandedSub] = React.useState<Record<string, boolean>>({});
  const [expandedL3, setExpandedL3] = React.useState<Record<string, boolean>>({});

  // --- Resize Handle State ---
  const [sidebarWidth, setSidebarWidth] = React.useState(320); // 초기 넓이를 320px으로 넉넉하게
  const isResizing = useRef(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    document.body.style.userSelect = 'none'; // 드래그 중 텍스트 선택 방지
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.body.style.userSelect = '';
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (isResizing.current) {
        setSidebarWidth(e.clientX);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const toggleSub = (sub: string) => {
    setExpandedSub(prev => ({ ...prev, [sub]: !prev[sub] }));
  };

  const toggleL3 = (key: string) => {
    setExpandedL3(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedNode]);

  const [searchQuery, setSearchQuery] = React.useState('');

  // 노드 계층형 그룹핑 및 글로벌 검색 (Domain -> subCategory -> Nodes)
  const groupedData = React.useMemo(() => {
    const data: Record<string, Record<string, any[]>> = {};
    if (!graphData?.nodes) return data;
    
    const filteredNodes = graphData.nodes.filter((n: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const textToSearch = `${n.id} ${n.title || ''} ${n.category || ''} ${n.subCategory || ''} ${n.group || ''}`.toLowerCase();
      return textToSearch.includes(q);
    });

    filteredNodes.forEach((n: any) => {
      const topLevel = n.category || '📦 기타 (General)';
      
      if (!data[topLevel]) data[topLevel] = {};
      if (!data[topLevel][n.subCategory]) data[topLevel][n.subCategory] = [];
      data[topLevel][n.subCategory].push(n);
    });
    return data;
  }, [graphData, searchQuery]);

  if (!isLeftOpen) {
    return (
      <div className="w-10 bg-[#09090b] border-r border-[#27272a] flex flex-col items-center py-4 cursor-pointer hover:bg-[#18181b] transition-colors" onClick={() => setIsLeftOpen(true)}>
        <span className="text-[#71717a] font-bold">▶</span>
      </div>
    );
  }

  const getSemanticTitle = (node: any, defaultKeyword: string, typeKeyword: string) => {
    let title = node.title || node.id;
    title = title.replace(/^SEQ_\d+_/, '').replace(/_/g, ' ');
    
    // 글로벌 마스터북 예외처리
    if (node.id === 'developer_master_book') return `🌟 글로벌 마스터 인덱스`;
    
    // 시맨틱 네이밍: [마일스톤][분류]
    let prefix = `[${defaultKeyword}][${typeKeyword}]`;
    
    // 시계열 문서에는 타임스탬프 강제 부착
    if (['archive', 'plan', 'checklist', 'walkthrough'].includes(node.type) || node.group === 'archive') {
       const d = new Date(node.timestamp || Date.now());
       const yy = String(d.getFullYear()).slice(-2);
       const mm = String(d.getMonth() + 1).padStart(2, '0');
       const dd = String(d.getDate()).padStart(2, '0');
       const hh = String(d.getHours()).padStart(2, '0');
       const min = String(d.getMinutes()).padStart(2, '0');
       const ss = String(d.getSeconds()).padStart(2, '0');
       prefix += `[${yy}-${mm}-${dd} ${hh}:${min}:${ss}]`;
    }
    
    return `${prefix} ${title}`;
  };

  const renderSubTree = (subCategories: Record<string, any[]>) => {
    return Object.entries(subCategories).map(([subName, nodes]) => {
      const isSubExpanded = searchQuery ? true : expandedSub[subName] !== false;
      
      // 마일스톤 키워드 자동 추출 (ex: 'M16: 관제탑 (Neural Sync)' -> '뉴럴싱크')
      let msKeyword = '공통';
      const mMatch = subName.match(/M\d+/);
      if (mMatch) {
         if (subName.includes('관제탑') || subName.includes('Neural Sync')) msKeyword = '뉴럴싱크';
         else msKeyword = subName.replace(/M\d+:\s*/, '').split(' ')[0];
      }

      return (
      <div key={subName} className="mt-1 pl-2 border-l border-[#27272a] ml-2 space-y-0.5">
        <button 
          onClick={() => toggleSub(subName)} 
          className="w-full text-left px-2 py-1.5 text-[11px] font-semibold text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] rounded transition-colors flex justify-between group"
        >
          <span className="group-hover:text-[#fafafa]">📁 {subName}</span>
          <span>{isSubExpanded ? '▼' : '▶'}</span>
        </button>
        {isSubExpanded && (() => {
          const masterNodes = nodes.filter((n: any) => n.id === 'developer_master_book');
          const docpackNodes = nodes.filter((n: any) => n.type === 'docpack');
          const taskNodes = nodes.filter((n: any) => n.type === 'checklist');
          const planNodes = nodes.filter((n: any) => n.type === 'plan');
          const walkthroughNodes = nodes.filter((n: any) => n.type === 'walkthrough');
          const archiveNodes = nodes.filter((n: any) => n.type === 'archive' || (n.depth === 1 && !['docpack','checklist','plan','walkthrough'].includes(n.type) && n.id !== 'developer_master_book')).sort((a:any, b:any) => a.timestamp - b.timestamp);
          const codeNodes = nodes.filter((n: any) => n.depth === 2 && n.group !== 'archive');

          const renderL3Folder = (folderLabel: string, typeKeyword: string, folderNodes: any[], colorClass: string) => {
            if (folderNodes.length === 0) return null;
            const folderKey = `${subName}-${folderLabel}`;
            const isL3Expanded = searchQuery ? true : expandedL3[folderKey] === true; // 기본 닫힘 (true면 열림)
            
            return (
              <div key={folderKey} className="mt-1 mb-1">
                <button 
                  onClick={() => toggleL3(folderKey)}
                  className={`w-full text-left px-2 py-1 text-[11px] font-bold ${colorClass} hover:brightness-150 transition-colors flex justify-between tracking-wide`}
                >
                  <span className="truncate">📂 [{msKeyword}][{typeKeyword}] {folderLabel}</span>
                  <span>{isL3Expanded ? '▼' : '▶'}</span>
                </button>
                {isL3Expanded && (
                  <div className="pl-3 mt-1 space-y-0.5 border-l border-[rgba(255,255,255,0.08)] ml-2 pb-1 animate-fade-in">
                    {folderNodes.map(node => renderNode(node, typeKeyword))}
                  </div>
                )}
              </div>
            );
          };

          const renderNode = (node: any, typeKeyword: string) => {
              const isSelected = selectedNode?.id === node.id;
              
              // 궁극의 시맨틱 타임스탬프 네이밍 생성!
              let displayName = getSemanticTitle(node, msKeyword, typeKeyword);

              let icon = '📄';
              if (node.ext === '.ts' || node.ext === '.tsx') icon = '🧩';
              if (node.ext === '.json') icon = '⚙️';
              if (node.type === 'docpack') icon = '📦';
              if (node.id === 'developer_master_book') icon = '🌟';
              if (typeKeyword === 'History') icon = '🕰️';
              if (typeKeyword === 'Code Files') icon = '💻';

              // 검색어 하이라이팅 처리
              let displayContent: any = displayName;
              if (searchQuery) {
                const parts = displayName.split(new RegExp(`(${searchQuery})`, 'gi'));
                displayContent = parts.map((part: string, i: number) => 
                  part.toLowerCase() === searchQuery.toLowerCase() ? <span key={i} className="bg-yellow-500/30 text-yellow-200 font-bold">{part}</span> : part
                );
              }

              return (
                <button
                  key={node.id}
                  ref={isSelected ? selectedRef : null}
                  onClick={() => handleNodeClick(node)}
                  className={`w-full text-left px-2 py-1.5 text-[12px] rounded transition-all truncate border ${isSelected ? 'bg-[#18181b] text-[#fafafa] font-medium border-[#3f3f46]' : 'border-transparent hover:bg-[#18181b] text-[#a1a1aa] hover:text-[#d4d4d8]'}`}
                  title={displayName}
                >
                  <span className="mr-1 opacity-80">{icon}</span> {displayContent}
                </button>
              );
          };

          return (
            <div className="pl-1 space-y-0 pb-1">
              {masterNodes.length > 0 && (
                <div className="mt-1 mb-1">
                   {masterNodes.map(n => renderNode(n, 'Global'))}
                </div>
              )}
              {renderL3Folder('단일 진실 공급원', 'SSOT', docpackNodes, 'text-green-400')}
              {renderL3Folder('작업 현황 체크리스트', 'Task', taskNodes, 'text-orange-400')}
              {renderL3Folder('기술 구현 기획안', 'Plan', planNodes, 'text-pink-400')}
              {renderL3Folder('완료 보고서 및 사후 분석', 'Walkthrough', walkthroughNodes, 'text-teal-400')}
              {renderL3Folder('의사결정 및 연대기', 'History', archiveNodes, 'text-[#58a6ff]')}
              {renderL3Folder('최종 산출물 소스코드', 'Code Files', codeNodes, 'text-[#a371f7]')}
            </div>
          );
        })()}
      </div>
    )});
  };

  // 그룹 렌더링 순서 강제 정의
  const groupOrder = [
    '🌐 Global (글로벌 마스터플랜)',
    '🧠 Core (비즈니스 모델 및 관제)',
    '🏢 ERP (백오피스 구축)',
    '📈 CRM (영업지원 및 프롭테크)',
    '🌍 B2C (고객 포털 및 VR)',
    '📦 기타 (General)',
    '🗄️ 아카이브 (연대기)'
  ];

  return (
    <div 
      className="bg-[#09090b] border-r border-[#27272a] flex flex-col z-20 shadow-2xl relative shrink-0"
      style={{ width: sidebarWidth, minWidth: '200px', maxWidth: '800px' }}
    >
      {/* 리사이즈 핸들 (드래그 바) */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#52525b] transition-colors z-30"
        title="드래그하여 크기 조절"
      />

      <div className="p-4 border-b border-[#27272a] flex justify-between items-center bg-[#09090b]">
        <div className="truncate">
          <h2 className="text-[13px] font-semibold text-[#fafafa] tracking-[0.15em] flex items-center gap-2 truncate">
            🧠 NEURAL SYNC
          </h2>
        </div>
        <button onClick={() => setIsLeftOpen(false)} className="text-[#71717a] hover:text-[#fafafa] shrink-0 ml-2 transition-colors">◀</button>
      </div>
      
      <div className="p-4 border-b border-[#27272a] flex flex-col gap-3">
          <button 
            onClick={() => setSelectedNode(null)}
            className={`w-full py-2.5 px-3 rounded text-[12px] font-semibold font-sans transition-all border ${!selectedNode ? 'bg-[#fafafa] text-[#09090b] border-[#fafafa]' : 'bg-[#18181b] text-[#a1a1aa] border-[#27272a] hover:bg-[#27272a] hover:text-[#fafafa]'}`}
          >
            ⎈ COMMAND CENTER
          </button>
          
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-[#71717a] text-[11px]">🔍</span>
            <input 
              type="text" 
              placeholder="Search everything..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-md outline-none text-[12px] text-[#fafafa] px-2 py-1.5 pl-8 focus:border-[#52525b] transition-colors placeholder-[#71717a]"
            />
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar select-none">
        {isLoading ? (
          <div className="text-xs text-gray-500 p-2 text-center mt-10 font-mono animate-pulse">Scanning Filesystem...</div>
        ) : (
          <div className="space-y-2">
            {groupOrder.map((groupName) => {
              if (!groupedData[groupName]) return null;

              // 도메인별 컬러 매핑
              let titleColor = 'text-gray-400';
              if (groupName.includes('Core')) titleColor = 'text-purple-400';
              if (groupName.includes('ERP')) titleColor = 'text-[#58a6ff]';
              if (groupName.includes('CRM')) titleColor = 'text-green-400';
              if (groupName.includes('B2C')) titleColor = 'text-yellow-400';

              const isFolderExpanded = searchQuery ? true : expandedFolders[groupName];

              return (
                <div key={groupName} className="mb-1">
                  <button 
                    onClick={() => toggleFolder(groupName)} 
                    className={`w-full flex items-center justify-between text-[13px] font-semibold ${titleColor} px-3 py-2 hover:bg-[#18181b] rounded-md transition-colors`}
                  >
                    <span className="truncate pr-2">{groupName}</span>
                    <span className="shrink-0 text-[10px] text-[#71717a]">{isFolderExpanded ? '▼' : '▶'}</span>
                  </button>
                  {isFolderExpanded && renderSubTree(groupedData[groupName])}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
