/*---
id: page.tsx
milestone: M2
why: 실인증 로그인 페이지 (사번+비밀번호 → /api/auth/login, 최초 설정 → /api/auth/set-password)
backlinks: [[M2_Auth]]
---*/

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** ?next= 파라미터를 안전하게 읽는다 (내부 경로만 허용 — 오픈 리다이렉트 방지) */
function getNextPath(): string {
  if (typeof window === 'undefined') return '/';
  const next = new URLSearchParams(window.location.search).get('next');
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/';
}

type AuthMode = 'login' | 'setup';

export default function RecruitmentLandingPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  // 최초 비밀번호 설정 모드 전용
  const [birthDate, setBirthDate] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberId, setRememberId] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('savedEmployeeId');
    if (savedId) {
      setEmployeeId(savedId);
      setRememberId(true);
    }
  }, []);
  const router = useRouter();

  const persistRememberId = () => {
    if (rememberId) {
      localStorage.setItem('savedEmployeeId', employeeId.trim());
    } else {
      localStorage.removeItem('savedEmployeeId');
    }
  };

  /** 인증 성공 → 쿠키가 반영된 상태로 전체 내비게이션 (proxy 가드 재평가) */
  const goNext = () => {
    persistRememberId();
    window.location.assign(getNextPath());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const id = employeeId.trim();
    if (!id || !password) {
      setError('사번과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: id, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.needsSetup) {
        // 비밀번호 미설정 계정 → 최초 비밀번호 설정 모드로 전환
        setMode('setup');
        setPassword('');
        return;
      }
      if (!res.ok) {
        setError(data.error ?? data.message ?? '사번 또는 비밀번호가 올바르지 않습니다.');
        return;
      }
      goNext();
    } catch {
      setError('서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const id = employeeId.trim();
    const birth = birthDate.trim();
    if (!id) {
      setError('사번을 입력해 주세요.');
      return;
    }
    if (birth && !/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
      setError('생년월일은 YYYY-MM-DD 형식으로 입력해 주세요.');
      return;
    }
    if (newPassword.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: id,
          ...(birth ? { birthDate: birth } : {}),
          password: newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? data.message ?? '비밀번호 설정에 실패했습니다.');
        return;
      }
      // 설정 성공 = 서버가 자동 로그인 쿠키를 발급함
      goNext();
    } catch {
      setError('서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all';

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
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6 break-keep">
              투명함이 만드는<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">압도적 성과</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl break-keep">
              단순한 중개법인이 아닙니다. 전국 1만 명 이상의 영업진이 활동할
              AI 기반 CRM과 완벽한 시스템이 여러분의 영업을 지원합니다.
              숨김없는 보상 체계와 오버라이딩을 지금 확인해 보십시오.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => router.push('/admin/settlements')} className="px-8 py-4 bg-slate-900/80 border border-slate-700 hover:border-indigo-500/50 rounded-2xl text-slate-200 font-bold transition-all shadow-xl hover:shadow-indigo-500/10 flex items-center justify-center gap-3 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">💻</span>
              ERP 데모 구경하기
            </button>
            <button onClick={() => router.push('/rulebook')} className="px-8 py-4 bg-slate-900/80 border border-slate-700 hover:border-emerald-500/50 rounded-2xl text-slate-200 font-bold transition-all shadow-xl hover:shadow-emerald-500/10 flex items-center justify-center gap-3 group">
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
              <p className="break-keep">이미 1,200명 이상의 중개인들이<br/>이 시스템과 함께 성장하고 있습니다.</p>
            </div>
          </div>
        </div>

        {/* Right: Login & Apply Form (Glassmorphism) */}
        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>

            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                {mode === 'login' ? 'System Login' : '최초 비밀번호 설정'}
              </h2>
              <p className="text-sm text-slate-400 break-keep">
                {mode === 'login'
                  ? '내부 임직원용 로그인 페이지입니다.'
                  : '본인 확인 후 사용할 비밀번호를 만들어 주세요.'}
              </p>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="사번"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    autoComplete="username"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={rememberId}
                        onChange={e => setRememberId(e.target.checked)}
                        className="peer appearance-none w-5 h-5 border border-slate-600 rounded bg-slate-900/50 checked:bg-indigo-500 checked:border-indigo-500 transition-colors"
                      />
                      <span className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-xs">✓</span>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">아이디 저장</span>
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 break-keep" role="alert">
                    {error}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50"
                  >
                    {isLoading ? '인증 중...' : '접속'}
                  </button>
                </div>

                <p className="text-xs text-slate-500 text-center break-keep">
                  처음이신가요? 사번 입력 후 비밀번호를 설정하세요.
                </p>
              </form>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="사번"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    autoComplete="username"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="생년월일 YYYY-MM-DD (선택)"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    inputMode="numeric"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-slate-500 break-keep">
                    인사 기록에 생년월일이 등록된 경우 본인 확인을 위해 입력해 주세요.
                  </p>
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="새 비밀번호 (8자 이상)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="새 비밀번호 확인"
                    value={newPasswordConfirm}
                    onChange={e => setNewPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    className={inputClass}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 break-keep" role="alert">
                    {error}
                  </p>
                )}

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50"
                  >
                    {isLoading ? '설정 중...' : '비밀번호 설정 후 로그인'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="w-full text-sm text-slate-400 hover:text-slate-200 transition-colors py-2"
                  >
                    ← 로그인으로 돌아가기
                  </button>
                </div>
              </form>
            )}

            {/* Application CTA */}
            <div className="mt-10 pt-8 border-t border-slate-800 text-center">
              <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
                <h3 className="text-white font-bold mb-2 text-lg">최고와 함께 하십시오</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed break-keep">
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
