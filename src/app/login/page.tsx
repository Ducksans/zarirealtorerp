'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecruitmentLandingPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      
      <div className="w-full max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10 py-20">
        
        {/* Left: Marketing / Vision Showroom */}
        <div className="flex flex-col justify-center space-y-10">
          <div>
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <span className="text-sm font-bold text-indigo-400">대한민국 No.1 부동산 중개 네트워크</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6">
              투명함이 만드는<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">압도적 성과</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
              단순한 중개법인이 아닙니다. 전국 1만 명 이상의 영업진이 활동할 
              AI 기반 CRM과 완벽한 시스템이 여러분의 영업을 지원합니다. 
              숨김없는 보상 체계와 오버라이딩을 지금 확인해 보십시오.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 bg-slate-900/80 border border-slate-700 hover:border-indigo-500/50 rounded-2xl text-slate-200 font-bold transition-all shadow-xl hover:shadow-indigo-500/10 flex items-center justify-center gap-3 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">💻</span>
              ERP 데모 구경하기
            </button>
            <button className="px-8 py-4 bg-slate-900/80 border border-slate-700 hover:border-emerald-500/50 rounded-2xl text-slate-200 font-bold transition-all shadow-xl hover:shadow-emerald-500/10 flex items-center justify-center gap-3 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">📖</span>
              회사 규정집 (보상/진급) 원문 보기
            </button>
          </div>

          <div className="pt-8 border-t border-slate-800/50">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#050508] flex items-center justify-center text-xs text-slate-400 font-bold">
                    User
                  </div>
                ))}
              </div>
              <p>이미 1,200명 이상의 중개인들이<br/>이 시스템과 함께 성장하고 있습니다.</p>
            </div>
          </div>
        </div>

        {/* Right: Login & Apply Form (Glassmorphism) */}
        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>
            
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">System Login</h2>
              <p className="text-sm text-slate-400">내부 임직원용 로그인 페이지입니다.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <input 
                  type="text" 
                  placeholder="사번 (EMP-0000)"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>
              
              <div>
                <input 
                  type="password" 
                  placeholder="비밀번호"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50"
                >
                  {isLoading ? '인증 중...' : '접속'}
                </button>
              </div>
            </form>

            {/* Application CTA */}
            <div className="mt-10 pt-8 border-t border-slate-800 text-center">
              <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
                <h3 className="text-white font-bold mb-2 text-lg">최고와 함께 하십시오</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  투명한 보상과 압도적인 시스템 지원.<br/>
                  입사 지원을 통해 면접의 기회를 잡으세요.
                </p>
                <button 
                  onClick={() => router.push('/onboarding')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  입사 지원하기 (Self-Service)
                </button>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
