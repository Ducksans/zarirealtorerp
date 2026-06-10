/*---
id: graphParser.ts
milestone: M0
why: 기본 구조 파일 (graphParser.ts)
backlinks: []
---*/

import fs from 'fs';
import path from 'path';

// 메모리 캐싱 (Node.js 서버 실행 중 유지)
let cachedGraphData: any = null;
let fileMapCache: Record<string, string> = {};

// 외부 NPM 모듈 의존성(gray-matter) 없이 자체 정규식 파서 구축 (안정성 보장)
const MILESTONE_NAMES: Record<string, string> = {
  'M0': 'M0: 비즈니스 모델 및 SSOT',
  'M1': 'M1: 인프라 및 DB 구축',
  'M2': 'M2: 인증 및 권한',
  'M3': 'M3: 조직 및 인사',
  'M4': 'M4: 매물 원장 관리',
  'M5': 'M5: 고객 원장 관리',
  'M6': 'M6: 계약 및 전자결재',
  'M7': 'M7: 클라우드 보관소',
  'M8': 'M8: 결제 및 계산서',
  'M9': 'M9: 통합 정산 모듈',
  'M10': 'M10: CRM 대시보드',
  'M11': 'M11: 일정 및 알림',
  'M12': 'M12: 마케팅 자동화',
  'M13': 'M13: B2C 고객 포털',
  'M14': 'M14: VR 임장 연동',
  'M15': 'M15: 스마트 명함',
  'M16': 'M16: 관제탑 (Neural Sync)',
  'M17': 'M17: 멘토링 및 오버라이딩'
};

function parseMetadata(content: string, ext: string) {
  let id = '';
  let title = '';
  let milestone = '';
  let type = '';
  let backlinks: string[] = [];

  if (ext === '.md') {
    // YAML Frontmatter 추출
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const yaml = match[1];
      const idMatch = yaml.match(/id:\s*(.+)/);
      const titleMatch = yaml.match(/title:\s*(.+)/);
      const milestoneMatch = yaml.match(/milestone:\s*(.+)/);
      const typeMatch = yaml.match(/type:\s*(.+)/);
      
      if (idMatch) id = idMatch[1].trim();
      if (titleMatch) title = titleMatch[1].trim();
      if (milestoneMatch) milestone = milestoneMatch[1].trim();
      if (typeMatch) type = typeMatch[1].trim();
    }
  } else if (ext === '.tsx' || ext === '.ts') {
    // 소스코드 내 JSDoc 추출
    const match = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (match) {
      const jsdoc = match[1];
      const idMatch = jsdoc.match(/@id\s+(.+)/);
      const titleMatch = jsdoc.match(/@why\s+(.+)/);
      const milestoneMatch = jsdoc.match(/@milestone\s+(.+)/);
      
      if (idMatch) id = idMatch[1].trim();
      if (titleMatch) title = titleMatch[1].trim();
      if (milestoneMatch) milestone = milestoneMatch[1].trim();
    }
  }

  // 시냅스(백링크) 연결 추출: [[문서명]] 형식
  const linkRegex = /\[\[(.*?)\]\]/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    let target = linkMatch[1].trim();
    target = target.replace('.md', '').replace('.tsx', '').replace('.ts', '');
    backlinks.push(target);
  }

  return { id, title, milestone, backlinks, type };
}

