'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ApprovalDashboard() {
  const { data: responseData, error, isLoading, mutate } = useSWR('/api/approvals', fetcher);
  const requests = responseData?.data || [];
  
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [memo, setMemo] = useState('');

  // Auto-select the first request when data loads and none is selected
  useEffect(() => {
    if (requests.length > 0 && !activeReqId) {
      setActiveReqId(requests[0].id);
    } else if (requests.length > 0 && activeReqId) {
      // Check if selected request still exists
      const exists = requests.find((r: any) => r.id === activeReqId);
      if (!exists) setActiveReqId(requests[0].id);
    } else if (requests.length === 0) {
      setActiveReqId(null);
    }
  }, [requests, activeReqId]);

  const activeReq = requests.find((r: any) => r.id === activeReqId);

  const handleApprove = async () => {
    if (!activeReq) return;
    
    let role = '';
    if (activeReq.status === 'PENDING_TL') role = 'TL';
    else if (activeReq.status === 'PENDING_DH') role = 'DH';
    else if (activeReq.status === 'PENDING_BM') role = 'BM';
    else if (activeReq.status === 'PENDING_CEO') role = 'CEO';

    try {
      const res = await fetch(`/api/approvals/${activeReq.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', role, memo })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMemo('');
      mutate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async () => {
    if (!activeReq) return;
    try {
      const res = await fetch(`/api/approvals/${activeReq.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMemo('');
      mutate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (error) {
    return <div className="min-h-screen bg-slate-950 text-white p-10">결재 데이터를 불러오는 데 실패했습니다.</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
        <div className="max-w-[1600px] mx-auto space-y-8 animate-pulse">
          <div>
            <div className="h-8 bg-slate-800 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 h-[750px]"></div>
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 h-[750px]"></div>
            <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 h-[750px]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
            <span className="text-indigo-500">📝</span> 전자결재 (M6) - 신규 입사 결재 및 멘토링 보드
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
              {requests.length === 0 && (
                <div className="text-slate-500 text-sm p-4">대기 중인 결재가 없습니다.</div>
              )}
              {requests.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => setActiveReqId(req.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    activeReqId === req.id 
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white">{req.name}</span>
                    <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
                      {req.status.replace('PENDING_', '')} 대기
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">{req.phone}</div>
                  <div className="text-xs text-slate-500 mt-2">제출: {new Date(req.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle & Right only if activeReq exists */}
          {activeReq ? (
            <>
              {/* Middle: AI Analysis & Profile */}
              <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[750px] overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <h2 className="font-bold text-white text-lg">{activeReq.name} 지원자 상세 프로필</h2>
                  <button className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded border border-slate-700 hover:text-white">이력서 원본 보기 ↗</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* AI Analysis Panel */}
                  {activeReq.aiAnalysis && (() => {
                    let ai = null;
                    try {
                      ai = JSON.parse(activeReq.aiAnalysis);
                    } catch(e) {}
                    if (!ai) return null;
                    return (
                      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-10 -mt-10 rounded-full"></div>
                        <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2">
                          <span className="text-xl">✨</span> AI 이력서/자소서 분석 리포트
                        </h3>
                        
                        <div className="space-y-4 text-sm">
                          <div>
                            <span className="block text-slate-400 mb-1 text-xs font-semibold uppercase">분류 유형</span>
                            <div className="font-bold text-white bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 inline-block">{ai.type || '알 수 없음'}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 p-4 rounded-xl border border-emerald-500/20">
                              <span className="block text-emerald-400 mb-2 font-bold flex items-center gap-1">↑ 강점 (Strengths)</span>
                              <ul className="list-disc list-inside text-slate-300 space-y-1 text-xs">
                                {ai.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-xl border border-red-500/20">
                              <span className="block text-red-400 mb-2 font-bold flex items-center gap-1">↓ 약점 (Weaknesses)</span>
                              <ul className="list-disc list-inside text-slate-300 space-y-1 text-xs">
                                {ai.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          </div>

                          <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/30 mt-4">
                            <span className="block text-indigo-300 mb-2 font-bold text-xs">💡 추천 멘토링 전략</span>
                            <p className="text-slate-300 leading-relaxed">{ai.mentoringStrategy || ai.strategy}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Basic Info Summary */}
                  <div>
                    <h3 className="font-bold text-white border-b border-slate-800 pb-2 mb-4">입력된 기본 정보 요약</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="text-slate-500">생년월일</div><div className="text-white">{activeReq.birthDate}</div>
                      <div className="text-slate-500">연락처</div><div className="text-white">{activeReq.phone}</div>
                      <div className="text-slate-500">주소</div><div className="text-white">{activeReq.address}</div>
                      <div className="text-slate-500">계좌정보</div><div className="text-white">{activeReq.bankAccount}</div>
                      <div className="text-slate-500">등본/통장/자격증</div><div className="text-emerald-400 font-bold">정상 업로드됨</div>
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
                    <div className={`relative pl-6 ${activeReq.status === 'PENDING_TL' ? '' : (['PENDING_DH','PENDING_BM','PENDING_CEO'].includes(activeReq.status) ? 'opacity-70' : 'opacity-40')}`}>
                      <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 ${activeReq.status === 'PENDING_TL' ? 'bg-amber-500 animate-pulse' : (['PENDING_DH','PENDING_BM','PENDING_CEO'].includes(activeReq.status) ? 'bg-emerald-500' : 'bg-slate-600')}`}></span>
                      <div className={`font-bold ${activeReq.status === 'PENDING_TL' ? 'text-amber-400' : 'text-slate-300'} mb-1`}>1차 결재: 팀장 {activeReq.status === 'PENDING_TL' ? '(현재 단계)' : '(승인완료)'}</div>
                      {activeReq.status === 'PENDING_TL' ? (
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mt-2 shadow-inner">
                          <label className="block text-xs text-slate-500 mb-2">팀장용 멘토링 메모 (본부장 이상 열람 가능)</label>
                          <textarea 
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                            placeholder="AI 분석을 참고하여 팀 내 배치 및 초기 교육 계획을 메모하십시오."
                            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button onClick={handleApprove} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg shadow-lg transition-colors">
                            메모 저장 및 승인 (본부장에게 이관)
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-1 bg-slate-950 p-2 rounded border border-slate-800">{activeReq.tlMemo || '메모 없음'}</div>
                      )}
                    </div>

                    {/* Step 2: Division Head */}
                    <div className={`relative pl-6 ${activeReq.status === 'PENDING_DH' ? '' : (['PENDING_BM','PENDING_CEO'].includes(activeReq.status) ? 'opacity-70' : 'opacity-40')}`}>
                      <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 ${activeReq.status === 'PENDING_DH' ? 'bg-amber-500 animate-pulse' : (['PENDING_BM','PENDING_CEO'].includes(activeReq.status) ? 'bg-emerald-500' : 'bg-slate-600')}`}></span>
                      <div className={`font-bold ${activeReq.status === 'PENDING_DH' ? 'text-amber-400' : 'text-slate-300'} mb-1`}>2차 결재: 본부장 {activeReq.status === 'PENDING_DH' ? '(현재 단계)' : ''}</div>
                      {activeReq.status === 'PENDING_DH' ? (
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mt-2 shadow-inner">
                          <label className="block text-xs text-slate-500 mb-2">본부장 메모</label>
                          <textarea 
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none"
                          />
                          <button onClick={handleApprove} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors">승인 (지점장에게 이관)</button>
                        </div>
                      ) : (
                        ['PENDING_BM','PENDING_CEO'].includes(activeReq.status) ? <div className="text-xs text-slate-400 mt-1 bg-slate-950 p-2 rounded border border-slate-800">{activeReq.dhMemo || '메모 없음'}</div> : <div className="text-xs text-slate-500">대기 중</div>
                      )}
                    </div>

                    {/* Step 3: Branch Manager */}
                    <div className={`relative pl-6 ${activeReq.status === 'PENDING_BM' ? '' : (activeReq.status === 'PENDING_CEO' ? 'opacity-70' : 'opacity-40')}`}>
                      <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 ${activeReq.status === 'PENDING_BM' ? 'bg-amber-500 animate-pulse' : (activeReq.status === 'PENDING_CEO' ? 'bg-emerald-500' : 'bg-slate-600')}`}></span>
                      <div className={`font-bold ${activeReq.status === 'PENDING_BM' ? 'text-amber-400' : 'text-slate-300'} mb-1`}>3차 결재: 지점장 {activeReq.status === 'PENDING_BM' ? '(현재 단계)' : ''}</div>
                      {activeReq.status === 'PENDING_BM' ? (
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mt-2 shadow-inner">
                          <label className="block text-xs text-slate-500 mb-2">지점장 메모</label>
                          <textarea 
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none"
                          />
                          <button onClick={handleApprove} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors">승인 (대표/총무에게 이관)</button>
                        </div>
                      ) : (
                        activeReq.status === 'PENDING_CEO' ? <div className="text-xs text-slate-400 mt-1 bg-slate-950 p-2 rounded border border-slate-800">{activeReq.bmMemo || '메모 없음'}</div> : <div className="text-xs text-slate-500">대기 중</div>
                      )}
                    </div>

                    {/* Step 4: CEO/Admin */}
                    <div className={`relative pl-6 ${activeReq.status === 'PENDING_CEO' ? '' : 'opacity-40'}`}>
                      <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 ${activeReq.status === 'PENDING_CEO' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></span>
                      <div className={`font-bold ${activeReq.status === 'PENDING_CEO' ? 'text-amber-400' : 'text-slate-300'} mb-1`}>최종 승인: 대표/총무 {activeReq.status === 'PENDING_CEO' ? '(현재 단계)' : ''}</div>
                      {activeReq.status === 'PENDING_CEO' ? (
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mt-2 shadow-inner">
                          <label className="block text-xs text-slate-500 mb-2">최종 검토 메모</label>
                          <textarea 
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none"
                          />
                          <button onClick={handleApprove} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors">최종 승인 및 사번 발급</button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">데이터 무결성 최종 확인 및 사번 발급 대기</div>
                      )}
                    </div>

                  </div>
                </div>
                
                <div className="p-6 border-t border-slate-800 bg-red-500/5">
                  <button onClick={handleReject} className="w-full text-red-400 hover:text-red-300 text-sm font-bold transition-colors">
                    결재 반려 (입사 거절)
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-9 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-center h-[750px] text-slate-500">
              결재를 선택해주세요.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
