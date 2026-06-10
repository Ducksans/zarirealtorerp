/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

/**
 * @id DevDashboardMain
 * @milestone M16
 * @why 조율 드리프트 방지를 위해 최신 기획안과 결과를 즉시 열람할 수 있는 퀵 액세스 핫키 추가
 * @backlinks [[plan_drift_prevention_quick_access.md]]
 */
'use client';
import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

import CommandCenter from '@/components/dev/CommandCenter';
import Sidebar from '@/components/dev/Sidebar';
import MarkdownViewer from '@/components/dev/MarkdownViewer';
import NeuralGraph from '@/components/dev/NeuralGraph';

export default function DevDashboard() {
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [], progress: 0, commandCenter: null });
  const [selectedNode, _setSelectedNode] = useState<any>(null);
  const selectedNodeRef = useRef<any>(null);
  
  const setSelectedNode = (node: any) => {
    _setSelectedNode(node);
    selectedNodeRef.current = node;
  };

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeDomains, setActiveDomains] = useState<Record<string, boolean>>({
    'Core': true, 'ERP': true, 'CRM': true, 'B2C': true, 'Archive': true
  });

  useEffect(() => {
    fetch('/api/neural-sync/graph')
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("그래프 데이터 로드 실패:", err);
        setIsLoading(false);
      });
  }, []);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    setHtmlContent('<h2>⏳ 파일 원문을 로딩 중입니다...</h2>');
    
    if (isFullscreen) setIsFullscreen(false);
    if (!isLeftOpen && !isRightOpen) setIsLeftOpen(true);

    fetch(`/api/neural-sync/file?id=${node.id}`)
      .then(res => res.json())
      .then(data => {
        let content = data.content || '';
        
        let frontmatterHtml = '';
        if (content.startsWith('---')) {
          const endIdx = content.indexOf('---', 3);
          if (endIdx !== -1) {
            const fmText = content.substring(3, endIdx).trim();
            content = content.substring(endIdx + 3).trim();

            // [가독성 개편] 키-값 칩 나열 대신 정돈된 문서 헤더 카드로 렌더링
            const fm: Record<string, string> = {};
            fmText.split('\n').forEach((line: string) => {
              const colonIdx = line.indexOf(':');
              if (colonIdx === -1) return;
              const key = line.substring(0, colonIdx).trim().replace(/['"]/g, '');
              fm[key] = line.substring(colonIdx + 1).trim().replace(/['"]/g, '');
            });

            const chip = (label: string, val?: string, cls = 'bg-slate-800/60 text-slate-300 ring-slate-600/40') =>
              val ? `<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ring-1 ring-inset ${cls}">
                       <span class="opacity-60 uppercase text-[10px] tracking-wider">${label}</span>${val}
                     </span>` : '';

            const chips = [
              chip('마일스톤', fm.milestone, 'bg-indigo-500/10 text-indigo-300 ring-indigo-500/30'),
              chip('유형', fm.type, 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'),
              chip('작성일', fm.date),
              chip('ID', fm.id),
            ].filter(Boolean).join('');

            const whyBlock = fm.why
              ? `<p class="mt-4 text-[14px] leading-relaxed text-slate-400 border-l-2 border-slate-600 pl-3">
                   <span class="font-semibold text-slate-300">작성 목적</span> · ${fm.why}
                 </p>`
              : '';

            frontmatterHtml = `<div class="mb-10 pb-6 border-b border-white/10">
                                 <div class="flex flex-wrap gap-2">${chips}</div>
                                 ${whyBlock}
                               </div>`;
          }
        }
        
        content = content.replace(/\[\[(.*?)\]\]/g, (match: string, p1: string) => {
          const linkId = p1.replace('.md', '').trim();
          return `<button class="wiki-link bg-blue-900/20 text-[#58a6ff] hover:text-white hover:bg-blue-600/50 px-1 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer border border-[#58a6ff]/30" data-id="${linkId}">[[${p1}]]</button>`;
        });

        // [가독성 개편] GitHub식 [!NOTE] 인용구를 색상 콜아웃 박스로 변환
        const applyCallouts = (html: string) => {
          const STYLES: Record<string, { icon: string; label: string; cls: string }> = {
            NOTE:      { icon: '📘', label: '참고',  cls: 'callout-note' },
            TIP:       { icon: '💡', label: '팁',    cls: 'callout-tip' },
            IMPORTANT: { icon: '📌', label: '중요',  cls: 'callout-important' },
            WARNING:   { icon: '⚠️', label: '경고',  cls: 'callout-warning' },
            CAUTION:   { icon: '🚨', label: '주의',  cls: 'callout-caution' },
          };
          return html.replace(
            /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br\s*\/?>)?/g,
            (_m, kind: string) => {
              const s = STYLES[kind];
              return `<blockquote class="callout ${s.cls}"><p><span class="callout-label">${s.icon} ${s.label}</span>`;
            }
          );
        };

        // @ts-ignore
        if (window.marked) {
          // @ts-ignore
          setHtmlContent(frontmatterHtml + applyCallouts(window.marked.parse(content)));
        } else {
          setHtmlContent(frontmatterHtml + `<pre style="white-space: pre-wrap;">${content}</pre>`);
        }
      })
      .catch(err => {
        setHtmlContent(`<h2>🚨 로드 에러</h2><p>${err.message}</p>`);
      });
  };

  const toggleFolder = (folder: string) => {
    // CommandCenter에서 'core' / 'code' 버튼을 누른 경우의 예외 처리 (매핑)
    if (folder === 'core') folder = '🧠 Core (비즈니스 모델 및 관제)';
    if (folder === 'code') folder = '🏢 ERP (백오피스 구축)'; // 임시 매핑

    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleHtmlClick = (e: any) => {
    if (e.target && e.target.classList.contains('wiki-link')) {
      const linkId = e.target.getAttribute('data-id');
      const targetNode = graphData.nodes.find((n:any) => n.id === linkId || n.id === linkId + '.md');
      if (targetNode) {
        handleNodeClick(targetNode);
      } else {
        alert(`해당 문서([${linkId}])를 찾을 수 없거나 그래프에 아직 반영되지 않았습니다.`);
      }
    }
  };

  return (
    <>
      <Script src="https://unpkg.com/force-graph" strategy="lazyOnload" />
      <Script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" strategy="lazyOnload" />

      <div className="flex h-[calc(100vh-3.5rem)] bg-[#09090b] text-[#d4d4d8] font-sans overflow-hidden">
        
        <Sidebar 
          isLeftOpen={isLeftOpen}
          setIsLeftOpen={setIsLeftOpen}
          isLoading={isLoading}
          graphData={graphData}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          handleNodeClick={handleNodeClick}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
        />

        <div className="flex-1 flex flex-col relative min-w-0 bg-[#09090b] h-full">
          <div className="h-14 min-h-[3.5rem] bg-[#09090b]/60 backdrop-blur-xl border-b border-white/5 flex items-center px-6 shrink-0 z-10">
            <div className="flex-1 flex items-center gap-4">
              <span className="text-xs font-bold text-gray-400">REAL-TIME MILESTONE PROGRESS</span>
              <div className="flex-1 h-2.5 bg-[#21262d] rounded-full overflow-hidden border border-[#30363d] shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${graphData.progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-mono font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                {graphData.progress}% PASS
              </span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            
            <div className={`flex flex-col relative overflow-hidden h-full ${isRightOpen ? 'w-1/2 border-r border-[#27272a]' : 'w-full'}`}>
              {!selectedNode ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-8">
                  <CommandCenter data={graphData.commandCenter} onSelectNode={handleNodeClick} toggleFolder={toggleFolder} />
                </div>
              ) : (
                <MarkdownViewer htmlContent={htmlContent} handleHtmlClick={handleHtmlClick} selectedNode={selectedNode} graphData={graphData} onNavigateHome={() => setSelectedNode(null)} />
              )}
            </div>

            <NeuralGraph 
              graphData={graphData}
              activeDomains={activeDomains}
              setActiveDomains={setActiveDomains}
              isRightOpen={isRightOpen}
              setIsRightOpen={setIsRightOpen}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              selectedNode={selectedNode}
              handleNodeClick={handleNodeClick}
            />

          </div>
        </div>
      </div>
    </>
  );
}
