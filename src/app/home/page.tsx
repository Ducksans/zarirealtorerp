/*---
id: home_page
milestone: M10
why: 영업사원용 모바일 홈 피드 — 폰을 열면 첫 화면 첫 숫자가 "이번 달 내가 받을 돈"이 되도록, 카드 하나에 메시지 하나(1 thing for 1 page)로 구성한 A/B 테스트 전장 ② 화면
backlinks: [[SSOT_Commission_100won_Rule.md]], [[home_api]], [[admin_transparency_page]]
---*/

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPayoutRate } from '@/lib/commissionBreakdown';
import { ROLES, ROLES_KO, type UserRole } from '@/types';
import AssistantPanel from '@/components/assistant/AssistantPanel';

type Share = { key: string; label: string; amount: number; pct: number; formula: string };
type HomeData = {
  user: { id: string; name: string; role: string; employeeId: string };
  yearMonth: string;
  thisMonth: { gross: number; contractCount: number; breakdown: { shares: Share[] } };
  lastMonth: { gross: number };
  settlement: { totalPay: number; signatureStatus: string; paymentStatus: string } | null;
  overrideIncome: number;
  downlineCount: number;
  recentContracts: {
    id: string; grossCommission: number; contractDate: string;
    propertyAddress: string | null; contractType: string | null;
  }[];
};
type UserHit = { id: string; name: string; role: string; employeeId: string };

const fmt = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

/** rAF 카운트업 — 0.9초, ease-out cubic (숫자가 도착하는 순간에만 절제된 모션) */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-[#11141a] border border-[#1f2430] p-5 ${className}`}>
      {children}
    </section>
  );
}

