'use client';

import { useState } from 'react';

// 모의 데이터
const PENDING_REQUESTS = [
  {
    id: 'req-001',
    name: '김신입',
    status: 'PENDING_TL', // 현재 결재 단계: 팀장
    phone: '010-1234-5678',
    submittedAt: '2026-06-09T09:00:00Z',
    aiAnalysis: {
      type: 'ISTJ (논리적이고 체계적인 실무자형)',
      strengths: ['꼼꼼한 계약서 검토 능력', '강한 책임감과 성실성', '숫자 및 데이터 기반의 객관적 판단력'],
      weaknesses: ['유연한 커뮤니케이션 스킬 부족', '돌발 상황에 대한 임기응변 약함'],
      strategy: '초기 3개월은 반복적인 서류 작업과 데이터 입력 업무 위주로 배정하여 성취감을 부여하십시오. 이후 점진적으로 고객 응대 역할을 늘려가는 방식을 추천합니다. 즉흥적인 지시보다는 문서화된 가이드라인 제공이 효과적입니다.',
    }
  }
];

export default function ApprovalDashboard() {
  const [activeReq, setActiveReq] = useState(PENDING_REQUESTS[0]);
  const [memo, setMemo] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
            <span className="text-indigo-500">📝</span> 신규 입사 결재 및 멘토링 보드
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            신규 직원의 등록 요청을 순차 결재(팀장➔본부장➔지점장➔대표)하고, AI 분석을 바탕으로 멘토링 계획을 수립합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Pending List */}
          <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[750px]">
            <div className="p-5 border-b border-slate-800">
              <h2 className="font-bold text-white text-lg">결재 대기 목록</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {PENDING_REQUESTS.map(req => (
                <div key={req.id} className="p-4 rounded-xl border bg-indigo-600/10 border-indigo-500 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white">{req.name}</span>
                    <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">팀장 대기</span>
                  </div>
                  <div className="text-xs text-slate-400">{req.phone}</div>
                  <div className="text-xs text-slate-500 mt-2">제출: {new Date(req.submittedAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: AI Analysis & Profile */}
          <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[750px] overflow-hidden">
             <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h2 className="font-bold text-white text-lg">{activeReq.name} 지원자 상세 프로필</h2>
              <button className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded border border-slate-700 hover:text-white">이력서 원본 보기 ↗</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* AI Analysis Panel */}
              <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-10 -mt-10 rounded-full"></div>
                <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">✨</span> AI 이력서/자소서 분석 리포트
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="block text-slate-400 mb-1 text-xs font-semibold uppercase">분류 유형</span>
                    <div className="font-bold text-white bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 inline-block">{activeReq.aiAnalysis.type}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-emerald-500/20">
                       <span className="block text-emerald-400 mb-2 font-bold flex items-center gap-1">↑ 강점 (Strengths)</span>
                       <ul className="list-disc list-inside text-slate-300 space-y-1 text-xs">
                         {activeReq.aiAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                       </ul>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-red-500/20">
                       <span className="block text-red-400 mb-2 font-bold flex items-center gap-1">↓ 약점 (Weaknesses)</span>
                       <ul className="list-disc list-inside text-slate-300 space-y-1 text-xs">
                         {activeReq.aiAnalysis.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                       </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/30 mt-4">
                     <span className="block text-indigo-300 mb-2 font-bold text-xs">💡 추천 멘토링 전략</span>
                     <p className="text-slate-300 leading-relaxed">{activeReq.aiAnalysis.strategy}</p>
                  </div>
                </div>
              </div>
              
              {/* Basic Info Summary */}
              <div>
                <h3 className="font-bold text-white border-b border-slate-800 pb-2 mb-4">입력된 기본 정보 요약</h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-500">연락처</div><div className="text-white">{activeReq.phone}</div>
                  <div className="text-slate-500">등본/통장/자격증</div><div className="text-emerald-400 font-bold">정상 업로드됨 (6건)</div>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Approval Timeline & Mentoring Memo */}
          <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[750px]">
            <div className="p-6 border-b border-slate-800 bg-slate-900">
              <h2 className="font-bold text-white text-lg">다단계 결재 및 멘토링 기록</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative border-l-2 border-slate-700 ml-3 space-y-8">
                
                {/* Step 1: Team Leader */}
                <div className="relative pl-6">
                  <span className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 bg-amber-500 animate-pulse"></span>
                  <div className="font-bold text-amber-400 mb-1">1차 결재: 팀장 (현재 단계)</div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mt-2 shadow-inner">
                    <label className="block text-xs text-slate-500 mb-2">팀장용 멘토링 메모 (본부장 이상 열람 가능)</label>
                    <textarea 
                      value={memo}
                      onChange={e => setMemo(e.target.value)}
                      placeholder="AI 분석을 참고하여 팀 내 배치 및 초기 교육 계획을 메모하십시오."
                      className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg shadow-lg transition-colors">
                      메모 저장 및 승인 (본부장에게 이관)
                    </button>
                  </div>
                </div>

                {/* Step 2: Division Head */}
                <div className="relative pl-6 opacity-40">
                  <span className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 bg-slate-600"></span>
                  <div className="font-bold text-slate-300 mb-1">2차 결재: 본부장</div>
                  <div className="text-xs text-slate-500">대기 중</div>
                </div>

                {/* Step 3: Branch Manager */}
                <div className="relative pl-6 opacity-40">
                  <span className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 bg-slate-600"></span>
                  <div className="font-bold text-slate-300 mb-1">3차 결재: 지점장</div>
                  <div className="text-xs text-slate-500">대기 중</div>
                </div>

                {/* Step 4: CEO/Admin */}
                <div className="relative pl-6 opacity-40">
                  <span className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 bg-slate-600"></span>
                  <div className="font-bold text-slate-300 mb-1">최종 승인: 대표/총무</div>
                  <div className="text-xs text-slate-500">데이터 무결성 최종 확인 및 사번 발급 대기</div>
                </div>

              </div>
            </div>
            
            <div className="p-6 border-t border-slate-800 bg-red-500/5">
              <button className="w-full text-red-400 hover:text-red-300 text-sm font-bold transition-colors">
                결재 반려 (입사 거절)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
