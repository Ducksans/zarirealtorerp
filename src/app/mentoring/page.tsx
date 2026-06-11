/*---
id: mentoring_page
milestone: M17
why: 멘토링 대시보드 — "멘티를 키우는 것이 곧 내 수입"을 답 먼저(이번 달 내 오버라이딩 합계) 보여주고, 멘티별 기여·휴면 경고로 관리 행동을 유도하는 팀장/본부장 화면
backlinks: [[mentoring_api]], [[SSOT_Commission_100won_Rule.md]], [[home_page]]
---*/

/**
 * @file src/app/mentoring/page.tsx
 * @description M17 멘토링 대시보드 (관리자/팀장용)
 * @purpose 답 먼저 — 이번 달 내 오버라이딩 합계(큰 인디고 숫자).
 *          멘티별 매출·전월比 추세·나에게 만들어준 오버라이딩·휴면 경고(앰버)·하단 인사이트 한 줄.
 *          오버라이딩은 회사 귀속분에서 지급 — 멘티 몫 불변 (각주 필수).
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { breakdownGross } from '@/lib/commissionBreakdown';
import { ROLES, ROLES_KO, type UserRole } from '@/types';

type MenteeRow = {
  id: string;
  name: string;
  role: string;
  employeeId: string;
  gross: number;
  contractCount: number;
  lastMonthGross: number;
  overrideToMe: number;
  lastContractDate: string | null;
};

type MentoringData = {
  user: { id: string; name: string; role: string; employeeId: string };
  yearMonth: string;
  downlines: MenteeRow[];
  totals: { gross: number; contractCount: number; lastMonthGross: number; overrideToMe: number };
};

type UserHit = { id: string; name: string; role: string; employeeId: string };

const fmt = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

/** 휴면 멘티 1명이 살아나면(월 600만 가정) 멘토에게 생기는 오버라이딩 */
const SIM_MEMBER_GROSS = 6_000_000;

function estOverride(viewerRole: string, menteeRole: string, gross: number): number {
  const shares = breakdownGross(menteeRole, gross).shares;
  if (viewerRole === ROLES.TEAM_LEADER) return shares.find((s) => s.key === 'teamLeader')?.amount ?? 0;
  if (viewerRole === ROLES.DIV_HEAD) return shares.find((s) => s.key === 'divHead')?.amount ?? 0;
  return 0;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-[#11141a] border border-[#1f2430] p-5 ${className}`}>
      {children}
    </section>
  );
}

