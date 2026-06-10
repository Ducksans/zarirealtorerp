/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';

export default function BusinessCardMockup() {
  const [employee] = useState({
    name: '조률',
    nameEng: 'Cho Ryul',
    title: '대표 / CEO',
    phone: '010-0000-0000',
    email: 'ryul@jari.com',
    address: '서울특별시 강남구 테헤란로 123, 자리타워 15층'
  });

  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen text-slate-200 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white mb-2">프리미엄 명함 자동 생성기</h1>
          <p className="text-slate-400">M15: 입사와 동시에 아날로그/디지털 명함이 자동 생성되어 브랜드 신뢰도를 부여합니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Analog Card */}
          <div>
            <h2 className="text-xl font-bold text-slate-300 mb-6 flex items-center gap-2"><span>📇</span> 아날로그 지류 명함 시안 (PDF)</h2>
            
            <div className="bg-slate-800/40 p-8 rounded-3xl shadow-inner relative flex flex-col items-center justify-center space-y-8 border border-slate-700/50">
              
              {/* Card Front */}
              <div className="w-[400px] h-[220px] bg-[#1a1a1c] rounded-md shadow-2xl relative overflow-hidden group transition-transform hover:scale-105 duration-300">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-3xl font-bold tracking-widest text-[#d4af37] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">자리공인중개사사무소</div>
                  <div className="text-[10px] text-slate-400 mt-2 tracking-widest uppercase">Premium Real Estate</div>
                </div>
              </div>

              {/* Card Back */}
              <div className="w-[400px] h-[220px] bg-slate-50 rounded-md shadow-2xl relative p-8 flex flex-col justify-between group transition-transform hover:scale-105 duration-300 text-slate-900">
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div>
                    <div className="text-2xl font-extrabold tracking-tight text-slate-900">{employee.name}</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{employee.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#d4af37]">JARI REAL ESTATE</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600 font-medium tracking-wide">
                  <p>M. <span className="font-bold text-slate-800">{employee.phone}</span></p>
                  <p>E. <span className="font-bold text-slate-800">{employee.email}</span></p>
                  <p>A. <span className="font-bold text-slate-800">{employee.address}</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-slate-600 shadow-lg">
                📥 인쇄용 PDF 다운로드
              </button>
            </div>
          </div>

          {/* Digital Card */}
          <div>
            <h2 className="text-xl font-bold text-slate-300 mb-6 flex items-center gap-2"><span>📱</span> 스마트 반응형 웹 명함 (URL/QR)</h2>
            
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl flex justify-center shadow-inner">
              
              {/* Mobile Phone Mockup */}
              <div className="w-[320px] h-[650px] bg-slate-950 rounded-[40px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                
                {/* Screen Content */}
                <div className="absolute inset-0 bg-[#050508] overflow-y-auto pb-10 no-scrollbar">
                  <div className="h-48 bg-gradient-to-b from-indigo-900/80 to-[#050508] relative">
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-slate-800 rounded-full border-4 border-[#050508] overflow-hidden flex items-center justify-center text-4xl shadow-xl">
                      🧑‍💼
                    </div>
                  </div>
                  
                  <div className="mt-16 px-6 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">{employee.name}</h3>
                    <p className="text-indigo-400 font-bold text-sm mb-6">{employee.title}</p>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 mb-8">
                      <button className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl hover:bg-emerald-500/30 transition-colors">📞</button>
                      <button className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl hover:bg-blue-500/30 transition-colors">💬</button>
                      <button className="w-12 h-12 rounded-full bg-slate-700/50 text-slate-300 flex items-center justify-center text-xl hover:bg-slate-700 transition-colors">✉️</button>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="bg-white p-4 rounded-2xl mx-auto w-40 h-40 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-slate-200">
                      <div className="w-full h-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs text-center font-bold">
                        QR Code<br/>(자동 생성됨)
                      </div>
                    </div>

                    {/* Linktree style buttons */}
                    <div className="space-y-3">
                      <button className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-200 border border-slate-700 transition-colors shadow-lg">추천 매물 보러가기</button>
                      <button className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-200 border border-slate-700 transition-colors shadow-lg">회사 홈페이지</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center flex justify-center gap-3">
              <button className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_5px_15px_rgba(79,70,229,0.3)] transition-all">
                🔗 URL 복사하기
              </button>
              <button className="px-6 py-4 bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-bold rounded-xl shadow-[0_5px_15px_rgba(254,229,0,0.3)] transition-all flex items-center gap-2">
                💬 카카오톡 전송
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
