'use client';

import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { toastSuccess } from '@/lib/toast';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const COLUMNS = [
  { id: 'NEW', title: '신규 지원', color: 'border-slate-500' },
  { id: 'RECRUITER', title: '담당자 배정', color: 'border-blue-500' },
  { id: 'PRACTICAL', title: '실무진 면접', color: 'border-amber-500' },
  { id: 'MANAGER', title: '관리자 면접', color: 'border-orange-500' },
  { id: 'FINAL', title: '최종 승인 대기', color: 'border-emerald-500' },
];

export default function ATSKanbanBoard() {
  const { data: candidates, error, mutate } = useSWR('/api/ats', fetcher, { suspense: true });

  const moveCandidate = async (id: string, currentStageIndex: number) => {
    if (currentStageIndex >= COLUMNS.length - 1) {
      toastSuccess('최종 승인이 완료되어 정식 온보딩(마일스톤 5) 파이프라인으로 이관됩니다.');
      return;
    }
    const nextStage = COLUMNS[currentStageIndex + 1].id;
    
    // Optimistic update
    mutate(candidates.map((c: any) => c.id === id ? { ...c, stage: nextStage } : c), false);
    
    await fetch(`/api/ats/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage })
    });
    mutate();
  };

  if (error) return <div className="p-10 text-red-400">데이터 로드 실패</div>;
  if (!candidates) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 p-6 lg:p-10 font-sans overflow-x-hidden">
      
      {/* Header */}
      <div className="max-w-[1800px] mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
            <span className="text-emerald-500">🎯</span> ATS (Applicant Tracking System)
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            전국 1만 명 영업진 달성을 위한 대규모 채용 파이프라인 칸반 보드입니다.
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-slate-300">
            진행 중인 채용: <span className="font-bold text-white">{candidates.length}명</span>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors">
            채용 공고 관리
          </button>
        </div>
      </div>

      {/* Kanban Board Layout */}
      <div className="max-w-[1800px] mx-auto overflow-x-auto pb-8">
        <div className="flex gap-6 min-w-max">
          
          {COLUMNS.map((column, colIndex) => (
            <div key={column.id} className="w-[320px] bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col h-[750px] shadow-2xl">
              
              {/* Column Header */}
              <div className={`p-4 border-b-2 ${column.color} bg-slate-900/80 rounded-t-2xl flex justify-between items-center`}>
                <h2 className="font-bold text-white text-sm tracking-wide">{column.title}</h2>
                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono">
                  {candidates.filter((c: any) => c.stage === column.id).length}
                </span>
              </div>

              {/* Candidates List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                {candidates
                  .filter((c: any) => c.stage === column.id)
                  .map((candidate: any) => (
                    <div 
                      key={candidate.id}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-5 cursor-pointer hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-white text-base">{candidate.name}</h3>
                          <p className="text-xs text-indigo-400 font-medium mt-0.5">{candidate.position}</p>
                        </div>
                        {/* AI Match Score Badge */}
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[10px] text-slate-400">AI</span>
                          <span className="text-sm font-bold text-emerald-400">{candidate.aiScore}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 mb-4">
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>📞</span> {candidate.phone}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>📅</span> 지원일: {candidate.appliedAt}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button 
                        onClick={() => moveCandidate(candidate.id, colIndex)}
                        className="w-full bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white text-xs font-bold py-2.5 rounded-lg border border-slate-700 group-hover:border-indigo-500 transition-colors"
                      >
                        {colIndex === COLUMNS.length - 1 ? '최종 승인 및 온보딩 이관' : '다음 단계로 이동 ➔'}
                      </button>
                    </div>
                ))}
              </div>
              
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
