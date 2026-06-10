/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import Link from 'next/link';

export default function PolygonMapMockup() {
  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <Link href="/crm" className="text-blue-600 font-bold hover:underline">← CRM 홈</Link>
          <div className="w-px h-6 bg-slate-200"></div>
          <h1 className="font-bold text-xl text-slate-800">폴리곤(Polygon) 상권 매물 탐색기</h1>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 flex items-center gap-2">
            ✏️ 다각형 그리기
          </button>
          <button className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700">
            브리핑 지도 PDF 내보내기
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r border-slate-200 flex flex-col z-10 shadow-[5px_0_15px_rgba(0,0,0,0.05)]">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">선택 영역 매물 (3건)</h2>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <div className="text-sm text-blue-800 font-bold mb-1">사용자 지정 구역 (강남역-역삼역 사이)</div>
              <div className="text-xs text-blue-600">면적: 약 125,000 ㎡</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-blue-500 cursor-pointer shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded">독점 매물</span>
                <span className="text-slate-400 text-xs">JARI-A123</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">역삼동 이즈타워 인근 꼬마빌딩</h3>
              <p className="text-emerald-600 font-black text-lg mb-2">매매 65억</p>
              <div className="text-xs text-slate-500">대지 150평 / 수익률 4.2%</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-blue-500 cursor-pointer shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">공동 중개</span>
                <span className="text-slate-400 text-xs">JARI-B456</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">강남역 이면도로 메디컬 빌딩</h3>
              <p className="text-emerald-600 font-black text-lg mb-2">매매 120억</p>
              <div className="text-xs text-slate-500">대지 210평 / 전체 명도 가능</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-blue-500 cursor-pointer shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded">추천 매물</span>
                <span className="text-slate-400 text-xs">JARI-C789</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">테헤란로 이면 리모델링용 상가주택</h3>
              <p className="text-emerald-600 font-black text-lg mb-2">매매 48억</p>
              <div className="text-xs text-slate-500">대지 95평 / 용도변경 용이</div>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden">
          {/* Mockup Map Background */}
          <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/4/47/New_york_times_square-terabass.jpg')] bg-cover bg-center grayscale opacity-50 mix-blend-multiply"></div>
          
          {/* Overlay Polygon */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="30,20 60,30 70,70 20,80" fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5" strokeDasharray="1,1" />
          </svg>

          {/* Map Markers */}
          <div className="absolute top-[35%] left-[45%] w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg ring-4 ring-rose-500/30 animate-bounce">1</div>
          <div className="absolute top-[60%] left-[55%] w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg ring-4 ring-blue-500/30 cursor-pointer">2</div>
          <div className="absolute top-[45%] left-[30%] w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg ring-4 ring-blue-500/30 cursor-pointer">3</div>

          {/* Tooltip */}
          <div className="absolute top-[30%] left-[46%] bg-white p-3 rounded-xl shadow-xl border border-slate-200 text-sm">
            <div className="font-bold text-slate-900">역삼동 이즈타워 인근</div>
            <div className="text-emerald-600 font-bold mt-1">65억</div>
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
