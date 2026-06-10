const fs = require('fs');
const path = require('path');

const pagePath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\scratch\\erp_system\\src\\app\\dev\\page.tsx';
let content = fs.readFileSync(pagePath, 'utf-8');

// 1. Add selectedNodeRef to prevent stale closures without full re-render
if (!content.includes('selectedNodeRef')) {
    content = content.replace(
        'const [selectedNode, setSelectedNode] = useState<any>(null);',
        'const [selectedNode, _setSelectedNode] = useState<any>(null);\n  const selectedNodeRef = useRef<any>(null);\n  const setSelectedNode = (node: any) => {\n    _setSelectedNode(node);\n    selectedNodeRef.current = node;\n  };'
    );
}

// 2. Modify nodeCanvasObject
const graphLogicRegex = /ctx\.globalAlpha = globalAlpha;[\s\S]*?ctx\.fillRect\(node\.x - bckgDimensions\[0\] \/ 2, node\.y - 12 - bckgDimensions\[1\] \/ 2, bckgDimensions\[0\], bckgDimensions\[1\]\);/m;

const newGraphLogic = `
        const selected = selectedNodeRef.current;
        const isSelected = selected && selected.id === node.id;
        
        let is1stDegree = false;
        if (selected) {
            is1stDegree = renderData.links.some(
                (l: any) => (l.source.id === selected.id && l.target.id === node.id) || (l.target.id === selected.id && l.source.id === node.id)
            );
        }

        // Q7: 암전 로직 (선택 노드 기준)
        let alpha = globalAlpha;
        if (selected && !isSelected && !is1stDegree) {
            alpha = 0.05;
        } else if (hoverNode && !isHovered) {
            alpha = 0.1;
        }
        
        ctx.globalAlpha = alpha;

        // Q7: 점멸(Glowing) 로직
        if (isSelected) {
            const pulse = Math.abs(Math.sin(Date.now() / 600)); // slow pulse
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8 + pulse * 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = \`rgba(88, 166, 255, \${0.15 + pulse * 0.3})\`;
            ctx.fill();
            
            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (showText) {
          // 이름표를 깔끔하게 다듬기
          let label = node.title || node.id;
          if (node.depth === 2 && !isHovered) label = label.split('.')[0];
          if (label.length > 20 && !isHovered) label = label.substring(0, 20) + '...';

          const fontSize = (isMaster ? 22 : (isHovered ? 16 : 12)) / globalScale;
          ctx.font = \`\${isMaster || isHovered || isSelected ? 'bold ' : ''}\${fontSize}px Sans-Serif\`;
          
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);
          
          if (isMaster || isHovered || isSelected) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = (isHovered || isSelected ? 30 : 25) / globalScale;
          }

          ctx.fillStyle = isMaster || isHovered || isSelected ? \`hsla(\${getDomainHue(node.domain)}, 100%, 60%, 0.15)\` : 'rgba(1, 4, 9, 0.8)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - 12 - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
`;
content = content.replace(graphLogicRegex, newGraphLogic);

// 3. Fix Frontmatter UI (Q6)
const oldFrontmatterRegex = /let frontmatterHtml = '';[\s\S]*?frontmatterHtml = `<div class="mb-6 p-4 bg-\[#161b22\] border border-\[#30363d\] rounded-lg shadow-sm">[\s\S]*?<\/div>`;\n\s*}\n\s*}/m;
const newFrontmatterHtml = `
        let frontmatterHtml = '';
        if (content.startsWith('---')) {
          const endIdx = content.indexOf('---', 3);
          if (endIdx !== -1) {
            const fmText = content.substring(3, endIdx).trim();
            content = content.substring(endIdx + 3).trim();
            
            const fmLines = fmText.split('\\n');
            let mainBadges = '';
            let hiddenBadges = '';
            
            fmLines.forEach(line => {
              const colonIdx = line.indexOf(':');
              if (colonIdx !== -1) {
                const key = line.substring(0, colonIdx).trim().replace(/['"]/g, '');
                const val = line.substring(colonIdx + 1).trim().replace(/['"]/g, '');
                if (key === 'backlinks') return;
                
                const badgeHtml = \`<span class="inline-flex items-center rounded-md bg-blue-900/20 px-2 py-1 text-[11px] font-semibold text-[#58a6ff] ring-1 ring-inset ring-blue-500/30 mr-2 mb-2">
                                     <span class="mr-1.5 text-blue-300/50 uppercase text-[9px] tracking-wider">\${key}</span> \${val}
                                   </span>\`;
                                   
                if (key.toLowerCase() === 'milestone' || key.toLowerCase() === 'why') {
                  mainBadges += badgeHtml;
                } else {
                  hiddenBadges += badgeHtml;
                }
              }
            });
            
            frontmatterHtml = \`
              <div class="mb-8 pb-4 border-b border-[#30363d]/50">
                <div class="flex flex-wrap mb-2">\${mainBadges}</div>
                \${hiddenBadges ? \`
                <details class="group">
                  <summary class="cursor-pointer text-[10px] font-bold text-gray-500 hover:text-gray-300 uppercase tracking-wider font-mono list-none flex items-center mt-1">
                    <svg class="w-3 h-3 mr-1 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    MORE METADATA
                  </summary>
                  <div class="flex flex-wrap mt-3 pl-4 border-l-2 border-[#30363d]">\${hiddenBadges}</div>
                </details>
                \` : ''}
              </div>
            \`;
          }
        }
`;
content = content.replace(oldFrontmatterRegex, newFrontmatterHtml.trim());

// 4. Implement System Lock for Orphans (Q5)
if (!content.includes('Orphan System Lock')) {
    const mainReturnRegex = /return \([\s\S]*?<div className="h-screen w-full/m;
    const sysLockHtml = `
  // Orphan System Lock (Q5)
  if (graphData?.commandCenter?.diagnosis?.orphans?.length > 0) {
    return (
      <div className="h-screen w-full bg-[#0d1117] text-white flex flex-col items-center justify-center p-8">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 max-w-2xl text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
          <div className="text-5xl mb-4">🚨</div>
          <h1 className="text-3xl font-black text-red-400 mb-4 tracking-tighter">INTEGRITY LOCKDOWN</h1>
          <p className="text-gray-300 mb-6 text-lg">
            고아 노드(Orphan Node)가 <strong>{graphData.commandCenter.diagnosis.orphans.length}개</strong> 발견되어 시스템이 보호 모드로 전환되었습니다.
          </p>
          <div className="bg-black/50 rounded p-4 mb-6 text-left border border-red-500/30 text-sm font-mono text-red-300 max-h-40 overflow-y-auto">
            {graphData.commandCenter.diagnosis.orphans.map((o: any, idx: number) => (
              <div key={idx} className="mb-1">• {o.id}</div>
            ))}
          </div>
          <p className="text-gray-400 text-sm">
            Neural Sync 절대 규범(Pass/Fail)에 의거하여, 에이전트의 신규 코딩이 전면 차단됩니다.<br/>
            모든 문서를 <code>backlinks</code>로 연결한 후 새로고침 하십시오.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full`;
    content = content.replace(/return \(\s*<div className="h-screen w-full/m, sysLockHtml);
}

fs.writeFileSync(pagePath, content, 'utf-8');
console.log('page.tsx successfully patched.');
