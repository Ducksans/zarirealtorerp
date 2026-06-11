/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function CTIMockup() {
  const [incomingCall, setIncomingCall] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-8 relative overflow-hidden">
      <div className="bg-amber-100 border border-amber-300 text-amber-800 text-sm font-bold px-4 py-2 rounded-lg mb-6 text-center relative z-10">[목업 — 실제화 대기] 이 화면은 목업이며 실데이터와 연결되어 있지 않습니다.</div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <Link href="/crm" className="text-blue-600 font-bold mb-4 inline-block hover:underline">← CRM 홈으로</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">CTI (인터넷 전화) 연동 센터</h1>
            <p className="text-slate-500">전화가 걸려오면 등록된 고객 정보를 CRM 화면에 즉각 팝업으로 띄워줍니다.</p>
          </div>
          <button 
            onClick={() => setIncomingCall(true)}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-[0_5px_15px_rgba(225,29,72,0.3)] transition-all animate-pulse"
          >
            ☎️ 테스트 전화 걸어보기
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 min-h-[500px]">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">최근 통화 기록 (Call Logs)</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">수신</div>
                <div>
                  <div className="font-bold text-slate-900">이성계 대표님 (010-1234-5678)</div>
                  <div className="text-xs text-slate-500">오늘 오후 2:30 / 통화시간: 05:21</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded-full">녹취 완료</span>
                <button className="p-2 text-slate-400 hover:text-blue-600">▶️</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">발신</div>
                <div>
                  <div className="font-bold text-slate-900">박문수 고객님 (010-9876-5432)</div>
                  <div className="text-xs text-slate-500">어제 오전 10:15 / 통화시간: 02:40</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded-full">녹취 완료</span>
                <button className="p-2 text-slate-400 hover:text-blue-600">▶️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Call Popup Overlay */}
      {incomingCall && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white w-[500px] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-800 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce">
                  📞
                </div>
                <h2 className="text-2xl font-extrabold text-white">전화 수신 중...</h2>
                <p className="text-blue-200 font-bold tracking-widest mt-1">010-5555-8888</p>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="font-black text-2xl text-slate-900">정약용 회장님</div>
                <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs">VIP 고객</span>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">담당 중개사</span>
                  <span className="font-bold text-slate-900">조률 대표</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">최근 문의 이력</span>
                  <span className="font-bold text-blue-600">논현동 100억 대 빌딩 매수 (2주 전)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">투자 성향</span>
                  <span className="font-bold text-slate-900">시세 차익형 / 전액 현금</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIncomingCall(false)} className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-colors">
                  거절
                </button>
                <button onClick={() => setIncomingCall(false)} className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition-colors flex items-center justify-center gap-2">
                  통화 연결 <span>☎️</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
