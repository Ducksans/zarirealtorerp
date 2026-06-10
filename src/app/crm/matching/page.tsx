/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function MatchingMockup() {
  const [matchingRunning, setMatchingRunning] = useState(false);
  const [matched, setMatched] = useState(false);

  const runMatching = () => {
    setMatchingRunning(true);
    setTimeout(() => {
      setMatchingRunning(false);
      setMatched(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/crm" className="text-blue-600 font-bold mb-4 inline-block hover:underline">← CRM 홈으로</Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">초지능형 VIP 매물 매칭</h1>
          <p className="text-slate-500">고객이 설정한 조건과 신규 등록 매물을 AI가 대조하여 즉시 알림을 발송합니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Customer Requirements */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">👤 타겟 고객 조건 (김덕산 회장님)</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">희망 매수 지역</span>
                <span className="font-bold text-slate-900">강남구 (역삼/논현/청담)</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">예산 (Max)</span>
                <span className="font-bold text-rose-600">80억 원</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">최소 기대 수익률</span>
                <span className="font-bold text-blue-600">4.5% 이상</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">필수 조건</span>
                <span className="font-bold text-slate-900">대로변 이면, 주차 5대 이상</span>
              </div>
            </div>
          </div>

          {/* New Property Input */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
              <h2 className="font-bold text-blue-900 flex items-center gap-2">🆕 신규 접수 매물 (오늘)</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">소재지</span>
                <span className="font-bold text-slate-900">강남구 역삼동 736-21</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">매매가</span>
                <span className="font-bold text-emerald-600">75억 원</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">예상 수익률</span>
                <span className="font-bold text-emerald-600">4.8%</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">기타 특징</span>
                <span className="font-bold text-slate-900">주차 8대, 15m 도로 접함</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={runMatching}
            disabled={matchingRunning || matched}
            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xl shadow-[0_5px_15px_rgba(79,70,229,0.3)] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {matchingRunning ? 'AI 매칭 분석 중...' : matched ? '매칭 성공!' : '🔍 AI 알고리즘 매칭 실행'}
          </button>
        </div>

        {matched && (
          <div className="mt-8 bg-emerald-50 border-2 border-emerald-500 p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="text-9xl">🎯</span>
            </div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl shadow-lg">
                ✓
              </div>
              <div>
                <h2 className="text-2xl font-black text-emerald-800 mb-2">98% 매칭률 달성! (적합 고객 1명 발견)</h2>
                <p className="text-emerald-700">해당 매물이 '김덕산 회장님'의 조건과 일치합니다. 즉각 알림톡을 발송하시겠습니까?</p>
                <div className="mt-4 flex gap-3">
                  <button className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl shadow-md transition-all flex items-center gap-2">
                    💬 고객에게 알림톡 쏘기
                  </button>
                  <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-md transition-all">
                    브리핑 PDF 생성
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
