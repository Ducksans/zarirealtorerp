/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import Link from 'next/link';

export default function PipelineMockup() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <Link href="/crm" className="text-blue-600 font-bold mb-4 inline-block hover:underline">← CRM 홈으로</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">포스트 브로커리지 (Post-Brokerage) 밸류체인</h1>
            <p className="text-slate-500">계약이 끝난 고객을 버리지 않습니다. 인테리어, 가구 렌탈, 임대 관리(PM)로 이어지는 추가 수익 파이프라인입니다.</p>
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all">
            + 신규 파이프라인 보드 추가
          </button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
          
          {/* Column 1: Contract Closed */}
          <div className="bg-slate-100 rounded-2xl w-96 flex-shrink-0 flex flex-col snap-start shadow-inner border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-200/50 rounded-t-2xl">
              <h2 className="font-bold text-slate-700">1. 매매/임대 계약 완료</h2>
              <span className="bg-slate-300 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">3건</span>
            </div>
            <div className="p-4 flex-1 space-y-4">
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab hover:ring-2 hover:ring-blue-400 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">오피스 임대</span>
                  <span className="text-slate-400 text-xs">2일 전</span>
                </div>
                <h3 className="font-bold text-slate-900">스타트업 'A'팀 강남 이전</h3>
                <p className="text-sm text-slate-500 mb-3">전용 80평 / 월 1,200만</p>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">JD</div>
                  <button className="text-xs font-bold text-slate-500 hover:text-slate-800">→ 인테리어 제안하기</button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab hover:ring-2 hover:ring-blue-400 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">빌딩 매입</span>
                  <span className="text-slate-400 text-xs">5일 전</span>
                </div>
                <h3 className="font-bold text-slate-900">서초동 꼬마빌딩 (이현우 님)</h3>
                <p className="text-sm text-slate-500 mb-3">매매가 85억</p>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">HL</div>
                  <button className="text-xs font-bold text-slate-500 hover:text-slate-800">→ 임대 관리(PM) 제안</button>
                </div>
              </div>

            </div>
          </div>

          {/* Column 2: Interior Bidding */}
          <div className="bg-blue-50 rounded-2xl w-96 flex-shrink-0 flex flex-col snap-start shadow-inner border border-blue-100">
            <div className="p-4 border-b border-blue-200 flex justify-between items-center bg-blue-100/50 rounded-t-2xl">
              <h2 className="font-bold text-blue-900">2. 인테리어/시공 컨설팅 중</h2>
              <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">1건</span>
            </div>
            <div className="p-4 flex-1 space-y-4">
              
              <div className="bg-white p-4 rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.1)] border border-blue-200 cursor-grab transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">사옥 리모델링</span>
                  <span className="text-slate-400 text-xs">진행 중</span>
                </div>
                <h3 className="font-bold text-slate-900">역삼동 노후건물 밸류업</h3>
                <p className="text-sm text-slate-500 mb-3">예상 공사비: 약 12억 원</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                  <div className="bg-blue-500 h-1.5 rounded-full w-[60%]"></div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-600">제휴업체 3곳 견적 비교 중</div>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-200 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-emerald-200 border-2 border-white"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Column 3: Property Management */}
          <div className="bg-emerald-50 rounded-2xl w-96 flex-shrink-0 flex flex-col snap-start shadow-inner border border-emerald-100">
            <div className="p-4 border-b border-emerald-200 flex justify-between items-center bg-emerald-100/50 rounded-t-2xl">
              <h2 className="font-bold text-emerald-900">3. 임대/자산 관리 (PM) 운영 중</h2>
              <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">2건 (월 고정수익)</span>
            </div>
            <div className="p-4 flex-1 space-y-4">
              
              <div className="bg-white p-4 rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.1)] border border-emerald-200 cursor-grab transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">PM 계약 유지</span>
                  <span className="text-emerald-600 font-bold text-xs">월 수익 150만</span>
                </div>
                <h3 className="font-bold text-slate-900">청담동 메디컬 빌딩</h3>
                <p className="text-sm text-slate-500 mb-3">총 7개층 / 공실 0</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-slate-600">이번 달 임대료 수납률 100%</span>
                </div>
                <button className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-colors border border-emerald-200">
                  자산 운용 보고서 발행
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.1)] border border-emerald-200 cursor-grab transition-all opacity-80">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">PM 계약 유지</span>
                  <span className="text-emerald-600 font-bold text-xs">월 수익 80만</span>
                </div>
                <h3 className="font-bold text-slate-900">신사동 근생 건물</h3>
                <p className="text-sm text-slate-500 mb-3">총 4개층 / 공실 1</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-xs text-rose-600 font-bold">2층 임차인 연체 1개월</span>
                </div>
                <button className="w-full py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-lg transition-colors border border-slate-200">
                  명도 소송/내용증명 관리
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
