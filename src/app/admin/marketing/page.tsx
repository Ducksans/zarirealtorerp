/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';

export default function MarketingMockup() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState<Record<string, 'pending' | 'syncing' | 'success'>>({
    naver: 'pending',
    zigbang: 'pending',
    dabang: 'pending',
    instagram: 'pending',
    wordpress: 'pending'
  });

  const handlePublish = () => {
    setIsPublishing(true);
    const platforms = ['naver', 'zigbang', 'dabang', 'instagram', 'wordpress'];
    platforms.forEach(p => setStatus(prev => ({...prev, [p]: 'syncing'})));
    
    setTimeout(() => setStatus(prev => ({...prev, naver: 'success'})), 1000);
    setTimeout(() => setStatus(prev => ({...prev, zigbang: 'success'})), 1800);
    setTimeout(() => setStatus(prev => ({...prev, dabang: 'success'})), 2500);
    setTimeout(() => setStatus(prev => ({...prev, instagram: 'success'})), 3200);
    setTimeout(() => {
      setStatus(prev => ({...prev, wordpress: 'success'}));
      setIsPublishing(false);
    }, 4000);
  };

  const platforms = [
    { id: 'naver', name: '네이버 부동산', color: 'bg-green-500', icon: 'N' },
    { id: 'zigbang', name: '직방', color: 'bg-yellow-500', icon: 'Z' },
    { id: 'dabang', name: '다방', color: 'bg-blue-500', icon: 'D' },
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-500', icon: 'IG' },
    { id: 'wordpress', name: '자사 블로그', color: 'bg-slate-700', icon: 'W' },
  ];

  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen text-slate-200 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">원클릭 옴니채널 마케팅 전송</h1>
          <p className="text-slate-400">M12: 작성된 매물 브리핑을 모든 외부 플랫폼으로 단 한 번의 클릭에 동기화합니다.</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
            <div>
              <div className="inline-flex px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full mb-3">준비 완료</div>
              <h2 className="text-xl font-bold text-white">매물번호: JARI-2026-0609 (강남구 역삼동 하이엔드 오피스)</h2>
              <p className="text-sm text-slate-400 mt-1">사진 12장, 브리핑 텍스트 800자, 권리분석 리포트 포함</p>
            </div>
            <button 
              onClick={handlePublish}
              disabled={isPublishing || status.wordpress === 'success'}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-3 w-full md:w-auto justify-center"
            >
              {isPublishing ? '동기화 진행 중...' : status.wordpress === 'success' ? '전송 완료' : '🚀 모든 플랫폼에 즉시 배포'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {platforms.map(p => (
              <div key={p.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden group">
                {status[p.id] === 'success' && <div className="absolute inset-0 bg-emerald-500/10 z-0"></div>}
                
                <div className={`w-16 h-16 ${p.color} rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-4 relative z-10 group-hover:scale-110 transition-transform`}>
                  {p.icon}
                </div>
                <h3 className="font-semibold text-slate-300 relative z-10">{p.name}</h3>
                
                <div className="mt-6 relative z-10 w-full flex justify-center">
                  {status[p.id] === 'pending' && <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">대기 중</span>}
                  {status[p.id] === 'syncing' && <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-full border border-indigo-500/30 animate-pulse">업로드 중...</span>}
                  {status[p.id] === 'success' && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30 flex items-center gap-1 font-bold">✓ 동기화 완료</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
