/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';

export default function VRToursMockup() {
  return (
    <div className="p-8 bg-[#050508] min-h-screen text-slate-200 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">VR 랜선 임장 센터</h1>
            <p className="text-slate-400">M14: Matterport 3D 데이터를 임베딩하여 원격 브리핑 환경을 제공합니다.</p>
          </div>
          <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_5px_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
            🔴 Live 고객 브리핑 세션 열기
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
          {/* Main 3D View Area */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-slate-900/40"></div>
            
            {/* Interactive Hotspots */}
            <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/40 animate-bounce">
              <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"></div>
            </div>
            <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/40 animate-bounce" style={{animationDelay: '0.2s'}}>
              <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"></div>
            </div>

            {/* UI Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 pointer-events-auto">
                <h3 className="text-white font-bold text-lg">거실 (Living Room)</h3>
                <p className="text-sm text-slate-400">면적: 32㎡ / 층고: 2.8m</p>
              </div>
              <div className="flex gap-2 pointer-events-auto">
                <button className="w-12 h-12 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 text-xl transition-colors">🗺️</button>
                <button className="w-12 h-12 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 text-xl transition-colors">📏</button>
                <button className="w-12 h-12 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 text-xl transition-colors">↕️</button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col h-full backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 pb-4 border-b border-slate-800">매물 인포메이션</h3>
            
            <div className="space-y-5 flex-1">
              <div>
                <div className="text-xs text-slate-500 mb-1">소재지</div>
                <div className="text-sm font-medium text-slate-200">서울특별시 용산구 한남동 UN빌리지</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">거래 유형 및 금액</div>
                <div className="text-sm font-bold text-emerald-400">매매 / 85억 원</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">VR 스캔 날짜</div>
                <div className="text-sm font-medium text-slate-200">2026. 06. 01</div>
              </div>
            </div>

            <div className="mt-auto bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-xl">
              <h4 className="text-sm font-bold text-indigo-300 mb-3">고객 초대 링크</h4>
              <div className="flex gap-2">
                <input type="text" readOnly value="https://jari.com/vr/x8f9j2" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs w-full text-slate-400 outline-none" />
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white transition-colors">복사</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
