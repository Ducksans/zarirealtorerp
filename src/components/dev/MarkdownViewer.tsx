import React, { useEffect, useState, useRef } from 'react';

interface MarkdownViewerProps {
  htmlContent: string;
  handleHtmlClick: (e: any) => void;
  selectedNode?: any;
  graphData?: any;
  onNavigateHome?: () => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const SCROLL_OFFSET = 48;

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ 
  htmlContent, handleHtmlClick, selectedNode, graphData, onNavigateHome 
}) => {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isClickScrolling = useRef(false);

  // ─── 1) DOM에서 heading ID 부여 + TOC 추출 ───
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (!contentRef.current) return;

      const headings = Array.from(
        contentRef.current.querySelectorAll('h1, h2, h3')
      ) as HTMLElement[];

      const newToc: TocItem[] = [];
      headings.forEach((heading, index) => {
        if (!heading.id) {
          heading.id = `toc-heading-${index}`;
        }
        newToc.push({
          id: heading.id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName[1], 10),
        });
      });

      setToc(newToc);
      if (newToc.length > 0) setActiveId(newToc[0].id);
    });

    return () => cancelAnimationFrame(rafId);
  }, [htmlContent]);

  // ─── 2) Scroll 이벤트 기반의 견고한 ScrollSpy ───
  useEffect(() => {
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content || toc.length === 0) return;

    // 모든 제목 요소를 id 속성 여부에 관계없이 가져옵니다. (이전에 id가 부여됨)
    const headings = Array.from(content.querySelectorAll('h1, h2, h3'));
    if (headings.length === 0) return;

    // 브라우저 네이티브 IntersectionObserver를 사용하여 스크롤 이벤트를 대체합니다.
    const observer = new IntersectionObserver(
      (entries) => {
        let lastVisibleId = '';
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            lastVisibleId = entry.target.id;
          }
        });

        // 사용자가 목차를 클릭해서 스크롤 중인 상태가 아니라면 활성 목차를 업데이트합니다.
        if (lastVisibleId && !isClickScrolling.current) {
          setActiveId(lastVisibleId);
        }
      },
      {
        root: container,
        // 상단 0% ~ 20% 구간에 들어오는 제목만 감지합니다.
        // 제목이 이 구간을 위로 벗어나면 교차 상태가 해제되지만, 
        // 새로운 제목이 들어올 때까지 이전 활성 목차를 유지합니다.
        rootMargin: '0px 0px -80% 0px',
        threshold: 0,
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => {
      observer.disconnect();
    };
  }, [htmlContent, toc]);

  // ─── 3) TOC 클릭 → 해당 소제목으로 이동 ───
  const scrollToHeading = (id: string) => {
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const heading = content.querySelector(`[id="${id}"]`) as HTMLElement | null;
    if (!heading) return;

    isClickScrolling.current = true;
    setActiveId(id);

    const containerRect = container.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();
    const targetScrollTop = container.scrollTop + (headingRect.top - containerRect.top) - SCROLL_OFFSET;

    container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });

    // 부드러운 스크롤 애니메이션 종료 후 click 모드 해제
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  // ─── Breadcrumbs (상단 네비게이션) ───
  let breadcrumbs = null;
  if (selectedNode) {
    breadcrumbs = (
      <nav className="mb-10 flex items-center text-[13px] font-medium text-[#71717a] overflow-x-auto whitespace-nowrap">
        <button onClick={onNavigateHome} className="hover:text-[#fafafa] transition-colors">Home</button>
        <span className="mx-2 text-[#3f3f46]">/</span>
        <button onClick={onNavigateHome} className="hover:text-[#fafafa] transition-colors">
          {selectedNode.domain || 'Domain'}
        </button>
        <span className="mx-2 text-[#3f3f46]">/</span>
        <button onClick={onNavigateHome} className="hover:text-[#fafafa] transition-colors">
          {selectedNode.category || selectedNode.subCategory || 'Category'}
        </button>
        <span className="mx-2 text-[#3f3f46]">/</span>
        <span className="text-[#fafafa]">{selectedNode.title || selectedNode.id}</span>
      </nav>
    );
  }

  // ─── Related Resources ───
  let relatedResources = null;
  if (selectedNode && graphData && graphData.links) {
    const relatedLinks = graphData.links.filter((l: any) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return sourceId === selectedNode.id || targetId === selectedNode.id;
    });

    const uniqueRelatedIds = new Set<string>();
    relatedLinks.forEach((l: any) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      if (sourceId !== selectedNode.id) uniqueRelatedIds.add(sourceId);
      if (targetId !== selectedNode.id) uniqueRelatedIds.add(targetId);
    });

    if (uniqueRelatedIds.size > 0) {
      relatedResources = (
        <div className="mt-20 pt-10 border-t border-[#27272a] clear-both">
          <h3 className="text-lg font-semibold text-[#fafafa] mb-6">Related Resources</h3>
          <ul className="list-none p-0 space-y-3">
            {Array.from(uniqueRelatedIds).map(id => {
               const tNode = graphData.nodes.find((n:any) => n.id === id);
               const displayTitle = tNode ? (tNode.title || tNode.id) : id;
               return (
                <li key={id} className="flex items-center group">
                  <svg className="w-4 h-4 mr-3 text-[#52525b] group-hover:text-[#fafafa] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <button 
                    className="text-[#d4d4d8] hover:text-[#fafafa] bg-transparent border-none cursor-pointer text-left text-[15px] p-0 transition-colors"
                    onClick={() => handleHtmlClick({ target: { classList: { contains: (c:string) => c === 'wiki-link' }, getAttribute: () => id } })}
                  >
                    {displayTitle}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  }

  return (
    // ★ 1) 가장 바깥 컨테이너는 전체 높이를 고정하고 넘치는 것을 숨깁니다.
    <div className="relative flex flex-row w-full h-full bg-[#09090b] overflow-hidden text-[#d4d4d8]">
      {/* ── 글로벌 타이포그래피 스타일 (Premium) ── */}
      <style dangerouslySetInnerHTML={{__html:`
        .markdown-body {
          font-family: var(--font-inter), sans-serif;
          color: #d4d4d8;
          line-height: 1.75;
          font-size: 1rem;
        }
        .markdown-body h1 { font-size: 2.25rem; margin-top: 1rem; margin-bottom: 2rem; font-weight: 600; color: #fafafa; letter-spacing: -0.03em; }
        .markdown-body h2 { font-size: 1.5rem; margin-top: 3.5rem; margin-bottom: 1.5rem; font-weight: 600; color: #fafafa; letter-spacing: -0.02em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;}
        .markdown-body h3 { font-size: 1.25rem; margin-top: 2.5rem; margin-bottom: 1rem; font-weight: 500; color: #f4f4f5; letter-spacing: -0.01em; }
        .markdown-body p { margin-bottom: 1.5rem; color: #a1a1aa; }
        .markdown-body ul { list-style-type: none; padding-left: 0; margin-bottom: 1.5rem; }
        .markdown-body ul li { position: relative; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #a1a1aa; }
        .markdown-body ul li::before { content: "•"; position: absolute; left: 0; color: #52525b; font-weight: bold; }
        .markdown-body code { background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 0.2em 0.4em; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.875em; color: #e4e4e7; }
        .markdown-body pre { background-color: #18181b; padding: 1.25rem; overflow-x: auto; font-size: 0.875em; line-height: 1.6; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 2rem; }
        .markdown-body pre code { background-color: transparent; border: none; padding: 0; color: #e4e4e7; font-size: 1em; }
        .markdown-body blockquote { padding: 1rem 1.5rem; color: #a1a1aa; border-left: 4px solid #3f3f46; margin-bottom: 2rem; background-color: #18181b; border-radius: 0 12px 12px 0; font-style: italic; }
        .markdown-body strong { font-weight: 600; color: #fafafa; }
        .markdown-body a { color: #fafafa; text-decoration: underline; text-underline-offset: 4px; decoration-color: #52525b; transition: all 0.2s; }
        .markdown-body a:hover { text-decoration-color: #fafafa; }
        .markdown-body table { border-collapse: collapse; width: 100%; margin-bottom: 2rem; font-size: 0.875rem; border-radius: 12px; overflow: hidden; }
        .markdown-body th, .markdown-body td { border: 1px solid #27272a; padding: 1rem; text-align: left; }
        .markdown-body th { background-color: #18181b; color: #fafafa; font-weight: 500; }
        .text-accent { color: #fafafa; }
      `}} />

      {/* ══ 2) 중앙 본문 영역 (본문 자체 독립 스크롤) ══ */}
      <div 
        ref={scrollContainerRef}
        className="md-scroll flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative h-full"
      >
        <div className="max-w-3xl mx-auto px-8 py-16">
          {breadcrumbs}
          <div
            ref={contentRef}
            className="markdown-body"
            onClick={handleHtmlClick}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          {relatedResources}
        </div>
      </div>

      {/* ══ 3) 우측 TOC 패널 (고정된 독립 영역) ══ */}
      <div className="md-scroll w-[280px] shrink-0 border-l border-[#27272a] bg-[#09090b] hidden lg:block overflow-y-auto h-full">
        <nav className="p-8">
          <h4 className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-[0.1em] mb-6">
            On this page
          </h4>
          <ul className="list-none p-0 m-0 border-l border-[#27272a] ml-1 pl-4 space-y-1 relative">
            {toc.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id} className="relative mb-[6px]">
                  <button
                    onClick={() => scrollToHeading(item.id)}
                    className={`block w-full text-left bg-transparent border-none cursor-pointer text-[13px] py-1 transition-all duration-200 ${
                      isActive ? 'text-[#fafafa] font-medium' : 'text-[#71717a] hover:text-[#d4d4d8]'
                    }`}
                    style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                  >
                    {item.text}
                  </button>
                  {/* 활성화된 항목 왼쪽의 깔끔한 선 */}
                  {isActive && (
                    <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 h-full py-1 w-[2px] bg-[#fafafa] rounded-full" />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MarkdownViewer;
