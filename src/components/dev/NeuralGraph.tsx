import React, { useEffect, useRef, useCallback } from 'react';

interface NeuralGraphProps {
  graphData: any;
  activeDomains: Record<string, boolean>;
  setActiveDomains: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isRightOpen: boolean;
  setIsRightOpen: (val: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
  selectedNode: any;
  handleNodeClick: (node: any) => void;
}

const NeuralGraph: React.FC<NeuralGraphProps> = ({
  graphData,
  activeDomains,
  setActiveDomains,
  isRightOpen,
  setIsRightOpen,
  isFullscreen,
  setIsFullscreen,
  selectedNode,
  handleNodeClick
}) => {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<any>(null);
  const selectedNodeRef = useRef<any>(selectedNode);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  const initGraph = useCallback(() => {
    // @ts-ignore
    if (!window.ForceGraph || (!graphContainerRef.current && !fullscreenContainerRef.current) || !graphData?.nodes || graphData.nodes.length === 0) return;
    
    if (!isRightOpen && !isFullscreen) return;

    const targetContainer = isFullscreen ? fullscreenContainerRef.current : graphContainerRef.current;
    if (!targetContainer) return;

    if (graphInstanceRef.current) {
      graphInstanceRef.current._destructor();
      targetContainer.innerHTML = '';
    }

    const getDomainHue = (domain: string) => {
      switch(domain) {
        case 'Core': return 280; // Purple
        case 'ERP': return 210; // Blue
        case 'CRM': return 150; // Green
        case 'B2C': return 35; // Orange/Yellow
        case 'Archive': return 0; // Gray/Monochrome
        default: return 280; // Core
      }
    };

    const getNodeColor = (node: any) => {
      if (node.domain === 'Archive') {
        return `hsl(0, 0%, 50%)`; // Gray
      }
      const hue = getDomainHue(node.domain);
      if (node.depth === 0) return `hsl(${hue}, 100%, 60%)`;
      if (node.depth === 0.5) return `hsl(${hue}, 90%, 58%)`;
      if (node.depth === 1) return `hsl(${hue}, 80%, 55%)`;
      return `hsl(${hue}, 50%, 40%)`;
    };

    // 1단계: 실재하는 노드 ID 목록 추출
    const existingNodeIds = new Set(graphData.nodes.map((n:any) => n.id));
    
    // 2단계: 양쪽 노드가 모두 존재하는 유효한 링크만 필터링
    const validLinks = graphData.links.filter((l:any) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return existingNodeIds.has(srcId) && existingNodeIds.has(tgtId);
    });

    // 3단계: 유효한 링크를 기반으로 노드 필터링 (진짜 고아 노드 제거)
    const filteredNodes = graphData.nodes.filter((n:any) => {
      if (!activeDomains[n.domain]) return false;
      
      // 선택된 노드는 무조건 표시
      if (selectedNodeRef.current && selectedNodeRef.current.id === n.id) return true;
      
      // 특수 목적 노드(마스터, 아카이브, 기획서 등)는 강제 표시
      if (n.id === 'M16_Neural_Sync_Master' || n.group === 'archive' || n.id.includes('plan_') || n.id.includes('walkthrough_')) return true;
      
      // 유효한 링크 배열(validLinks)을 기준으로 고아 검사
      const isOrphan = !validLinks.some((l:any) => 
        (typeof l.source === 'object' ? l.source.id : l.source) === n.id || 
        (typeof l.target === 'object' ? l.target.id : l.target) === n.id
      );
      
      return !isOrphan;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n:any) => n.id));
    
    // 4단계: 살아남은 노드들 간의 링크만 최종 렌더링 대상으로 확정
    const filteredLinks = validLinks.filter((l:any) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return filteredNodeIds.has(srcId) && filteredNodeIds.has(tgtId);
    });
    
    const renderData = { nodes: filteredNodes, links: filteredLinks };

    let hoverNode: any = null;
    const highlightNodes = new Set();
    const highlightLinks = new Set();

