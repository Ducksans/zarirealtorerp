/*---
id: crm/matching/page.tsx
milestone: M10
why: 매물 매칭 v1 — 매수·임차 고객 선택 → dealType 호환 ACTIVE 매물 목록 + 일정 잡기 (실데이터, 스코어링 없음)
backlinks: [[[Pages]], [[api/customers/route.ts]], [[api/properties/route.ts]], [[api/appointments/route.ts]]]
---*/

/**
 * @file src/app/crm/matching/page.tsx
 * @description 단순 매칭 v1 — 좌측: 매수인/임차인 고객 선택, 우측: ACTIVE 매물 중 dealType 호환
 *              (매수인→매매, 임차인→전세·월세) 목록 + [일정 잡기](POST /api/appointments, 고객+매물 연결).
 *              복잡한 스코어링 없이 거래 유형 호환만 보는 정직한 v1.
 * @dependencies /api/customers (GET ?type=), /api/properties (GET ?status=ACTIVE), /api/appointments (POST)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null; // 마스킹된 값
  type: string;
  agentId: string;
  agent: { name: string } | null;
  _count: { properties: number; appointments: number };
};

type PropertyRow = {
  id: string;
  address: string;
  propertyType: string;
  dealType: string;
  price: number;
  monthlyRent: number | null;
  status: string;
  agent: { name: string } | null;
};

type DemandType = '매수인' | '임차인';

/** 수요 유형 → 호환 거래 유형 (정직한 v1: 거래 유형 호환만 본다) */
const COMPATIBLE_DEAL_TYPES: Record<DemandType, string[]> = {
  매수인: ['매매'],
  임차인: ['전세', '월세'],
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

function priceLabel(p: PropertyRow): string {
  if (p.dealType === '월세') {
    return `보증금 ${formatKoreanPrice(p.price)} / 월 ${formatKoreanPrice(p.monthlyRent || 0)}`;
  }
  return `${p.dealType} ${formatKoreanPrice(p.price)}`;
}

/** 일정 잡기 인라인 모달 — 고객+매물 연결 임장 일정 등록 */
function ScheduleModal({
  customer,
  property,
  onClose,
  onCreated,
}: {
  customer: CustomerRow;
  property: PropertyRow;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState(`${customer.name} 임장 — ${property.address}`);
  const [scheduledAt, setScheduledAt] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim()) return setError('일정 제목을 입력하세요.');
    if (!scheduledAt) return setError('일시를 선택하세요.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type: '임장',
          scheduledAt: new Date(scheduledAt).toISOString(),
          agentId: customer.agentId,
          customerId: customer.id,
          propertyId: property.id,
          memo: memo.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '일정 등록에 실패했습니다.');
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '일정 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-[#0a0c10] border border-[#1f2430] rounded-lg px-3 py-2 text-sm text-[#cdd2da] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#11141a] border border-[#1f2430] rounded-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">일정 잡기 (임장)</h2>
        <p className="text-xs text-zinc-500">
          {customer.name} ({customer.type}) · 담당 {customer.agent?.name ?? '미지정'} · {property.address}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">제목 *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">일시 *</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">메모</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="특이사항"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm bg-[#0a0c10] border border-[#1f2430] text-zinc-400 hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
          >
            {submitting ? '등록 중...' : '일정 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchingPage() {
  const [demandType, setDemandType] = useState<DemandType>('매수인');
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<PropertyRow | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [custRes, propRes] = await Promise.all([
        fetch(`/api/customers?type=${encodeURIComponent(demandType)}&limit=100`),
        fetch('/api/properties?status=ACTIVE&limit=100'),
      ]);
      if (!custRes.ok || !propRes.ok) throw new Error('매칭 데이터를 불러오지 못했습니다.');
      const [custData, propData] = await Promise.all([custRes.json(), propRes.json()]);
      setCustomers(custData.customers || []);
      setProperties(propData.properties || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '매칭 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [demandType]);

  useEffect(() => {
    setSelectedId(null);
    fetchData();
  }, [fetchData]);

  const selected = customers.find((c) => c.id === selectedId) ?? null;
  const compatible = COMPATIBLE_DEAL_TYPES[demandType];
  const matchedProperties = properties.filter((p) => compatible.includes(p.dealType));

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <header>
          <Link href="/crm" className="text-xs text-indigo-400 hover:text-indigo-300">
            ← CRM 홈
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">매물 매칭</h1>
          <p className="text-sm text-zinc-500 mt-1">
            고객 선택 → 거래 유형 호환(매수인→매매, 임차인→전세·월세) 활성 매물 → 일정 잡기. 스코어링 없는 v1.
          </p>
        </header>

        {/* 수요 유형 선택 */}
        <section className="flex gap-1">
          {(['매수인', '임차인'] as DemandType[]).map((t) => (
            <button
              key={t}
              onClick={() => setDemandType(t)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                demandType === t
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </section>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-3 text-sm text-emerald-400 flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-500 hover:text-emerald-300">
              닫기
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            매칭 데이터를 불러오는 중...
          </div>
        ) : error ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button onClick={fetchData} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              다시 시도
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
            {/* 좌측: 고객 선택 */}
            <div className="lg:col-span-2 bg-[#11141a] border border-[#1f2430] rounded-xl">
              <div className="px-4 py-3 border-b border-[#1f2430] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">{demandType} 고객</h2>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-500/10 text-zinc-400 tabular-nums">
                  {customers.length}명
                </span>
              </div>
              <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {customers.length === 0 && (
                  <p className="text-center text-xs text-zinc-600 py-8">
                    {demandType} 유형의 활성 고객이 없습니다.{' '}
                    <Link href="/crm/leads" className="text-indigo-400 hover:text-indigo-300 underline">
                      리드 보드에서 등록
                    </Link>
                  </p>
                )}
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left bg-[#0a0c10] border rounded-lg p-3 transition-colors ${
                      selectedId === c.id ? 'border-indigo-500' : 'border-[#1f2430] hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-white text-sm">{c.name}</p>
                      <span className="text-xs text-zinc-500 tabular-nums">{c.phone || '—'}</span>
                    </div>
                    <p className="text-xs text-zinc-500">담당 {c.agent?.name ?? '미지정'}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 우측: 호환 매물 */}
            <div className="lg:col-span-3 bg-[#11141a] border border-[#1f2430] rounded-xl">
              <div className="px-4 py-3 border-b border-[#1f2430] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  호환 활성 매물 <span className="text-zinc-500 font-normal">({compatible.join('·')})</span>
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-500/10 text-zinc-400 tabular-nums">
                  {matchedProperties.length}건
                </span>
              </div>
              <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {!selected ? (
                  <p className="text-center text-xs text-zinc-600 py-8">좌측에서 고객을 먼저 선택하세요.</p>
                ) : matchedProperties.length === 0 ? (
                  <p className="text-center text-xs text-zinc-600 py-8">
                    {compatible.join('·')} 거래 유형의 활성 매물이 없습니다.
                  </p>
                ) : (
                  matchedProperties.map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#0a0c10] border border-[#1f2430] rounded-lg p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{p.address}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {p.propertyType} · 담당 {p.agent?.name ?? '미지정'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm text-white font-semibold tabular-nums text-right">
                          {priceLabel(p)}
                        </span>
                        <button
                          onClick={() => setScheduleTarget(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        >
                          일정 잡기
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {scheduleTarget && selected && (
        <ScheduleModal
          customer={selected}
          property={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onCreated={() =>
            setSuccessMsg(`${selected.name} 고객의 임장 일정이 등록되었습니다 — ${scheduleTarget.address}`)
          }
        />
      )}
    </div>
  );
}
