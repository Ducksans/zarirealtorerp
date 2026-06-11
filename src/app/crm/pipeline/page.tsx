/*---
id: crm/pipeline/page.tsx
milestone: M10
why: 계약 파이프라인 칸반 — 서명 대기 → 지급 대기 → 지급 완료(+미지급 보류) 단계 처리 (실데이터)
backlinks: [[[Pages]], [[api/contracts/route.ts]], [[crm/page.tsx]]]
---*/

/**
 * @file src/app/crm/pipeline/page.tsx
 * @description 계약 파이프라인 칸반 — 월 선택 + 상단 합계(건수·총 보수액),
 *              4컬럼: 서명 대기(PENDING/PENDING) → 지급 대기(SIGNED/PENDING) → 지급 완료(SIGNED/PAID) → 미지급 보류(NON_PAID).
 *              카드 버튼으로 다음 단계 처리(사유 prompt → PATCH /api/contracts/[id])
 * @dependencies /api/contracts (GET ?month=&withDocs=1, PATCH [id])
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ContractRow = {
  id: string;
  agentId: string;
  propertyAddress: string | null;
  clientName: string | null;
  contractType: string | null;
  grossCommission: number;
  contractDate: string;
  signatureStatus: 'PENDING' | 'SIGNED';
  paymentStatus: 'PENDING' | 'PAID' | 'NON_PAID';
  agent: { name: string; role: string; employeeId: string } | null;
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

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });

const currentYearMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/** YYYY-MM 문자열에 delta(개월)를 더한다 */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

type ColumnKey = 'SIGN_WAIT' | 'PAY_WAIT' | 'PAID' | 'NON_PAID';