    // @ts-ignore
    graphInstanceRef.current = window.ForceGraph()(targetContainer)
      .graphData(renderData)
      .nodeId('id')
      .nodeCanvasObject((node: any, ctx: any, globalScale: number) => {
        const isMaster = node.depth === 0;
        const isDocpack = node.depth === 0.5;
        const isCoreDoc = node.depth === 1;
        
        const isHovered = hoverNode === node;
        const isHighlighted = hoverNode ? highlightNodes.has(node) : true;
        const globalAlpha = isHighlighted ? 1 : 0.1;

        // 글자 표출 로직 변경: 글로벌 줌 스케일이 1.5 이상일 때만 보이거나, 마스터/문서팩/마우스오버일 때
        const showText = ((globalScale > 1.2 && isHighlighted) || isMaster || isDocpack || isHovered) && isHighlighted;
        const baseColor = getNodeColor(node);
        
        const selected = selectedNodeRef.current;
        const isSelected = selected && selected.id === node.id;
        
        let is1stDegree = false;
        if (selected) {
            is1stDegree = renderData.links.some(
                (l: any) => (l.source.id === selected.id && l.target.id === node.id) || (l.target.id === selected.id && l.source.id === node.id)
            );
        }

        let alpha = globalAlpha;
        if (selected && !isSelected && !is1stDegree) {
            alpha = 0.05;
        } else if (hoverNode && !isHovered) {
            alpha = 0.1;
        }
        
        ctx.globalAlpha = alpha;

        // 맥박 효과 (선택 노드)
        if (isSelected) {
            const pulse = Math.abs(Math.sin(Date.now() / 600));
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8 + pulse * 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = `rgba(88, 166, 255, ${0.15 + pulse * 0.3})`;
            ctx.fill();
            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 텍스트 렌더링 (옵시디언 스타일)
        if (showText) {
          let label = node.title || node.id;
          // 평소에는 12자로 줄이고 마우스 오버시에만 다 보여줌
          if (!isHovered && label.length > 12) {
             label = label.substring(0, 12) + '...';
          }
          if (node.depth === 2 && !isHovered) label = label.split('.')[0]; // 확장자 떼기

          const fontSize = (isMaster ? 18 : (isDocpack ? 14 : (isHovered ? 14 : 10))) / globalScale;
          ctx.font = `${isMaster || isDocpack || isHovered || isSelected ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 검은색 두꺼운 그림자로 배경 선 가리기 (fillRect 대신)
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 8 / globalScale; // 텍스트 주변에 강한 검은 그림자 (가독성 향상)
          
          // 여러 번 겹쳐 그려서 외곽선을 강하게 (옵시디언 꼼수)
          ctx.lineWidth = 3 / globalScale;
          ctx.strokeStyle = '#010409'; 
          ctx.strokeText(label, node.x, node.y + (isMaster ? 16 : (isDocpack ? 13 : 10))/globalScale);

          ctx.shadowBlur = 0; // 초기화
          ctx.fillStyle = isMaster || isDocpack || isHovered ? baseColor : (node.depth === 2 ? '#8b949e' : '#c9d1d9');
          ctx.fillText(label, node.x, node.y + (isMaster ? 16 : (isDocpack ? 13 : 10))/globalScale);
        }

        // 노드 원 그리기
        ctx.beginPath();
        const nodeSize = isMaster ? 9 / globalScale : (isDocpack ? 6 / globalScale : (isCoreDoc ? 4.5 / globalScale : 2.5 / globalScale));
        ctx.arc(node.x, node.y, nodeSize + (isHovered ? 2/globalScale : 0), 0, 2 * Math.PI, false);
        
        ctx.fillStyle = baseColor;
        if (isMaster || isDocpack || isHovered) {
           ctx.shadowColor = baseColor;
           ctx.shadowBlur = (isHovered ? 30 : 15) / globalScale;
        } else {
           ctx.shadowBlur = 0;
        }
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      })
      .nodePointerAreaPaint((node: any, color: string, ctx: any) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
        ctx.fill();
      })
      .linkColor((link:any) => {
        const isHighlighted = hoverNode ? highlightLinks.has(link) : false;
        // 평상시 은은하게 (0.1), 하이라이트시 레이저처럼 발광(0.8), 나머지 어둡게(0.02)
        const alpha = isHighlighted ? 0.9 : (hoverNode ? 0.02 : 0.15);
        const sourceColor = getNodeColor(link.source);
        return sourceColor.replace('hsl', 'hsla').replace(')', `, ${alpha})`); 
      })
      .linkWidth((link:any) => {
        const isHighlighted = hoverNode ? highlightLinks.has(link) : false;
        return isHighlighted ? 2.5 : (link.source.depth === 0 || link.target.depth === 0 ? 1.5 : 0.8);
      })
      .backgroundColor('#09090b')
      .width(targetContainer.clientWidth)
      .height(targetContainer.clientHeight)
      .onNodeHover((node: any) => {
        highlightNodes.clear();
        highlightLinks.clear();
        if (node) {
          highlightNodes.add(node);
          renderData.links.forEach((link: any) => {
            if (link.source.id === node.id || link.target.id === node.id) {
              highlightLinks.add(link);
              highlightNodes.add(link.source);
              highlightNodes.add(link.target);
            }
          });
        }
        hoverNode = node || null;
      })
      .onNodeDrag((node: any) => {
        highlightNodes.clear();
        highlightLinks.clear();
        if (node) {
          highlightNodes.add(node);
          renderData.links.forEach((link: any) => {
            if (link.source.id === node.id || link.target.id === node.id) {
              highlightLinks.add(link);
              highlightNodes.add(link.source);
              highlightNodes.add(link.target);
            }
          });
        }
        hoverNode = node || null;
      })
      .onNodeDragEnd((node: any) => {
        node.fx = node.x;
        node.fy = node.y;
      })
      .onNodeClick((node: any) => {
        handleNodeClick(node);
        graphInstanceRef.current.centerAt(node.x, node.y, 1000);
        graphInstanceRef.current.zoom(node.depth === 0 || node.depth === 0.5 ? 4 : 6, 2000);
      });
      
    // 물리 엔진(Force Simulation) 튜닝 - 옵시디언처럼 넓게 퍼지게
    graphInstanceRef.current.d3Force('charge').strength(-250); // 노드 간 척력 팍 높임
    graphInstanceRef.current.d3Force('link').distance(70); // 링크 기본 길이 넓힘
    
    setTimeout(() => {
      if (graphInstanceRef.current) {
        graphInstanceRef.current.zoom(1.2, 2000);
      }
    }, 500);

  }, [graphData, isFullscreen, isRightOpen, activeDomains]);

  useEffect(() => {
    const handleResize = () => {
      const targetContainer = isFullscreen ? fullscreenContainerRef.current : graphContainerRef.current;
      if (graphInstanceRef.current && targetContainer) {
        graphInstanceRef.current.width(targetContainer.clientWidth);
        graphInstanceRef.current.height(targetContainer.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  useEffect(() => {
    initGraph();
  }, [graphData, initGraph, isFullscreen, isRightOpen, activeDomains]);

  const GraphLegend = () => (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 bg-[#09090b]/90 p-4 rounded-xl border border-[#27272a] backdrop-blur-xl shadow-2xl">
      <div className="text-[10px] font-bold text-[#a1a1aa] font-mono mb-2">🌌 THE NARRATIVE LEGEND</div>
      {[
        { key: 'Core', label: '🧠 Core (관제/비즈)', color: 'bg-purple-500' },
        { key: 'ERP', label: '🏢 ERP (백오피스)', color: 'bg-blue-500' },
        { key: 'CRM', label: '📈 CRM (프롭테크)', color: 'bg-green-500' },
        { key: 'B2C', label: '🌍 B2C (고객 포털)', color: 'bg-orange-500' },
        { key: 'Archive', label: '🗄️ 타임라인 아카이브', color: 'bg-gray-500' }
      ].map(domain => (
        <label key={domain.key} className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={activeDomains[domain.key]} 
            onChange={() => setActiveDomains(prev => ({...prev, [domain.key]: !prev[domain.key]}))}
            className="hidden"
          />
          <div className={`w-3 h-3 rounded-full ${domain.color} transition-all duration-300 ${activeDomains[domain.key] ? 'shadow-[0_0_8px_currentColor] scale-110' : 'opacity-20 scale-90'}`}></div>
          <span className={`text-xs font-bold transition-colors ${activeDomains[domain.key] ? 'text-gray-200' : 'text-gray-600'}`}>{domain.label}</span>
        </label>
      ))}
    </div>
  );

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#09090b]">
          <div ref={fullscreenContainerRef} className="w-full h-full absolute inset-0"></div>
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 z-50 bg-[#18181b] hover:bg-[#27272a] text-[#FFD700] px-4 py-2 rounded-lg font-bold shadow-lg border border-[#FFD700]/30 transition-all"
          >
            ✕ 은하수 닫기
          </button>
          <div className="absolute top-6 left-6 z-50 bg-black/70 px-4 py-2 rounded-lg border border-[#FFD700]/30 text-[#FFD700] font-mono text-sm backdrop-blur-sm pointer-events-none shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            🌟 THE NARRATIVE UNIVERSE
          </div>
          <GraphLegend />
        </div>
      )}

      {isRightOpen && (
        <div className="w-1/2 bg-[#09090b] relative flex flex-col shadow-2xl">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-[#09090b]/80 px-3 py-1.5 rounded-lg text-xs border border-[#27272a] text-[#FFD700] backdrop-blur-md shadow-lg pointer-events-none font-semibold tracking-wide">
              🌌 Timeline Narrative
            </div>
          </div>
          <GraphLegend />
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
              onClick={() => setIsFullscreen(true)}
              className="bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] px-3 py-1.5 rounded-lg text-[12px] border border-[#27272a] shadow-lg transition-colors flex items-center gap-1 font-medium"
            >
              ⛶ Fullscreen
            </button>
            <button 
              onClick={() => setIsRightOpen(false)}
              className="bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] px-3 py-1.5 rounded-lg text-[12px] border border-[#27272a] shadow-lg transition-colors font-medium"
            >
              ▶ Hide
            </button>
          </div>
          <div ref={graphContainerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing"></div>
        </div>
      )}
      
      {/* 피드백 반영: 우주 열기 버튼 임시 숨김 */}
      {false && !isRightOpen && (
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={() => setIsRightOpen(true)}
            className="bg-[#21262d] hover:bg-[#30363d] text-white px-4 py-2 rounded-lg shadow-lg border border-[#484f58] flex items-center gap-2 font-bold transition-transform hover:scale-105"
          >
            🌌 우주 열기 ◀
          </button>
        </div>
      )}
    </>
  );
};

export default NeuralGraph;
