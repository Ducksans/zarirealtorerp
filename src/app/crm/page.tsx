/*---
id: crm/page.tsx
milestone: M10
why: CRM 허브 — 이번 달 계약·매출·활성 고객·예정 일정 4지표(실데이터) + 하위 메뉴 카드(목업 정직 표기)
backlinks: [[[Pages]], [[api/contracts/route.ts]], [[api/customers/route.ts]], [[api/appointments/route.ts]]]
---*/

/**
 * @file src/app/crm/page.tsx
 * @description CRM 허브 — "이번 달 계약 N건 · 매출 ₩X · 활성 고객 N · 예정 일정 N" 답 먼저,
 *              실제화된 메뉴(파이프라인/리드/매칭)와 목업 메뉴(콜/컬렉션/지도/매물등록)를 정직하게 구분 표기
 * @dependencies /api/contracts (GET ?month=), /api/customers (GET), /api/appointments (GET ?from=&status=)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ContractRow = { id: string; grossCommission: number };

type Metrics = {
  contractCount: number;
  revenue: number;
  activeCustomers: number;
  upcomingAppointments: number;
};

/** 원 단위 금액 → "12억 3,000만" 한국어 축약 표기 */
function formatKoreanPrice(won: number): string {
  if (won === 0) return '0원';
  if (won < 10000) return `${won.toLocaleString('ko-KR')}원`;
  const eok = Math.floor(won / 100_000_000);
  const man = Math.floor((won % 100_000_000) / 10_000);
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`);
  return parts.join(' ');
}

const currentYearMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

type MenuItem = {
  href: string;
  title: string;
  desc: string;
  live: boolean;
};

const MENU: MenuItem[] = [
  { href: '/crm/pipeline', title: '계약 파이프라인', desc: '서명 → 지급까지 칸반으로 단계 처리', live: true },
  { href: '/crm/leads', title: '리드 보드', desc: '고객 유형별(임차/매수/임대/매도) 보드 + 신규 등록', live: true },
  { href: '/crm/matching', title: '매물 매칭', desc: '매수·임차 고객 ↔ 활성 매물 연결, 일정 잡기', live: true },
  { href: '/crm/calls', title: '콜 센터 (CTI)', desc: '수신 전화 팝업·통화 메모', live: false },
  { href: '/crm/collections', title: 'VIP 컬렉션 보드', desc: '고객 공유용 매물 컬렉션·채팅', live: false },
  { href: '/crm/map', title: '상권 지도 탐색', desc: '폴리곤 상권 매물 탐색기', live: false },
  { href: '/crm/property/new', title: '매물 자동 등록', desc: '주소 기반 건축물대장 자동 채움', live: false },
];

export default function CrmHubPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const month = currentYearMonth();

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nowIso = new Date().toISOString();
      const [contractsRes, customersRes, apptsRes] = await Promise.all([
        fetch(`/api/contracts?month=${month}&limit=500`),
        fetch('/api/customers?limit=1'),
        fetch(`/api/appointments?from=${encodeURIComponent(nowIso)}&status=SCHEDULED`),
      ]);
      if (!contractsRes.ok || !customersRes.ok || !apptsRes.ok) {
        throw new Error('CRM 지표를 불러오지 못했습니다.');
      }
      const [contractsData, customersData, apptsData] = await Promise.all([
        contractsRes.json(),
        customersRes.json(),
        apptsRes.json(),
      ]);
      const contracts: ContractRow[] = contractsData.contracts || [];
      setMetrics({
        contractCount: contractsData.total ?? contracts.length,
        revenue: contracts.reduce((sum, c) => sum + (c.grossCommission || 0), 0),
        activeCustomers: customersData.summary?.active ?? 0,
        upcomingAppointments: apptsData.total ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CRM 지표를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const [y, m] = month.split('-');

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <header>
          <h1 className="text-2xl font-bold text-white tracking-tight">CRM</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {y}년 {Number(m)}월 영업 현황 — 계약·고객·일정 한눈에
          </p>
        </header>

        {/* 답 먼저: 4지표 */}
        {error ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-10 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button onClick={fetchMetrics} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              다시 시도
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
              <p className="text-xs text-zinc-500 mb-2">이번 달 계약</p>
              <p className="text-3xl font-bold text-white tabular-nums">
                {loading ? '—' : metrics?.contractCount ?? 0}
                <span className="text-base font-medium text-zinc-500 ml-1">건</span>
              </p>
            </div>
            <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
              <p className="text-xs text-zinc-500 mb-2">이번 달 매출 (중개보수 합계)</p>
              <p className="text-3xl font-bold text-emerald-400 tabular-nums">
                {loading ? '—' : formatKoreanPrice(metrics?.revenue ?? 0)}
              </p>
            </div>
            <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
              <p className="text-xs text-zinc-500 mb-2">활성 고객</p>
              <p className="text-3xl font-bold text-white tabular-nums">
                {loading ? '—' : metrics?.activeCustomers ?? 0}
                <span className="text-base font-medium text-zinc-500 ml-1">명</span>
              </p>
            </div>
            <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
              <p className="text-xs text-zinc-500 mb-2">예정 일정</p>
              <p className="text-3xl font-bold text-amber-400 tabular-nums">
                {loading ? '—' : metrics?.upcomingAppointments ?? 0}
                <span className="text-base font-medium text-zinc-500 ml-1">건</span>
              </p>
            </div>
          </section>
        )}

        {/* 하위 메뉴 */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">메뉴</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block bg-[#11141a] border rounded-xl p-5 transition-colors ${
                  item.live
                    ? 'border-[#1f2430] hover:border-indigo-500/50'
                    : 'border-[#1f2430] opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  {item.live ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                      실데이터
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">
                      목업
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