const COLUMNS: {
  key: ColumnKey;
  title: string;
  accent: string; // 헤더 텍스트 색
  badge: string; // 건수 뱃지 색
}[] = [
  { key: 'SIGN_WAIT', title: '서명 대기', accent: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400' },
  { key: 'PAY_WAIT', title: '서명 완료 · 지급 대기', accent: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400' },
  { key: 'PAID', title: '지급 완료', accent: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400' },
  { key: 'NON_PAID', title: '미지급 보류', accent: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400' },
];

function columnOf(c: ContractRow): ColumnKey {
  if (c.paymentStatus === 'NON_PAID') return 'NON_PAID';
  if (c.paymentStatus === 'PAID') return 'PAID';
  if (c.signatureStatus === 'SIGNED') return 'PAY_WAIT';
  return 'SIGN_WAIT';
}

export default function ContractPipelinePage() {
  const [month, setMonth] = useState(currentYearMonth());
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts?month=${month}&withDocs=1&limit=200`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '계약 목록을 불러오지 못했습니다.');
      }
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '계약 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  /** 상태 변경: 사유 prompt → PATCH → 재조회 */
  const patchStatus = async (
    id: string,
    patch: { signatureStatus?: 'SIGNED'; paymentStatus?: 'PAID' | 'NON_PAID' },
    promptLabel: string
  ) => {
    const reason = window.prompt(`${promptLabel} — 변경 사유를 입력하세요.`);
    if (!reason || !reason.trim()) return;
    setPatchingId(id);
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '상태 변경에 실패했습니다.');
      }
      await fetchContracts();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '상태 변경에 실패했습니다.');
    } finally {
      setPatchingId(null);
    }
  };

  const grouped: Record<ColumnKey, ContractRow[]> = {
    SIGN_WAIT: [],
    PAY_WAIT: [],
    PAID: [],
    NON_PAID: [],
  };
  contracts.forEach((c) => grouped[columnOf(c)].push(c));

  const totalCommission = contracts.reduce((sum, c) => sum + (c.grossCommission || 0), 0);
  const paidCommission = grouped.PAID.reduce((sum, c) => sum + (c.grossCommission || 0), 0);
  const [y, m] = month.split('-');

  const actionBtn =
    'w-full mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50';

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-[1500px] mx-auto space-y-6">
        {/* 헤더 + 월 선택 */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <Link href="/crm" className="text-xs text-indigo-400 hover:text-indigo-300">
              ← CRM 홈
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">계약 파이프라인</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {y}년 {Number(m)}월 — 서명 → 지급까지 단계별 처리
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth((prev) => shiftMonth(prev, -1))}
              className="px-3 py-2 rounded-lg text-sm bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white transition-colors"
              aria-label="이전 달"
            >
              ←
            </button>
            <input
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="bg-[#11141a] border border-[#1f2430] rounded-lg px-3 py-2 text-sm text-[#cdd2da] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => setMonth((prev) => shiftMonth(prev, 1))}
              className="px-3 py-2 rounded-lg text-sm bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white transition-colors"
              aria-label="다음 달"
            >
              →
            </button>
          </div>
        </header>

        {/* 답 먼저: 상단 합계 */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">이번 달 계약</p>
            <p className="text-3xl font-bold text-white tabular-nums">
              {loading ? '—' : contracts.length}
              <span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </p>
          </div>
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">총 중개보수</p>
            <p className="text-3xl font-bold text-white tabular-nums">
              {loading ? '—' : formatKoreanPrice(totalCommission)}
            </p>
          </div>
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">지급 완료액</p>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">
              {loading ? '—' : formatKoreanPrice(paidCommission)}
            </p>
          </div>
        </section>

        {/* 칸반 보드 */}
        {loading ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            계약 파이프라인을 불러오는 중...
          </div>
        ) : error ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button onClick={fetchContracts} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              다시 시도
            </button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            {y}년 {Number(m)}월에 등록된 계약이 없습니다. 다른 달을 선택해 보세요.
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {COLUMNS.map((col) => {
              const items = grouped[col.key];
              const colSum = items.reduce((sum, c) => sum + (c.grossCommission || 0), 0);
              return (
                <div key={col.key} className="bg-[#11141a] border border-[#1f2430] rounded-xl flex flex-col">
                  <div className="px-4 py-3 border-b border-[#1f2430] flex items-center justify-between">
                    <h2 className={`text-sm font-semibold ${col.accent}`}>{col.title}</h2>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${col.badge}`}>
                      {items.length}건
                    </span>
                  </div>
                  <div className="px-4 py-2 border-b border-[#1f2430] text-right text-xs text-zinc-500 tabular-nums">
                    소계 {formatKoreanPrice(colSum)}
                  </div>
                  <div className="p-3 space-y-3 min-h-[80px]">
                    {items.length === 0 && (
                      <p className="text-center text-xs text-zinc-600 py-6">해당 단계 계약 없음</p>
                    )}
                    {items.map((c) => (
                      <div key={c.id} className="bg-[#0a0c10] border border-[#1f2430] rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-white text-sm">{c.clientName || '고객 미지정'}</p>
                          <span className="text-xs text-zinc-500 tabular-nums shrink-0">
                            {dateLabel(c.contractDate)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-2">{c.propertyAddress || '주소 미입력'}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">
                            {c.agent?.name ?? '담당 미지정'}
                            {c.contractType && <span className="ml-1 text-zinc-600">· {c.contractType}</span>}
                          </span>
                          <span className="text-white font-semibold tabular-nums text-right">
                            {formatKoreanPrice(c.grossCommission)}
                          </span>
                        </div>

                        {col.key === 'SIGN_WAIT' && (
                          <button
                            disabled={patchingId === c.id}
                            onClick={() => patchStatus(c.id, { signatureStatus: 'SIGNED' }, '서명 완료 처리')}
                            className={`${actionBtn} bg-indigo-600 hover:bg-indigo-500 text-white`}
                          >
                            {patchingId === c.id ? '처리 중...' : '서명 완료 처리 →'}
                          </button>
                        )}
                        {col.key === 'PAY_WAIT' && (
                          <div className="flex gap-2">
                            <button
                              disabled={patchingId === c.id}
                              onClick={() => patchStatus(c.id, { paymentStatus: 'PAID' }, '지급 완료 처리')}
                              className={`${actionBtn} bg-indigo-600 hover:bg-indigo-500 text-white`}
                            >
                              {patchingId === c.id ? '처리 중...' : '지급 완료 →'}
                            </button>
                            <button
                              disabled={patchingId === c.id}
                              onClick={() => patchStatus(c.id, { paymentStatus: 'NON_PAID' }, '미지급 보류 처리')}
                              className={`${actionBtn} bg-[#11141a] border border-rose-500/40 text-rose-400 hover:bg-rose-500/10`}
                            >
                              미지급 보류
                            </button>
                          </div>
                        )}
                        {col.key === 'NON_PAID' && (
                          <button
                            disabled={patchingId === c.id}
                            onClick={() => patchStatus(c.id, { paymentStatus: 'PAID' }, '미지급 해소 — 지급 완료 처리')}
                            className={`${actionBtn} bg-indigo-600 hover:bg-indigo-500 text-white`}
                          >
                            {patchingId === c.id ? '처리 중...' : '지급 완료 처리 →'}
                          </button>
                        )}
                        {col.key === 'PAID' && (
                          <p className="mt-2 text-center text-xs text-emerald-400 font-semibold">완료</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