/** 가상 팀원 1명의 월 매출 가정 */
const SIM_MEMBER_GROSS = 6_000_000;
/** 사원 회사귀속분 비율 = 1 - 사원 지급율(50%) */
const SIM_COMP_RATE = 1 - getPayoutRate(ROLES.REGULAR);

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 데모 직원 검색 (M2 인증 전)
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // 오버라이딩 시뮬레이터
  const [simN, setSimN] = useState(3);

  // AI 보좌관 패널 토글
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('demoUserId');
    if (saved) setUserId(saved);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setHits([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(query.trim())}&limit=8`);
        if (!res.ok) return;
        const json = await res.json();
        setHits((json.users ?? []).map((u: UserHit) => ({
          id: u.id, name: u.name, role: u.role, employeeId: u.employeeId,
        })));
      } catch { /* 검색 실패는 조용히 무시 */ }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const loadHome = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/home?userId=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '데이터를 불러오지 못했습니다.');
      setData(json as HomeData);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadHome(userId);
  }, [userId, loadHome]);

  const pickUser = (u: UserHit) => {
    localStorage.setItem('demoUserId', u.id);
    setUserId(u.id);
    setQuery('');
    setHits([]);
    setSearchOpen(false);
  };

  // ===== 파생 값 =====
  const shares = data?.thisMonth.breakdown.shares ?? [];
  const myBase = shares.find(s => s.key === 'agent')?.amount ?? 0;
  const myBonus = shares.find(s => s.key === 'agentBonus')?.amount ?? 0;
  const salesPay = myBase + myBonus;
  const myTotal = salesPay + (data?.overrideIncome ?? 0);
  const heroValue = useCountUp(myTotal);

  const role = (data?.user.role ?? ROLES.REGULAR) as UserRole;
  const roleKo = ROLES_KO[role] ?? data?.user.role ?? '';

  // 전월 대비
  const thisGross = data?.thisMonth.gross ?? 0;
  const lastGross = data?.lastMonth.gross ?? 0;
  const deltaPct = lastGross > 0 ? Math.round(((thisGross - lastGross) / lastGross) * 1000) / 10 : null;

  // 시뮬레이터: 직급별 팀원 1명당 월 오버라이딩
  const simRate = role === ROLES.TEAM_LEADER ? 0.2 : role === ROLES.DIV_HEAD ? 0.1 : 0;
  const simPerMember = Math.floor(SIM_MEMBER_GROSS * SIM_COMP_RATE * simRate);
  const simTotal = simN * simPerMember;

  return (
    <main className="min-h-screen bg-[#0a0c10] text-[#cdd2da] break-keep">
      <div className="mx-auto max-w-md px-4 pb-12 pt-6 flex flex-col gap-4">

        {/* ===== 데모 직원 선택 (M2 인증 전) ===== */}
        <div className="relative">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder={data ? `${data.user.name} ${roleKo} · 다른 직원 검색` : '직원 이름 검색 (데모 모드)'}
            className="w-full rounded-xl bg-[#11141a] border border-[#1f2430] px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60"
          />
          {searchOpen && hits.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-xl bg-[#11141a] border border-[#1f2430] overflow-hidden shadow-xl">
              {hits.map(u => (
                <li key={u.id}>
                  <button
                    onClick={() => pickUser(u)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#1f2430] flex items-center justify-between"
                  >
                    <span>{u.name} <span className="text-zinc-500">{ROLES_KO[u.role as UserRole] ?? u.role}</span></span>
                    <span className="text-xs text-zinc-500">{u.employeeId.slice(0, 8)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ===== 상태: 미선택 / 로딩 / 에러 ===== */}
        {!userId && !loading && (
          <Card className="text-center py-10">
            <p className="text-lg font-semibold text-white">내 홈 피드</p>
            <p className="mt-2 text-sm text-zinc-400">위 검색창에서 직원을 선택하면<br />이번 달 받을 돈이 바로 표시됩니다.</p>
          </Card>
        )}

        {loading && (
          <div className="flex flex-col gap-4" aria-label="로딩 중">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl bg-[#11141a] border border-[#1f2430] p-5 animate-pulse">
                <div className="h-4 w-32 rounded bg-[#1f2430]" />
                <div className="mt-4 h-10 w-48 rounded bg-[#1f2430]" />
                <div className="mt-3 h-3 w-40 rounded bg-[#1f2430]" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <Card className="text-center py-8">
            <p className="text-sm text-zinc-300">불러오기에 실패했습니다.</p>
            <p className="mt-1 text-xs text-zinc-500">{error}</p>
            {userId && (
              <button
                onClick={() => loadHome(userId)}
                className="mt-4 rounded-lg border border-[#1f2430] px-4 py-2 text-sm hover:bg-[#1f2430]"
              >다시 시도</button>
            )}
          </Card>
        )}

        {data && !loading && !error && (
          <>
            {/* ===== 1. 히어로: 이번 달 받을 돈 ===== */}
            <Card>
              <p className="text-sm text-zinc-400">{data.user.name}님, 이번 달 받을 돈</p>
              <p className="mt-2 text-4xl sm:text-5xl font-bold text-emerald-400 tabular-nums tracking-tight">
                {fmt(heroValue)}
              </p>
              <p className="mt-3 text-xs text-zinc-500 tabular-nums">
                영업분 {fmt(salesPay)} + 오버라이딩 {fmt(data.overrideIncome)}
              </p>
              {data.settlement && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#0a0c10] border border-[#1f2430] px-3 py-2">
                  <span className="text-xs text-zinc-400">
                    확정 정산서: <span className="font-bold text-white tabular-nums">{fmt(data.settlement.totalPay)}</span>
                  </span>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5">
                    {data.settlement.paymentStatus === 'PAID' ? '지급 완료' : data.settlement.signatureStatus === 'SIGNED' ? '서명 완료' : '정산 확정'}
                  </span>
                </div>
              )}
            </Card>

            {/* ===== 2. 이번 달 실적 ===== */}
            <Card>
              <p className="text-sm text-zinc-400">이번 달 실적 <span className="text-zinc-600">· {data.yearMonth}</span></p>
              <p className="mt-2 text-xl font-semibold text-white tabular-nums">
                계약 {data.thisMonth.contractCount}건 · 매출 {fmt(thisGross)}
              </p>
              {deltaPct === null ? (
                <p className="mt-2 text-xs text-zinc-500">전월 실적 없음</p>
              ) : (
                <p className={`mt-2 text-xs tabular-nums ${deltaPct >= 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {deltaPct >= 0 ? '▲' : '▼'} 전월 대비 {deltaPct >= 0 ? '+' : ''}{deltaPct}%
                </p>
              )}
            </Card>

            {/* ===== 3. 오버라이딩 시뮬레이터 ===== */}
            <Card className="border-indigo-500/30">
              <p className="text-sm text-indigo-300 font-medium">팀원이 늘면 내 수입은?</p>

              {role === ROLES.REGULAR && (
                <div className="mt-3">
                  <p className="text-sm text-zinc-300">
                    팀장 진급 시 <span className="text-indigo-400 font-semibold tabular-nums">팀원 1명당 월 +₩600,000</span>
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    진급 조건: 누적 회사 입금분 3,600만 원 달성 시 팀장 승격 대상
                  </p>
                </div>
              )}

              {role === ROLES.BRANCH_MGR && (
                <p className="mt-3 text-sm text-zinc-400">
                  지점장 풀(5%)은 전사 매출 기준으로 분배되어 시뮬레이션 대상이 아닙니다.
                  현재 직속 라인 {data.downlineCount}명.
                </p>
              )}

              {(role === ROLES.TEAM_LEADER || role === ROLES.DIV_HEAD) && (
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSimN(n => Math.max(0, n - 1))}
                      className="h-9 w-9 rounded-lg border border-[#1f2430] text-lg text-zinc-300 hover:bg-[#1f2430]"
                      aria-label="가상 팀원 줄이기"
                    >−</button>
                    <span className="min-w-[5.5rem] text-center text-sm text-zinc-300 tabular-nums">
                      가상 팀원 <span className="font-bold text-white">{simN}</span>명
                    </span>
                    <button
                      onClick={() => setSimN(n => Math.min(10, n + 1))}
                      className="h-9 w-9 rounded-lg border border-[#1f2430] text-lg text-zinc-300 hover:bg-[#1f2430]"
                      aria-label="가상 팀원 늘리기"
                    >+</button>
                  </div>
                  <input
                    type="range" min={0} max={10} value={simN}
                    onChange={e => setSimN(Number(e.target.value))}
                    className="mt-3 w-full accent-indigo-500"
                    aria-label="가상 팀원 수"
                  />
                  <p className="mt-3 text-2xl font-bold text-indigo-400 tabular-nums">
                    +{fmt(simTotal)} / 월
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 tabular-nums">
                    팀원 1명당 월 매출 600만 가정 × 회사귀속분 {SIM_COMP_RATE * 100}% × {roleKo} 오버라이딩 {simRate * 100}%
                  </p>
                </div>
              )}
            </Card>

            {/* ===== 4. 최근 계약 ===== */}
            <Card>
              <p className="text-sm text-zinc-400">최근 계약</p>
              {data.recentContracts.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">이번 달 등록된 계약이 아직 없습니다.</p>
              ) : (
                <ul className="mt-3 divide-y divide-[#1f2430]">
                  {data.recentContracts.map(c => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-500 tabular-nums">
                          {new Date(c.contractDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                          {c.contractType ? ` · ${c.contractType}` : ''}
                        </p>
                        {c.propertyAddress && (
                          <p className="mt-0.5 truncate text-sm text-zinc-300">{c.propertyAddress}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-right text-sm text-white tabular-nums">
                        {fmt(c.grossCommission)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* ===== 5. 풋터 ===== */}
            <footer className="px-2 pt-1 text-center">
              <p className="text-[11px] text-zinc-600">
                모든 금액은 100원 룰 정산 엔진과 동일한 규칙으로 계산됩니다
              </p>
              <a
                href={`/admin/transparency?userId=${data.user.id}`}
                className="mt-1.5 inline-block text-xs text-indigo-400 hover:text-indigo-300"
              >
                내 돈의 흐름 추적하기 →
              </a>
            </footer>
          </>
        )}
      </div>

      {/* ===== AI 보좌관 (선택된 직원이 있을 때만) ===== */}
      {data && !loading && (
        <>
          {!assistantOpen && (
            <button
              onClick={() => setAssistantOpen(true)}
              aria-label="AI 보좌관 열기"
              className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center
                         rounded-full bg-indigo-600 text-2xl shadow-lg shadow-indigo-900/50 hover:bg-indigo-500"
            >💬</button>
          )}
          {assistantOpen && (
            <AssistantPanel
              userId={data.user.id}
              userName={data.user.name}
              onClose={() => setAssistantOpen(false)}
            />
          )}
        </>
      )}
    </main>
  );
}