export default function MentoringPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<MentoringData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 데모 모드 유저 검색 (/home 패턴)
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const loadMentoring = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mentoring?userId=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '데이터를 불러오지 못했습니다.');
      setData(json as MentoringData);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadMentoring(userId);
  }, [userId, loadMentoring]);

  const pickUser = (u: UserHit) => {
    localStorage.setItem('demoUserId', u.id);
    setUserId(u.id);
    setQuery('');
    setHits([]);
    setSearchOpen(false);
  };

  // ===== 파생 값 =====
  const viewerRole = (data?.user.role ?? '') as UserRole | '';
  const viewerRoleKo = viewerRole ? (ROLES_KO[viewerRole as UserRole] ?? viewerRole) : '';
  const isMentorRole = viewerRole === ROLES.TEAM_LEADER || viewerRole === ROLES.DIV_HEAD;

  const dormant = useMemo(
    () => (data?.downlines ?? []).filter((d) => d.contractCount === 0),
    [data]
  );

  // 인사이트: 휴면 멘티가 각자 월 600만을 만들면 내 오버라이딩 예상 증가분
  const dormantPotential = useMemo(() => {
    if (!data) return 0;
    return dormant.reduce((sum, d) => sum + estOverride(data.user.role, d.role, SIM_MEMBER_GROSS), 0);
  }, [data, dormant]);

  return (
    <main className="min-h-screen bg-[#0a0c10] text-[#cdd2da] break-keep">
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 flex flex-col gap-4">

        <header>
          <h1 className="text-lg font-bold text-white">멘토링 대시보드</h1>
          <p className="mt-0.5 text-xs text-zinc-500">멘티를 키우는 것이 곧 내 수입입니다</p>
        </header>

        {/* ===== 데모 유저 검색 (/home 패턴) ===== */}
        <div className="relative">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder={data ? `${data.user.name} ${viewerRoleKo} · 다른 직원 검색` : '직원 이름 검색 (데모 모드)'}
            className="w-full rounded-xl bg-[#11141a] border border-[#1f2430] px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60"
          />
          {searchOpen && hits.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-xl bg-[#11141a] border border-[#1f2430] overflow-hidden shadow-xl">
              {hits.map((u) => (
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
            <p className="text-lg font-semibold text-white">내 멘토링 현황</p>
            <p className="mt-2 text-sm text-zinc-400">위 검색창에서 팀장/본부장을 선택하면<br />이번 달 오버라이딩 합계가 바로 표시됩니다.</p>
          </Card>
        )}

        {loading && (
          <div className="flex flex-col gap-4" aria-label="로딩 중">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-[#11141a] border border-[#1f2430] p-5 animate-pulse">
                <div className="h-4 w-32 rounded bg-[#1f2430]" />
                <div className="mt-4 h-10 w-48 rounded bg-[#1f2430]" />
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
                onClick={() => loadMentoring(userId)}
                className="mt-4 rounded-lg border border-[#1f2430] px-4 py-2 text-sm hover:bg-[#1f2430]"
              >다시 시도</button>
            )}
          </Card>
        )}

        {data && !loading && !error && (
          <>
            {/* ===== 1. 답 먼저: 이번 달 내 오버라이딩 합계 ===== */}
            <Card className="border-indigo-500/30">
              <p className="text-sm text-zinc-400">
                {data.user.name} {viewerRoleKo}님, 이번 달 내 오버라이딩 합계 <span className="text-zinc-600">· {data.yearMonth}</span>
              </p>
              <p className="mt-2 text-4xl sm:text-5xl font-bold text-indigo-400 tabular-nums tracking-tight">
                {fmt(data.totals.overrideToMe)}
              </p>
              <p className="mt-3 text-xs text-zinc-500 tabular-nums">
                직속 멘티 {data.downlines.length}명 · 멘티 매출 합 {fmt(data.totals.gross)} · 계약 {data.totals.contractCount}건
              </p>
              {!isMentorRole && (
                <p className="mt-2 text-xs text-amber-400/90">
                  {viewerRole === ROLES.BRANCH_MGR
                    ? '지점장 풀(5%)은 전사 매출 기준 분배라 멘티별 합산 대상이 아닙니다.'
                    : '사원은 오버라이딩 수령 대상이 아닙니다. 팀장 진급 시 멘티 회사귀속분의 20%가 지급됩니다.'}
                </p>
              )}
            </Card>

            {/* ===== 2. 다운라인(멘티) 카드 목록 ===== */}
            {data.downlines.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-sm text-zinc-400">직속 멘티가 없습니다.</p>
                <p className="mt-1 text-xs text-zinc-500">팀원이 합류하면 이곳에서 멘티별 기여가 표시됩니다.</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {data.downlines.map((d) => {
                  const deltaPct = d.lastMonthGross > 0
                    ? Math.round(((d.gross - d.lastMonthGross) / d.lastMonthGross) * 1000) / 10
                    : null;
                  const isDormant = d.contractCount === 0;
                  return (
                    <Card key={d.id} className={isDormant ? 'border-amber-500/40' : ''}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {d.name} <span className="text-xs font-normal text-zinc-500">{ROLES_KO[d.role as UserRole] ?? d.role}</span>
                          </p>
                          <p className="mt-1 text-sm text-zinc-300 tabular-nums">
                            매출 {fmt(d.gross)} · 계약 {d.contractCount}건
                          </p>
                          {deltaPct === null ? (
                            <p className="mt-1 text-xs text-zinc-500">전월 실적 없음</p>
                          ) : (
                            <p className={`mt-1 text-xs tabular-nums ${deltaPct >= 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                              {deltaPct >= 0 ? '▲' : '▼'} 전월 대비 {deltaPct >= 0 ? '+' : ''}{deltaPct}%
                            </p>
                          )}
                        </div>
                        {isDormant && (
                          <span className="shrink-0 rounded-full bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                            관리 필요
                          </span>
                        )}
                      </div>

                      {/* 이 멘티가 나에게 만들어준 오버라이딩 */}
                      <div className="mt-3 rounded-lg bg-[#0a0c10] border border-[#1f2430] px-3 py-2.5 flex items-center justify-between">
                        <span className="text-xs text-zinc-400">이 멘티가 나에게 만들어준 오버라이딩</span>
                        <span className="text-sm font-bold text-indigo-400 tabular-nums">{fmt(d.overrideToMe)}</span>
                      </div>

                      <p className="mt-2 text-[11px] text-zinc-600 tabular-nums">
                        마지막 계약: {d.lastContractDate
                          ? new Date(d.lastContractDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' })
                          : '기록 없음'}
                      </p>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ===== 3. 인사이트 한 줄 ===== */}
            {dormant.length > 0 && isMentorRole && (
              <Card className="border-amber-500/30">
                <p className="text-sm text-amber-300">
                  휴면 멘티 {dormant.length}명 활성화 시 예상 <span className="font-bold tabular-nums">+{fmt(dormantPotential)}</span> / 월
                </p>
                <p className="mt-1 text-xs text-zinc-500">멘티 1인 월 매출 600만 원 가정 — 이번 주 1:1 면담을 잡아보세요.</p>
              </Card>
            )}

            {/* ===== 4. 각주 (필수) ===== */}
            <footer className="px-2 pt-1 text-center">
              <p className="text-[11px] text-zinc-600">
                오버라이딩은 회사 귀속분에서 지급됩니다 — 멘티 몫은 변하지 않습니다.
                모든 금액은 100원 룰 정산 엔진과 동일한 규칙으로 계산됩니다.
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
