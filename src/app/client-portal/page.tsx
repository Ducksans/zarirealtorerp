/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';

export default function ClientPortalMockup() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Client Facing Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-indigo-600 tracking-tight">자리공인중개사 <span className="text-slate-800">VIP</span></div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <span className="cursor-pointer hover:text-indigo-600">나의 계약</span>
            <span className="cursor-pointer hover:text-indigo-600">VR 임장</span>
            <span className="cursor-pointer hover:text-indigo-600">제휴 마켓</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold ml-2">최</div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-8 text-white shadow-xl shadow-indigo-200">
          <h1 className="text-3xl font-bold mb-2">안녕하세요, 최회장 고객님!</h1>
          <p className="text-indigo-100 mb-6">현재 진행 중인 역삼동 푸르지오 매매 계약이 안전하게 보호받고 있습니다.</p>
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 flex items-center justify-between">
             <div>
               <div className="text-sm text-indigo-100">잔금일까지 남은 시간</div>
               <div className="text-2xl font-bold">D-15</div>
             </div>
             <div className="text-right">
               <div className="text-sm text-indigo-100">전담 중개사</div>
               <div className="font-semibold">박태양 사원 (010-1234-5678)</div>
             </div>
          </div>
        </section>

        {/* Contract Timeline (M11 Smart Contract Tracking) */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">🔒 계약 진행 타임라인 (블록체인 보증)</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-8 relative before:absolute before:top-1/2 before:-translate-y-1/2 before:w-full before:h-1 before:bg-slate-100 before:-z-10">
              {['계약서 작성', '계약금 입금', '중도금', '잔금/소유권이전'].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 shadow-sm
                    ${idx < 2 ? 'bg-indigo-600 text-white' : idx === 2 ? 'bg-amber-400 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}
                  `}>
                    {idx < 2 ? '✓' : idx + 1}
                  </div>
                  <span className={`text-sm font-medium ${idx <= 2 ? 'text-slate-800' : 'text-slate-400'}`}>{step}</span>
                </div>
              ))}
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-indigo-900">전자 서명본 다운로드</h4>
                <p className="text-xs text-indigo-700 mt-1">Hash: 0x9f8b...2a1c (위변조 불가능)</p>
              </div>
              <button className="bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50">
                PDF 다운로드
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* M14: VR Tours */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">🕶️ VR 랜선 임장 (M14)</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group cursor-pointer">
              <div className="h-48 bg-slate-200 relative">
                {/* Simulated 3D view placeholder */}
                <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" alt="Room" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white text-2xl">
                    360°
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-800">청담동 자이 아파트 101동</h3>
                <p className="text-sm text-slate-500 mt-1">현장 방문 전, 집에서 편하게 구석구석 살펴보세요.</p>
              </div>
            </div>
          </section>

          {/* M14: Partner Market */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">🤝 B2B2C 파트너 재능 마켓 (M14)</h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <p className="text-sm text-slate-600 mb-4">입주 시 필요한 제휴 업체를 투명한 리뷰와 함께 예약하세요.</p>
              <div className="space-y-4">
                {['영구 이사 (프리미엄)', '클린엔젤스 (입주청소)', '한샘 인테리어 (부분시공)'].map((partner, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">🏢</div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{partner}</div>
                        <div className="text-xs text-amber-500">★★★★★ 4.9 (리뷰 120)</div>
                      </div>
                    </div>
                    <button className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                      견적요청
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