// 재귀적 디렉토리 탐색기 (블랙리스트 적용)
function walkDir(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (['node_modules', '.next', '.git', 'public', '.tempmediaStorage', 'scratch'].includes(file)) continue;
      walkDir(filePath, fileList);
    } else {
      if (file.endsWith('.md') || file.endsWith('.tsx') || file.endsWith('.ts')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

export function generateGraphData(forceRefresh = false) {
  if (cachedGraphData && Object.keys(fileMapCache).length > 0 && !forceRefresh) {
    return { graphData: cachedGraphData, fileMap: fileMapCache };
  }

  const artifactsPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\brain\\f109b2ff-b952-4b72-ad05-52ef5fdb2ad7\\artifacts';
  const srcPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\scratch\\erp_system\\src';

  const allFiles = [
    ...walkDir(artifactsPath),
    ...walkDir(srcPath)
  ];

  const nodes: any[] = [];
  const links: any[] = [];
  const fileMap: Record<string, string> = {};

  allFiles.forEach(filePath => {
    try {
      const ext = path.extname(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const stat = fs.statSync(filePath);
      const meta = parseMetadata(content, ext);
      
      // [UX FIX] 명시적인 @id가 없는 소스코드 파일은 배제
      if (!meta.id && ext !== '.md') return;

      const fileNameId = path.basename(filePath, ext);
      let finalId = meta.id || fileNameId;
      let finalTitle = meta.title || finalId;
      
      // 만약 프론트메터 title과 파일명이 동일하다면 언더바를 공백으로 치환하여 예쁘게 변경
      if (finalTitle === finalId || finalTitle === fileNameId) {
        finalTitle = finalTitle.replace(/^SEQ_\d+_/, '').replace(/_/g, ' ');
      }
      
      // 중복 ID 방지
      let attempt = 1;
      let originalId = finalId;
      while(nodes.find(n => n.id === finalId)) {
        finalId = `${originalId}_${attempt}`;
        attempt++;
      }

      let group = '신경망';
      if (filePath.includes('archive')) group = 'archive';
      else if (meta.type === 'docpack') group = 'docpack';
      else if (ext === '.ts' || ext === '.tsx') group = '컴포넌트';
      else if (meta.milestone) group = meta.milestone;

      let domain = 'Core';
      if (meta.milestone) {
        const mKey = meta.milestone.replace(/[^M0-9]/g, '');
        if (['M10', 'M11', 'M12', 'M15', 'M17'].includes(mKey)) domain = 'CRM';
        else if (['M13', 'M14'].includes(mKey)) domain = 'B2C'; // M14 VR 연동을 B2C로
        else if (/^M[1-9]$/.test(mKey)) domain = 'ERP';
        else if (meta.milestone.toLowerCase() === 'global') domain = 'Global';
      }
      if (group === 'archive') domain = 'Archive';

      let depth = 2; // Default (Code / Child)
      if (finalId === 'developer_master_book') depth = 0; // Global Master
      else if (meta.type === 'docpack') depth = 0.5; // Docpack
      else if (ext === '.md' && group !== 'archive') depth = 1; // Document Root

      fileMap[finalId] = filePath;
      fileMap[fileNameId] = filePath;

      // 계층형 구조(Hierarchy) 데이터 생성 (도메인 -> 마일스톤 중심 통합)
      let category = '📦 기타 (General)';
      if (group === 'archive') category = '🗄️ 아카이브 (연대기)';
      else {
        if (domain === 'Global') category = '🌐 Global (글로벌 마스터플랜)';
        else if (domain === 'Core') category = '🧠 Core (비즈니스 모델 및 관제)';
        else if (domain === 'ERP') category = '🏢 ERP (백오피스 구축)';
        else if (domain === 'CRM') category = '📈 CRM (영업지원 및 프롭테크)';
        else if (domain === 'B2C') category = '🌍 B2C (고객 포털 및 VR)';
      }

      let subCategory = '공통/기타 (General)';
      if (finalId === 'developer_master_book') {
        subCategory = '🌟 글로벌 마스터 인덱스';
      } else if (meta.milestone) {
        // M16 같은 마일스톤 코드가 있으면 무조건 해당 마일스톤 폴더로 종속
        const cleanM = meta.milestone.replace(/[^M0-9]/g, '');
        subCategory = MILESTONE_NAMES[cleanM] || `${meta.milestone} 마일스톤`;
      } else if (meta.type === 'docpack') {
        subCategory = '📦 에이전트용 문서팩 (Docpacks)';
      } else if (group === 'archive') {
        subCategory = '최근 결정 사항';
      } else if (ext === '.ts' || ext === '.tsx') {
        const parts = filePath.split(/[/\\]/);
        const parentDir = parts[parts.length - 2];
        if (parentDir) subCategory = `📁 ${parentDir} (공통 코드)`;
      }

      nodes.push({
        id: finalId,
        title: finalTitle,
        category,
        subCategory,
        group: group,
        domain: domain,
        ext: ext, // 추가: UI 렌더링 시 문서/코드 식별용
        depth: depth,
        type: meta.type, // BUG FIX: Sidebar에서 type 필터링을 위해 반드시 필요!
        milestone: meta.milestone,
        val: ext === '.md' ? 2 : 1,
        timestamp: stat.mtimeMs // 시간 속성 추가 (시계열 정렬용)
      });

      meta.backlinks.forEach(targetId => {
        // [UX FIX] 마스터 노드로 향하는 맹목적 링크(블랙홀 현상) 차단 (단, 문서팩은 글로벌 인덱스로 연결 허용)
        if (targetId === 'M16_Neural_Sync_Master') return;
        // 문서팩이 아닌 일반 파일이 developer_master_book을 직접 찌르는 것 방지
        if (targetId === 'developer_master_book' && meta.type !== 'docpack') return;
        links.push({
          source: finalId,
          target: targetId
        });
      });
    } catch (e) {
      console.error(`Failed to parse file: ${filePath}`, e);
    }
  });

  // 전체 노드 배열을 시계열 정렬
  nodes.sort((a, b) => a.timestamp - b.timestamp);

  // [UX FIX] 마일스톤별 시계열 진화 체인(Evolution Chain) 생성 (Patch Note / 변천사)
  const milestoneGroups: Record<string, any[]> = {};
  nodes.forEach(n => {
     if (n.id === 'M16_Neural_Sync_Master') return; // 마스터 노드는 제외
     
     const key = n.milestone || (n.group === 'archive' ? 'archive' : 'general');
     if (!milestoneGroups[key]) milestoneGroups[key] = [];
     milestoneGroups[key].push(n);
  });

  Object.keys(milestoneGroups).forEach(mKey => {
    const mNodes = milestoneGroups[mKey];
    // 이미 시간순 정렬됨
    if (mNodes.length > 0) {
      // 1. 해당 브랜치의 최초 노드(시발점)는 해당 마일스톤의 문서팩(Docpack) 혹은 글로벌 마스터로 연결
      const docpackNodeId = `${mKey}_Neural_Sync_Docpack`; // 예: M16_Neural_Sync_Docpack
      const rootTarget = nodes.find(n => n.id === docpackNodeId) ? docpackNodeId : 'developer_master_book';
      links.push({
        source: mNodes[0].id,
        target: rootTarget
      });
      // 2. 이후 노드들은 직전 시간대의 노드에 꼬리를 물어 '진화(Evolution)' 타임라인 형성
      for (let i = 1; i < mNodes.length; i++) {
        links.push({
          source: mNodes[i].id,
          target: mNodes[i-1].id
        });
      }
    }
  });

  const archiveNodes = nodes.filter(n => n.group === 'archive').sort((a, b) => b.timestamp - a.timestamp); // 나중 계산을 위해 역순 보존

  // [UX FIX] 최고 경영진 전용 브리핑 모드(CEO Mode) 데이터 파싱
  let commandCenter: any = {
    isCeoMode: true,
    diagnosis: { maturity: 0, errorRate: 0, insight: '' },
    milestones: [] as any[],
    briefing: {
      status: [] as string[],
      issue: [] as string[],
      decision: [] as string[],
      action: [] as string[]
    },
    dynamicContext: [] as { role: string, content: string, timestamp: string }[], // 실시간 대화 컨텍스트
    quickAccess: {}
  };

  try {
    const ceoPath = path.join(artifactsPath, 'ceo_briefing.md');
    if (fs.existsSync(ceoPath)) {
      const content = fs.readFileSync(ceoPath, 'utf8');
      const sections = content.split(/^# /m);
      
      sections.forEach(sec => {
        if (sec.includes('CHIEF OF STAFF BRIEFING')) {
          const lines = sec.split('\n');
          let currentMode = '';
          lines.forEach(l => {
            if (l.includes('[보고]')) currentMode = 'status';
            else if (l.includes('[쟁점]')) currentMode = 'issue';
            else if (l.includes('[하명 대기]')) currentMode = 'decision';
            else if (l.includes('[향후 계획]')) currentMode = 'action';
            else if (l.trim().startsWith('- ')) {
               const text = l.trim().replace(/^- /, '').trim();
               if (currentMode === 'status') commandCenter.briefing.status.push(text);
               if (currentMode === 'issue') commandCenter.briefing.issue.push(text);
               if (currentMode === 'decision') commandCenter.briefing.decision.push(text);
               if (currentMode === 'action') commandCenter.briefing.action.push(text);
            }
          });
        } else if (sec.includes('SELF-DIAGNOSIS')) {
          const lines = sec.split('\n');
          lines.forEach(l => {
            if (l.includes('에러율:')) commandCenter.diagnosis.errorRate = parseInt(l.split('에러율:')[1], 10);
            if (l.includes('트렌드:')) commandCenter.diagnosis.insight = l.split('트렌드:')[1]?.trim() || '';
          });
        }
      });
    } else {
      commandCenter.briefing.status = ['보고 데이터를 로드할 수 없습니다.'];
    }

    // [UX FIX] transcript.jsonl을 파싱하여 실시간 대화 맥락(Live Context) 추출
    const transcriptPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\brain\\f109b2ff-b952-4b72-ad05-52ef5fdb2ad7\\.system_generated\\logs\\transcript.jsonl';
    if (fs.existsSync(transcriptPath)) {
      const transcriptContent = fs.readFileSync(transcriptPath, 'utf8');
      const lines = transcriptContent.split('\n').filter(l => l.trim() !== '');
      const recentLines = lines.slice(-20); // 성능을 위해 최근 20개 로그만 추출
      
      const dynamicContext: { role: string, content: string, timestamp: string }[] = [];
      recentLines.forEach(line => {
        try {
          const data = JSON.parse(line);
          // 대표님의 입력과 금강(AI)의 플래닝 응답만 필터링
          if (data.type === 'USER_INPUT' || data.type === 'PLANNER_RESPONSE') {
            const role = data.source === 'USER_EXPLICIT' ? '덕산(대표)' : '금강(AI)';
            let content = data.content || '';
            
            // XML 태그 제거나 길이 제한 등 전처리
            content = content.replace(/<USER_REQUEST>/g, '').replace(/<\/USER_REQUEST>/g, '').trim();
            content = content.replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '').trim();
            if (content.length > 300) content = content.substring(0, 300) + '...';
            
            if (content) {
              dynamicContext.push({
                role,
                content,
                timestamp: data.created_at
              });
            }
          }
        } catch (e) {}
      });
      // 최신순으로 상위 4개 노출
      commandCenter.dynamicContext = dynamicContext.reverse().slice(0, 4);
    }

    const criteriaPath = path.join(artifactsPath, 'milestone_criteria.json');
    if (fs.existsSync(criteriaPath)) {
      const criteriaData = JSON.parse(fs.readFileSync(criteriaPath, 'utf8'));
      commandCenter.milestones = Object.keys(criteriaData).map(key => {
        const m = criteriaData[key];
        const total = m.criteria.length;
        const passed = m.criteria.filter((c:any) => c.status === 'PASS').length;
        const progress = total === 0 ? 0 : Math.round((passed / total) * 100);
        
        let status = 'PENDING';
        if (progress === 100) status = key === 'M16' ? 'LIVE' : 'COMPLETED';
        else if (progress > 0) status = 'IN_DEV';

        const milestoneKey = key; // M1
        const docsNodes = nodes.filter(n => (n.milestone === milestoneKey || n.subCategory?.includes(milestoneKey)) && n.category.includes('문서'));
        const codeNodes = nodes.filter(n => (n.milestone === milestoneKey || n.subCategory?.includes(milestoneKey)) && n.category.includes('코드'));

        return {
          id: `${key}: ${m.name}`,
          rawId: key,
          status: status,
          progress: progress,
          insight: m.insight || '',
          docsCount: docsNodes.length,
          codeCount: codeNodes.length,
          docsNodes: docsNodes,
          codeNodes: codeNodes,
          criteria: m.criteria // 10대 과제 요약용
        };
      });
      commandCenter.milestones.sort((a:any, b:any) => {
        const numA = parseInt(a.id.match(/\d+/)[0]);
        const numB = parseInt(b.id.match(/\d+/)[0]);
        return numA - numB;
      });

      // 전체 완숙도(Maturity) 자동 계산 (전체 마일스톤의 평균 진척도)
      if (commandCenter.milestones.length > 0) {
        const totalProgress = commandCenter.milestones.reduce((acc: number, m: any) => acc + m.progress, 0);
        commandCenter.diagnosis.maturity = Math.round(totalProgress / commandCenter.milestones.length);
      }

      // 최근 아카이브 추출 및 각 마일스톤별 히스토리 맵핑
      commandCenter.recentArchives = archiveNodes.slice(-5).reverse(); // 최신 5개 역순
      
      commandCenter.milestones.forEach((m: any) => {
        const milestoneKey = m.id.split('(')[0]; // "M3"
        // 해당 마일스톤과 연관된 아카이브 노드들 필터링
        m.history = archiveNodes.filter(node => node.milestone === milestoneKey || node.id.includes(milestoneKey)).sort((a,b) => b.timestamp - a.timestamp);
      });

    }
  } catch (e) {
    console.error("CEO Briefing 파싱 에러:", e);
  }

  // [UX FIX] 프로젝트 전체 진행도는 task.md 기반 유지 (그래프 프로그레스바용)
  let progress = 0;
  try {
    const taskPath = path.join(artifactsPath, 'task.md');
    if (fs.existsSync(taskPath)) {
      const taskContent = fs.readFileSync(taskPath, 'utf8');
      const allLines = taskContent.split('\\n').map(l => l.trim()).filter(l => l.match(/^- `?\\[[xX\\s\\/]\\]`?/));
      const completedTasks = allLines.filter(l => l.match(/\\[x\\]/i));
      if (allLines.length > 0) {
        progress = Math.round((completedTasks.length / allLines.length) * 100);
      }
    }
  } catch (e) {}

  // 퀵 액세스 (Quick Access) 노드 추출
  const plans = nodes.filter(n => n.id.includes('plan_') && n.group !== 'archive').sort((a,b) => b.timestamp - a.timestamp);
  const walkthroughs = nodes.filter(n => n.id.includes('walkthrough_') && n.group !== 'archive').sort((a,b) => b.timestamp - a.timestamp);
  
  if (plans.length > 0) commandCenter.quickAccess.latestPlan = plans[0];
  if (walkthroughs.length > 0) commandCenter.quickAccess.latestWalkthrough = walkthroughs[0];
  const ssotNode = nodes.find(n => n.id === 'Business_Model_and_SSOT');
  if (ssotNode) commandCenter.quickAccess.ssot = ssotNode;

  // 무결성 검증 엔진 (Integrity Radar) 계산
  const orphanNodes: string[] = [];
  const bottleneckNodes: {id: string, count: number}[] = [];

  nodes.forEach(n => {
    // 특수 목적 노드(마스터, 아카이브, 기획서 등)는 고아/병목 판정에서 제외
    if (n.id === 'M16_Neural_Sync_Master' || n.group === 'archive' || n.id.includes('plan_') || n.id.includes('walkthrough_')) return;
    
    const incomingLinks = links.filter(l => (typeof l.target === 'object' ? l.target.id : l.target) === n.id).length;
    const outgoingLinks = links.filter(l => (typeof l.source === 'object' ? l.source.id : l.source) === n.id).length;

    if (incomingLinks === 0 && outgoingLinks === 0) {
      orphanNodes.push(n.title || n.id);
    }
    // 의존성(들어오는 링크)이 5개 이상이면 병목으로 간주
    if (incomingLinks >= 5) {
      bottleneckNodes.push({ id: n.title || n.id, count: incomingLinks });
    }
  });

  commandCenter.diagnosis.orphans = orphanNodes;
  commandCenter.diagnosis.bottlenecks = bottleneckNodes;

  cachedGraphData = { nodes, links, progress, commandCenter };
  fileMapCache = fileMap;

  return { graphData: cachedGraphData, fileMap: fileMapCache };
}
