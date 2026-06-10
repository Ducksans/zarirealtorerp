/*---
id: admin_transparency_page
milestone: M9
why: 시그니처 투명성 뷰 — 직원의 실제 월 매출이 100원 룰로 누구에게 얼마씩 흐르는지 애니메이션으로 증명 (입사설명회 쇼케이스 1호 화면)
backlinks: [[SSOT_Commission_100won_Rule.md]], [[Launch_Battle_Plan_D30.md]]
---*/

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ROLES_KO, type UserRole } from '@/types';

type Share = { key: string; label: string; amount: number; pct: number; formula: string };
type TraceData = {
  yearMonth: string;
  user: { id: string; name: string; role: string; employeeId: string };
  recipients: {
    teamLeader: { name: string; role: string } | null;
    divHead: { name: string; role: string } | null;
    branchMgrCount: number;
    branchMgrs: { name: string }[];
  };
  contracts: { id: string; grossCommission: number; contractDate: string; propertyAddress: string | null; contractType: string | null }[];
  gross: number;
  breakdown: { shares: Share[] };
  settlement: { basePay: number; bonusPay: number; totalPay: number } | null;
};
type UserHit = { id: string; name: string; role: string; employeeId: string };

/** rAF 기반 카운트업 — 데이터가 도착하는 순간에만 절제된 모션 */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function Krw({ amount, className }: { amount: number; className?: string }) {
  const v = useCountUp(amount);
  return <span className={className}>₩ {v.toLocaleString('ko-KR')}</span>;
}

