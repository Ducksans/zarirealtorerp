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

const fmt = (n: number) => `₩ ${n.toLocaleString('ko-KR')}`;

/** 급여명세서 한 행 — 항목 좌측 / 금액 우측, 합계만 굵게. 장식 금지. */
function SpecRow({
  label, sub, amount, bold = false, amountClass = 'text-zinc-200', divider = true,
}: {
  label: string; sub?: string; amount: number; bold?: boolean; amountClass?: string; divider?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2.5 ${divider ? 'border-b border-[#1f2430]/60' : ''}`}>
      <div className="min-w-0">
        <span className={`text-[14px] ${bold ? 'font-bold text-white' : 'text-zinc-300'}`}>{label}</span>
        {sub && <span className="ml-2 text-[12px] text-zinc-600">{sub}</span>}
      </div>
      <span className={`shrink-0 text-right text-[14px] ${bold ? 'font-bold' : ''} ${amountClass}`}>{fmt(amount)}</span>
    </div>
  );
}

export default function TransparencyTracerPage() {
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().substring(0, 7));
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [showHits, setShowHits] = useState(false);
  const [selected, setSelected] = useState<UserHit | null>(null);
  const [trace, setTrace] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
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

  const shareAmt = (key: string): number =>
    trace?.breakdown.shares.find(s => s.key === key)?.amount ?? 0;
  const shareFormula = (key: string): string =>
    trace?.breakdown.shares.find(s => s.key === key)?.formula ?? '';

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-6 lg:p-10" style={{ wordBreak: 'keep-all' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes stackGrow { from { width: 0; } }
        .stack-seg { animation: stackGrow 1.1s cubic-bezier(0.22,1,0.36,1) both; }
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

        {!loading && trace && (() => {
          // ── 파생값: 답(Layer 0)을 위한 3구간 합산 ──────────────────────
          const myTotal = shareAmt('agent') + shareAmt('agentBonus');
          const orgTotal = shareAmt('teamLeader') + shareAmt('divHead') + shareAmt('branchPool');
          const companyAmt = shareAmt('company');
          const pctOf = (n: number) => (trace.gross > 0 ? (n / trace.gross) * 100 : 0);
          const settled = trace.settlement ? trace.settlement.basePay + trace.settlement.bonusPay : null;
          const matched = settled !== null && settled === myTotal;
          const r = trace.recipients;

          return (
            <div className="space-y-8">
              {/* ── Layer 0 — 답: 화면을 열면 이것만 보인다 ───────────────── */}
              <section className="bg-[#11141a] border border-[#1f2430] rounded-2xl p-8 text-center">
                <p className="text-[13px] text-zinc-500">
                  {trace.user.name}님의 {trace.yearMonth} 영업분 실수령 예상
                </p>
                <div className="mt-3">
                  <Krw amount={myTotal} className="text-5xl font-bold text-emerald-400 tracking-tight" />
                </div>
                <p className="mt-3 text-[13px] text-zinc-500">
                  계약 {trace.contracts.length}건 · 매출 총액 {fmt(trace.gross)}
                </p>
                {settled !== null && (
                  matched ? (
                    <span className="mt-3 inline-flex items-center rounded-full border border-emerald-700/50 bg-emerald-500/10 px-3 py-1 text-[12px] font-medium text-emerald-400">
                      ✓ 확정 정산서와 일치
                    </span>
                  ) : (
                    <span className="mt-3 inline-flex items-center rounded-full border border-amber-700/50 bg-amber-500/10 px-3 py-1 text-[12px] font-medium text-amber-400">
                      ⚠ 정산서와 차이 있음
                    </span>
                  )
                )}

                {/* 한 줄짜리 분배 스택 바 — 이 화면의 유일한 시각화 */}
                <div className="mt-7">
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#0a0c10]">
                    <div className="stack-seg h-full bg-emerald-500" style={{ width: `${pctOf(myTotal)}%` }} />
                    <div className="stack-seg h-full bg-indigo-500" style={{ width: `${pctOf(orgTotal)}%` }} />
                    <div className="stack-seg h-full bg-zinc-600" style={{ width: `${pctOf(companyAmt)}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                    <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500" />내 몫 {Math.round(pctOf(myTotal) * 10) / 10}%</span>
                    <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-indigo-500" />관리 조직 {Math.round(pctOf(orgTotal) * 10) / 10}%</span>
                    <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-zinc-600" />회사 {Math.round(pctOf(companyAmt) * 10) / 10}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(v => !v)}
                  className="mt-6 rounded-lg border border-[#1f2430] px-4 py-2 text-[13px] text-zinc-400 hover:text-white hover:border-indigo-500/50 transition-colors"
                >
                  {expanded ? '접기 ∧' : '계산 과정 펼쳐보기 ∨'}
                </button>
              </section>

              {expanded && (
                <>
                  {/* ── Layer 1 — 명세서: 종이 급여명세서 문법 ──────────────── */}
                  <section
                    className="bg-[#11141a] border border-[#1f2430] rounded-2xl p-6 sm:p-8"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    <h2 className="text-[15px] font-semibold text-white">계산 명세 — {trace.yearMonth}</h2>

                    <p className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">지급 내역</p>
                    <div className="mt-1">
                      <SpecRow label="기본 지급" sub={shareFormula('agent')} amount={shareAmt('agent')} />
                      <SpecRow label="영업지원비" sub={shareFormula('agentBonus')} amount={shareAmt('agentBonus')} />
                      <SpecRow label="본인 합계" amount={myTotal} bold amountClass="text-emerald-400" divider={false} />
                    </div>

                    <p className="mt-7 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">
                      조직 배분 <span className="normal-case font-normal text-zinc-600">(회사 귀속분에서 지급 — 본인 몫은 줄지 않습니다)</span>
                    </p>
                    <div className="mt-1">
                      <SpecRow
                        label="팀장 오버라이딩"
                        sub={`→ ${r.teamLeader?.name ?? '(없음 → 회사 귀속)'}`}
                        amount={shareAmt('teamLeader')}
                      />
                      <SpecRow
                        label="본부장"
                        sub={`→ ${r.divHead?.name ?? '(없음 → 회사 귀속)'}`}
                        amount={shareAmt('divHead')}
                      />
                      <SpecRow
                        label={r.branchMgrCount > 0 ? `지점장 풀 (${r.branchMgrCount}명 균등)` : '지점장 풀'}
                        sub={r.branchMgrCount > 0 ? `→ ${r.branchMgrs.map(m => m.name).join(', ')}` : '→ (없음 → 회사 귀속)'}
                        amount={shareAmt('branchPool')}
                      />
                      <SpecRow label="회사 운영분" sub="→ 자리 공인중개사 법인" amount={companyAmt} />
                      <SpecRow label="매출 총액 (검산)" amount={trace.gross} bold amountClass="text-white" divider={false} />
                    </div>
                  </section>

                  {/* ── Layer 2 — 원천: 명세서의 근거가 된 실계약 ──────────── */}
                  {trace.contracts.length > 0 && (
                    <details className="bg-[#11141a] border border-[#1f2430] rounded-xl px-6 py-4">
                      <summary className="cursor-pointer text-[14px] font-medium text-zinc-300 hover:text-white transition-colors">
                        원천 계약 {trace.contracts.length}건 펼쳐보기
                      </summary>
                      <ul className="mt-4 space-y-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {trace.contracts.map(c => (
                          <li key={c.id} className="flex justify-between text-[13px] border-b border-[#1f2430] pb-2">
                            <span className="text-zinc-400">
                              {new Date(c.contractDate).toLocaleDateString('ko-KR')} · {c.contractType ?? '중개'} · {c.propertyAddress ?? '주소 미입력'}
                            </span>
                            <span className="text-zinc-200 font-medium text-right">{fmt(c.grossCommission)}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </div>
          );
        })()}

        <footer className="pt-4 text-[12px] text-zinc-600">
          본 추적기의 계산 규칙은 정산 엔진과 단일 코어(commissionBreakdown)를 공유하며, 17개 자동 테스트가 매 빌드마다 100원 룰 준수를 검증합니다.
        </footer>
      </div>
    </div>
  );
}
