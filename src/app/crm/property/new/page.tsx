/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function PropertyAutoFillMockup() {
  const [address, setAddress] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleFetch = () => {
    if(!address) return;
    setIsFetching(true);
    setTimeout(() => {
      setIsFetching(false);
      setDataLoaded(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-8">
      <div className="bg-amber-100 border border-amber-300 text-amber-800 text-sm font-bold px-4 py-2 rounded-lg mb-6 text-center">[목업 — 실제화 대기] 이 화면은 목업이며 실데이터와 연결되어 있지 않습니다.</div>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <Link href="/crm" className="text-blue-600 font-bold mb-4 inline-block hover:underline">← CRM 홈으로</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">매물 등록 (공공데이터 자동완성)</h1>
            <p className="text-slate-500">주소 하나만 입력하면 건축물대장, 토지대장, 등기부등본 정보를 1초 만에 스크래핑합니다.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-8 flex gap-4">
          <input 
            type="text" 
            placeholder="도로명 주소 또는 지번 주소 입력 (예: 강남구 역삼동 123-45)" 
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <button 
            onClick={handleFetch}
            disabled={isFetching || !address}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-2xl text-lg shadow-lg transition-colors flex items-center gap-2"
          >
            {isFetching ? 'API 연동 중...' : '✨ 자동 완성'}
          </button>
        </div>

        {dataLoaded && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="font-bold text-slate-800 text-lg">📄 스크래핑된 공공데이터 요약</h2>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">정부24 연동 성공</span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">건축물 주용도</div>
                      <input type="text" className="w-full font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-500 pb-1" defaultValue="제2종 근린생활시설" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">대지면적 / 연면적</div>
                      <input type="text" className="w-full font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-500 pb-1" defaultValue="345.5 ㎡ / 1,200.4 ㎡" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">층수 (지상/지하)</div>
                      <input type="text" className="w-full font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-500 pb-1" defaultValue="지상 5층 / 지하 1층" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">사용승인일자</div>
                      <input type="text" className="w-full font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-500 pb-1" defaultValue="2015. 11. 24" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">최근 실거래가 (유사 매물)</div>
                      <input type="text" className="w-full font-bold text-rose-600 border-b border-slate-300 focus:outline-none focus:border-blue-500 pb-1" defaultValue="85억 원 (2025.04)" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">주차 대수</div>
                      <input type="text" className="w-full font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-500 pb-1" defaultValue="기계식 12대 / 자주식 2대" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                  <h2 className="font-bold text-slate-800 text-lg">⚠️ 권리분석 AI 리포트</h2>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl font-black">!</div>
                    <div>
                      <div className="text-orange-800 font-bold">주의 요망 (신탁등기)</div>
                      <div className="text-orange-600 text-xs mt-1">소유권이 신탁회사에 이전되어 있습니다.</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500">근저당권 (은행)</span>
                      <span className="font-bold text-slate-900">45억 원 (채권최고액)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500">압류/가압류 내역</span>
                      <span className="font-bold text-slate-900">없음</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">위반건축물 여부</span>
                      <span className="font-bold text-emerald-600">안전 (해당 없음)</span>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl mt-4">등기부등본 원본 PDF 열람</button>
                </div>
              </div>

            </div>
            
            <div className="text-center">
              <button className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xl shadow-[0_5px_15px_rgba(16,185,129,0.3)] transition-all">
                완벽한 매물 데이터 등록 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