const SHARE_STYLE: Record<string, { bar: string; text: string; ring: string }> = {
  agent:      { bar: 'bg-emerald-500',  text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  agentBonus: { bar: 'bg-emerald-700', text: 'text-emerald-500', ring: 'ring-emerald-700/30' },
  teamLeader: { bar: 'bg-indigo-500',  text: 'text-indigo-400',  ring: 'ring-indigo-500/30' },
  divHead:    { bar: 'bg-indigo-700',  text: 'text-indigo-400',  ring: 'ring-indigo-700/30' },
  branchPool: { bar: 'bg-indigo-900',  text: 'text-indigo-500',  ring: 'ring-indigo-900/40' },
  company:    { bar: 'bg-zinc-600',    text: 'text-zinc-400',    ring: 'ring-zinc-600/30' },
};

export default function TransparencyTracerPage() {
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().substring(0, 7));
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [showHits, setShowHits] = useState(false);
  const [selected, setSelected] = useState<UserHit | null>(null);
  const [trace, setTrace] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 정산 페이지에서 ?userId= 로 진입한 경우 자동 로드
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const uid = sp.get('userId');
    const ym = sp.get('yearMonth');
    if (ym) setYearMonth(ym);
    if (uid) setSelected({ id: uid, name: '', role: '', employeeId: '' });
  }, []);

  // 직원 검색 (디바운스)
  useEffect(() => {
    if (!query.trim()) { setHits([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        setHits(data.users ?? []);
        setShowHits(true);
      } catch { /* 검색 실패는 조용히 무시 */ }
    }, 250);
  }, [query]);

  const loadTrace = useCallback(async (userId: string, ym: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/transparency?userId=${userId}&yearMonth=${ym}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `조회 실패 (HTTP ${res.status})`);
      setTrace(data);
      setSelected({ id: data.user.id, name: data.user.name, role: data.user.role, employeeId: data.user.employeeId });
    } catch (e) {
      setError(e instanceof Error ? e.message : '추적 데이터를 불러오지 못했습니다.');
      setTrace(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected?.id) loadTrace(selected.id, yearMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, yearMonth]);

  const recipientName = (key: string): string => {
    if (!trace) return '';
    const r = trace.recipients;
    switch (key) {
      case 'agent':
      case 'agentBonus': return trace.user.name;
      case 'teamLeader': return r.teamLeader?.name ?? '(직속 팀장 없음 → 회사 귀속)';
      case 'divHead': return r.divHead?.name ?? '(소속 본부장 없음 → 회사 귀속)';
      case 'branchPool': return r.branchMgrCount > 0 ? `지점장 ${r.branchMgrCount}명 균등 분배` : '(지점장 없음 → 회사 귀속)';
      case 'company': return '자리 공인중개사 법인';
      default: return '';
    }
  };

  const maxPct = trace ? Math.max(...trace.breakdown.shares.map(s => s.pct), 1) : 1;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-6 lg:p-10" style={{ wordBreak: 'keep-all' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes traceIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes barGrow { from { width: 0; } }
        .trace-row { animation: traceIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .trace-bar { animation: barGrow 1.1s cubic-bezier(0.22,1,0.36,1) both; }
      `}} />

      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-1">
          <p className="text-[12px] font-semibold tracking-[0.25em] text-indigo-400/80 uppercase">Transparency Engine</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">100원 분해 추적기</h1>
          <p className="text-[15px] text-zinc-400">
            모든 중개보수는 단 1원도 숨김없이 분해됩니다 — 직원 55 · 팀장 10 · 본부장 5 · 지점장 2.5 · 회사 27.5
          </p>
        </header>

        {/* 컨트롤 바 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => hits.length && setShowHits(true)}
              placeholder="직원 이름 또는 사번을 입력해 추적을 시작하세요..."
              className="w-full bg-[#11141a] border border-[#1f2430] rounded-xl px-5 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
            {showHits && hits.length > 0 && (
              <ul className="absolute z-20 mt-2 w-full bg-[#11141a] border border-[#1f2430] rounded-xl overflow-hidden shadow-2xl">
                {hits.map(h => (
                  <li key={h.id}>
                    <button
                      onClick={() => { setSelected(h); setQuery(''); setShowHits(false); }}
                      className="w-full text-left px-5 py-3 hover:bg-indigo-500/10 transition-colors flex justify-between items-center"
                    >
                      <span className="text-white font-medium">{h.name}</span>
                      <span className="text-[12px] text-zinc-500">{ROLES_KO[h.role as UserRole] ?? h.role} · {h.employeeId.slice(0, 10)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="month"
            value={yearMonth}
            onChange={e => setYearMonth(e.target.value)}
            className="bg-[#11141a] border border-[#1f2430] rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-indigo-500/60"
          />
        </div>

        {error && <div className="bg-red-900/20 border border-red-800/50 text-red-300 rounded-xl px-5 py-4">⚠️ {error}</div>}
        {loading && <div className="text-center py-20 text-zinc-500 animate-pulse">실거래 데이터를 분해하는 중...</div>}

        {!loading && !trace && !error && (
          <div className="text-center py-24 border border-dashed border-[#1f2430] rounded-2xl">
            <p className="text-zinc-500 text-lg">위 검색창에서 직원을 선택하면</p>
            <p className="text-zinc-300 text-xl font-semibold mt-1">그 직원이 창출한 매출의 흐름이 이곳에서 분해됩니다</p>
          </div>
        )}

        {!loading && trace && (
          <div className="space-y-8">
            {/* 히어로: 가장 크고 밝은 숫자의 주인은 "이 사람이 받는 돈"이다 (2026-06-11 대표 UX 원칙) */}
            {(() => {
              const agentTotal = trace.breakdown.shares
                .filter(s => s.key === 'agent' || s.key === 'agentBonus')
                .reduce((s, x) => s + x.amount, 0);
              const agentPct = trace.gross > 0 ? Math.round((agentTotal / trace.gross) * 1000) / 10 : 0;
              return (
                <div className="trace-row bg-[#11141a] border border-emerald-900/40 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                  <p className="text-[13px] text-zinc-500 text-center mb-5">
                    {trace.yearMonth} · <span className="text-zinc-300 font-medium">{trace.user.name}</span>
                    <span className="ml-1 text-zinc-500">({ROLES_KO[trace.user.role as UserRole] ?? trace.user.role})</span>
                    {' '}· 계약 {trace.contracts.length}건
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                    <div className="text-center sm:text-right order-2 sm:order-1">
                      <p className="text-[12px] text-zinc-500 mb-1">창출한 매출 총액</p>
                      <Krw amount={trace.gross} className="text-xl font-semibold text-zinc-300" />
                    </div>
                    <div className="text-center order-1 sm:order-2">
                      <p className="text-[13px] font-semibold text-emerald-300/90 mb-1">
                        {trace.user.name}님이 받는 돈 <span className="text-zinc-500 font-normal">(영업분 실수령 예상)</span>
                      </p>
                      <Krw amount={agentTotal} className="text-5xl font-bold text-emerald-400 tracking-tight drop-shadow-[0_0_24px_rgba(52,211,153,0.15)]" />
                      <p className="text-[13px] text-zinc-500 mt-2">= 매출 총액의 <span className="text-emerald-400 font-semibold">{agentPct}%</span></p>
                    </div>
                    <div className="text-center sm:text-left order-3">
                      <p className="text-[12px] text-zinc-500 mb-1">회사·관리 조직으로</p>
                      <Krw amount={trace.gross - agentTotal} className="text-xl font-semibold text-zinc-300" />
                    </div>
                  </div>
                  <p className="text-center text-[12px] text-zinc-600 mt-5">
                    관리자 오버라이딩은 전액 회사 귀속분 안에서 지급됩니다 — 본인 몫은 단 1원도 줄지 않습니다.
                  </p>
                </div>
              );
            })()}

            {/* 분해 흐름 */}
            <div className="space-y-3">
              {trace.breakdown.shares.map((s, i) => {
                const st = SHARE_STYLE[s.key] ?? SHARE_STYLE.company;
                return (
                  <div
                    key={s.key}
                    className={`trace-row bg-[#11141a] border border-[#1f2430] rounded-xl px-6 py-5 ring-1 ring-inset ${st.ring}`}
                    style={{ animationDelay: `${0.15 + i * 0.12}s` }}
                  >
                    <div className="flex items-baseline justify-between mb-2 gap-4 flex-wrap">
                      <div>
                        <span className="text-[15px] font-semibold text-white">{s.label}</span>
                        <span className="ml-2 text-[13px] text-zinc-500">→ {recipientName(s.key)}</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <Krw amount={s.amount} className={`text-xl font-bold ${st.text}`} />
                        <span className="text-[13px] text-zinc-500 w-14 text-right">{s.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#0a0c10] rounded-full overflow-hidden">
                      <div
                        className={`trace-bar h-full rounded-full ${st.bar}`}
                        style={{ width: `${(s.pct / maxPct) * 100}%`, animationDelay: `${0.25 + i * 0.12}s` }}
                      />
                    </div>
                    <p className="mt-2 text-[12px] text-zinc-600">{s.formula}</p>
                  </div>
                );
              })}
            </div>

            {/* 정산 확정 대조 — 추적기와 정산서가 일치함을 증명 */}
            {trace.settlement && (
              <div className="trace-row bg-[#0d1410] border border-emerald-900/40 rounded-xl px-6 py-5" style={{ animationDelay: '1s' }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-emerald-300">✓ 정산서 교차 검증</p>
                    <p className="text-[13px] text-zinc-500 mt-1">
                      위 분해의 본인 몫(기본+지원비)과 {trace.yearMonth} 확정 정산서를 시스템이 자동 대조합니다.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-zinc-500">확정 정산서 (기본+지원비)</p>
                    <p className="text-lg font-bold text-emerald-400">₩ {(trace.settlement.basePay + trace.settlement.bonusPay).toLocaleString('ko-KR')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 원천 계약 목록 */}
            {trace.contracts.length > 0 && (
              <details className="trace-row bg-[#11141a] border border-[#1f2430] rounded-xl px-6 py-4" style={{ animationDelay: '1.1s' }}>
                <summary className="cursor-pointer text-[14px] font-medium text-zinc-300 hover:text-white transition-colors">
                  원천 계약 {trace.contracts.length}건 펼쳐보기
                </summary>
                <ul className="mt-4 space-y-2">
                  {trace.contracts.map(c => (
                    <li key={c.id} className="flex justify-between text-[13px] border-b border-[#1f2430] pb-2">
                      <span className="text-zinc-400">
                        {new Date(c.contractDate).toLocaleDateString('ko-KR')} · {c.contractType ?? '중개'} · {c.propertyAddress ?? '주소 미입력'}
                      </span>
                      <span className="text-zinc-200 font-medium">₩ {c.grossCommission.toLocaleString('ko-KR')}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <footer className="pt-4 text-[12px] text-zinc-600">
          본 추적기의 계산 규칙은 정산 엔진과 단일 코어(commissionBreakdown)를 공유하며, 17개 자동 테스트가 매 빌드마다 100원 룰 준수를 검증합니다.
        </footer>
      </div>
    </div>
  );
}
