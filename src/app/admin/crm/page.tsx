/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';

export default function CRMMockup() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              초지능형 CRM <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-1 rounded font-mono border border-indigo-500/30">M10 & M12</span>
            </h1>
            <p className="text-slate-400 mt-2">지오코딩 라우팅, AVM(가치평가), AI 매물 레이더 및 원클릭 옴니채널 마케팅</p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-lg shadow-emerald-900/30">
            신규 매물/고객 등록
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Map & Routing */}
          <div className="col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-1">
              <div className="h-[400px] w-full rounded-lg bg-slate-900 border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="text-5xl mb-4">🗺️</div>
                <h3 className="text-xl font-medium text-slate-300">AI 공간 최적화 라우팅 맵</h3>
                <p className="text-slate-500 mt-2">오늘의 임장 루트 및 고객 미팅 최적 동선 시각화</p>
                <div className="absolute bottom-4 left-4 right-4 bg-slate-800/90 backdrop-blur border border-slate-700 p-3 rounded-lg flex justify-between items-center">
                  <div className="text-sm">현재 루트: <span className="text-indigo-400 font-medium">강남구청 ➔ 역삼 ➔ 삼성동 (총 4.2km)</span></div>
                  <button className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded">내비게이션 연동</button>
                </div>
              </div>
            </div>

            {/* AVM & Radar */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">🤖 공공데이터 AVM 가치평가</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                    <span className="text-slate-400">대상 물건</span>
                    <span className="text-slate-200">역삼동 푸르지오 101동</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                    <span className="text-slate-400">AI 예측 적정가</span>
                    <span className="text-emerald-400 font-bold">₩ 2,150,000,000</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">권리관계 위험도</span>
                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">안전 (근저당 0)</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">📡 개인화 매물 레이더</h3>
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 mb-3">
                  <div className="text-xs text-indigo-400 mb-1">매칭 알림! (1분 전)</div>
                  <div className="text-sm text-slate-200">역삼동 상가 1층 전속 매물 등록됨</div>
                  <div className="text-xs text-slate-400 mt-1">나의 주력 키워드와 95% 일치</div>
                </div>
                <div className="text-xs text-center text-slate-500 cursor-pointer hover:text-slate-300">레이더 키워드 설정</div>
              </div>
            </div>
          </div>

          {/* Right Column: Omni Channel & Scheduler */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="font-semibold text-white mb-4">📢 원클릭 옴니채널 마케팅</h3>
              <p className="text-xs text-slate-400 mb-4">등록된 매물을 외부 포털에 한 번에 전송합니다.</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900" defaultChecked />
                  <span className="text-sm font-medium text-emerald-400">N 부동산 (네이버)</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:border-yellow-500/50 transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-slate-900" defaultChecked />
                  <span className="text-sm font-medium text-yellow-400">직방 / 다방</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:border-sky-500/50 transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900" defaultChecked />
                  <span className="text-sm font-medium text-sky-400">인스타그램 / 블로그</span>
                </label>
              </div>
              <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors">
                선택 채널 일괄 전송 🚀
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="font-semibold text-white mb-4">🎙️ AI 통화 분석 스케줄러</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                 {/* Timeline Item */}
                 <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-800 text-slate-500 group-[.is-active]:text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <span className="text-xs font-bold">14:00</span>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-slate-200 text-sm">최회장 통화 완료</div>
                        </div>
                        <div className="text-xs text-slate-400">"내일 오후 3시 계약서 쓰러 갈게요" -&gt; <span className="text-emerald-400">내일 15:00 일정 자동 등록됨</span></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
