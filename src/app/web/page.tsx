/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function WebB2cPortal() {
  const [address, setAddress] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(false);

  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult(true);
    }, 2500);
  };

  return (
    <div className="min-h-screen font-sans bg-white flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-8 py-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-white font-black text-3xl tracking-tighter">
          JARI <span className="text-blue-400 font-light">Estate</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="#" className="text-white font-bold hover:text-blue-300 transition-colors">매수</Link>
          <Link href="#" className="text-white font-bold hover:text-blue-300 transition-colors">매도</Link>
          <Link href="#" className="text-white font-bold hover:text-blue-300 transition-colors">투자 자문</Link>
          <Link href="/login" className="px-5 py-2 bg-white/20 backdrop-blur-md text-white font-bold rounded-full hover:bg-white hover:text-black transition-all">
            에이전트 로그인
          </Link>
        </div>
      </nav>

      {/* Hero Section with Parallax Background */}
      <div className="relative h-[70vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900 overflow-hidden">
          {/* A high-end luxury building background simulated with CSS/gradient */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-4xl px-6 text-center mt-12">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg tracking-tight">
            내 건물의 진짜 가치,<br/>AI로 1초 만에 확인하세요
          </h1>
          <p className="text-xl text-blue-100 mb-10 font-medium drop-shadow-md">
            JARI-Estimate™ 엔진이 실거래가, 수익률, 상권 데이터를 분석하여 가장 정확한 시세를 도출합니다.
          </p>

          <form onSubmit={handleEstimate} className="bg-white p-2 rounded-full shadow-2xl flex items-center w-full max-w-3xl mx-auto ring-4 ring-white/20">
            <div className="pl-6 text-2xl text-slate-400">📍</div>
            <input 
              type="text" 
              placeholder="건물 지번 또는 도로명 주소 입력 (예: 강남구 역삼동 123-45)" 
              className="flex-1 px-4 py-5 text-xl font-medium focus:outline-none bg-transparent text-slate-900"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={analyzing || result}
            />
            <button 
              type="submit" 
              disabled={analyzing || result || !address}
              className="px-8 py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-full text-lg transition-all"
            >
              시세 알아보기
            </button>
          </form>
        </div>
      </div>

      {/* Analysis Overlay */}
      {analyzing && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
          <h2 className="text-3xl font-bold mb-2">JARI-Estimate 엔진 가동 중...</h2>
          <p className="text-blue-300 text-lg animate-pulse">국토교통부 실거래가 및 인근 상권 수익률 데이터 취합 중</p>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="flex-1 bg-slate-50 px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-12 border-r border-slate-100">
                  <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm mb-6">AI 시세 분석 리포트</div>
                  <h2 className="text-2xl font-bold text-slate-500 mb-2">{address}</h2>
                  <div className="text-6xl font-black text-slate-900 tracking-tighter mb-4">
                    125<span className="text-4xl text-slate-400">억</span> 5,000<span className="text-4xl text-slate-400">만 원</span>
                  </div>
                  <div className="flex gap-4 mb-10">
                    <div className="flex-1 bg-emerald-50 p-4 rounded-2xl">
                      <div className="text-emerald-800 text-sm font-bold mb-1">예상 임대 수익률</div>
                      <div className="text-3xl font-black text-emerald-600">4.2%</div>
                    </div>
                    <div className="flex-1 bg-purple-50 p-4 rounded-2xl">
                      <div className="text-purple-800 text-sm font-bold mb-1">최근 3년 지가 상승률</div>
                      <div className="text-3xl font-black text-purple-600">+15.8%</div>
                    </div>
                  </div>
                  <p className="text-slate-500 leading-relaxed mb-8">
                    입력하신 위치의 상권 트래픽과 인근 유사 매물의 최근 실거래가(2건)를 바탕으로 도출된 추정가입니다. 대수선 또는 리모델링 시 가치가 <strong>약 150억 원</strong>까지 상승할 여력이 있습니다.
                  </p>
                  <button className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-lg transition-colors">
                    상세 리포트 PDF 다운로드 (무료)
                  </button>
                </div>
                
                <div className="bg-slate-900 p-12 flex flex-col justify-center text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <span className="text-9xl">📈</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold mb-4">가치를 더 높게, 매각을 더 빠르게</h3>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                      JARI 부동산의 상업용 부동산 전문가와 상의하세요. 비밀 유지 보장, VIP 프라이빗 매각 라인을 통해 원하시는 가격과 조건으로 매각해 드립니다.
                    </p>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 mb-6">
                      <div className="text-sm text-slate-300 mb-1">나의 전담 에이전트 매칭</div>
                      <div className="text-xl font-bold text-white mb-4">"조률 수석 중개사"</div>
                      <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                        무료 방문 컨설팅 예약하기
                      </button>
                    </div>
                    <div className="text-center text-slate-500 text-sm">
                      상담 예약 시 JARI-Estimate 프리미엄 분석 리포트를 지참하여 방문합니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
