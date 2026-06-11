/*---
id: customers/[id]/page.tsx
milestone: M5
why: 고객 상세 — 프로필 카드 + 일정 잡기 인라인 폼 + 연결 매물 + 일정 타임라인(완료/취소)
backlinks: [[[Pages]], [[api/customers/[id]/route.ts]], [[api/appointments/route.ts]]]
---*/

/**
 * @file src/app/customers/[id]/page.tsx
 * @description 고객 단건 상세 — 연락처 전체 노출, [일정 잡기] 인라인 폼(POST /api/appointments),
 *              연결 매물 목록, 일정 타임라인(상태 칩 + 완료/취소 PATCH)
 * @dependencies /api/customers/[id] (GET), /api/appointments (POST), /api/appointments/[id] (PATCH)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type PropertyRow = {
  id: string;
  address: string;
  propertyType: string;
  dealType: string;
  price: number;
  monthlyRent: number | null;
  status: string;
};

type AppointmentRow = {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  memo: string | null;
  status: 'SCHEDULED' | 'DONE' | 'CANCELED';
  property: { address: string } | null;
};

type CustomerDetail = {
  id: string;
  name: string;
  phone: string | null; // 상세는 전체 노출
  type: string;
  source: string | null;
  memo: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  agent: { id: string; name: string };
  properties: PropertyRow[];
  appointments: AppointmentRow[];
  createdAt: string;
};

const APPOINTMENT_TYPES = ['임장', '계약', '상담', '기타'] as const;

const TYPE_CHIP: Record<string, string> = {
  임대인: 'bg-amber-500/10 text-amber-400',
  임차인: 'bg-sky-500/10 text-sky-400',
  매수인: 'bg-emerald-500/10 text-emerald-400',
  매도인: 'bg-indigo-500/10 text-indigo-400',
  기타: 'bg-zinc-500/10 text-zinc-400',
};

const APPT_TYPE_CHIP: Record<string, string> = {
  임장: 'bg-sky-500/10 text-sky-400',
  계약: 'bg-indigo-500/10 text-indigo-400',
  상담: 'bg-violet-500/10 text-violet-400',
  기타: 'bg-zinc-500/10 text-zinc-400',
};

// 에메랄드=완료, 앰버=예정, 취소=중립
const STATUS_CHIP: Record<AppointmentRow['status'], { label: string; cls: string }> = {
  SCHEDULED: { label: '예정', cls: 'bg-amber-500/10 text-amber-400' },
  DONE: { label: '완료', cls: 'bg-emerald-500/10 text-emerald-400' },
  CANCELED: { label: '취소', cls: 'bg-zinc-500/10 text-zinc-500' },
};

const dtLabel = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** 원 단위 금액 → "12억 3,000만" 한국어 축약 표기 */
function formatKoreanPrice(won: number): string {
  if (won < 10000) return `${won.toLocaleString('ko-KR')}원`;
  const eok = Math.floor(won / 100_000_000);
  const man = Math.floor((won % 100_000_000) / 10_000);
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`);
  return parts.join(' ');
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 일정 잡기 인라인 폼
  const [showApptForm, setShowApptForm] = useState(false);
  const [apptForm, setApptForm] = useState({ title: '', type: '상담', scheduledAt: '', memo: '' });
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);
  const [patching, setPatching] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '고객 정보를 불러오지 못했습니다.');
      }
      setCustomer(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : '고객 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const submitAppointment = async () => {
    if (!customer) return;
    setApptError(null);
    if (!apptForm.title.trim()) return setApptError('일정 제목을 입력하세요.');
    if (!apptForm.scheduledAt) return setApptError('일시를 선택하세요.');
    setApptSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: apptForm.title.trim(),
          type: apptForm.type,
          scheduledAt: apptForm.scheduledAt,
          agentId: customer.agent.id,
          customerId: customer.id,
          memo: apptForm.memo.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '일정 등록에 실패했습니다.');
      }
      setApptForm({ title: '', type: '상담', scheduledAt: '', memo: '' });
      setShowApptForm(false);
      fetchCustomer();
    } catch (e) {
      setApptError(e instanceof Error ? e.message : '일정 등록에 실패했습니다.');
    } finally {
      setApptSubmitting(false);
    }
  };

  const patchAppointment = async (apptId: string, status: 'DONE' | 'CANCELED') => {
    setPatching(apptId);
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '일정 상태 변경에 실패했습니다.');
      }
      fetchCustomer();
    } catch (e) {
      setError(e instanceof Error ? e.message : '일정 상태 변경에 실패했습니다.');
    } finally {
      setPatching(null);
    }
  };

  const inputCls =
    'w-full bg-[#0a0c10] border border-[#1f2430] rounded-lg px-3 py-2 text-sm text-[#cdd2da] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
        <div className="max-w-5xl mx-auto bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
          고객 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
        <div className="max-w-5xl mx-auto bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
          <p className="text-rose-400 text-sm mb-3">{error}</p>
          <Link href="/customers" className="text-sm text-indigo-400 hover:text-indigo-300 underline">
            고객 목록으로
          </Link>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <Link href="/customers" className="text-xs text-zinc-500 hover:text-zinc-300">
              ← 고객 목록
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
              {customer.name}
              <span className={`px-2 py-0.5 rounded text-xs font-normal ${TYPE_CHIP[customer.type] ?? TYPE_CHIP['기타']}`}>
                {customer.type}
              </span>
              {customer.status === 'ARCHIVED' && (
                <span className="px-2 py-0.5 rounded text-xs font-normal bg-zinc-500/10 text-zinc-500">보관됨</span>
              )}
            </h1>
          </div>
          <button
            onClick={() => setShowApptForm((v) => !v)}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {showApptForm ? '폼 닫기' : '+ 일정 잡기'}
          </button>
        </header>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        {/* 프로필 카드 — 상세에서만 연락처 전체 노출 */}
        <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-zinc-500 mb-1">연락처</p>
            <p className="text-white tabular-nums">{customer.phone || '미입력'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">담당자</p>
            <p className="text-white">{customer.agent?.name}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">유입 경로</p>
            <p className="text-white">{customer.source || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">등록일</p>
            <p className="text-white tabular-nums">{dtLabel(customer.createdAt)}</p>
          </div>
          {customer.memo && (
            <div className="col-span-2 md:col-span-4 border-t border-[#1f2430] pt-3">
              <p className="text-xs text-zinc-500 mb-1">메모</p>
              <p className="text-zinc-300 whitespace-pre-wrap">{customer.memo}</p>
            </div>
          )}
        </section>

        {/* 일정 잡기 인라인 폼 */}
        {showApptForm && (
          <section className="bg-[#11141a] border border-indigo-500/30 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">새 일정 — {customer.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">제목 *</label>
                <input
                  className={inputCls}
                  value={apptForm.title}
                  onChange={(e) => setApptForm({ ...apptForm, title: e.target.value })}
                  placeholder="예: OO아파트 임장 동행"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">일시 *</label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={apptForm.scheduledAt}
                  onChange={(e) => setApptForm({ ...apptForm, scheduledAt: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">유형 *</label>
                <div className="flex gap-1">
                  {APPOINTMENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setApptForm({ ...apptForm, type: t })}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        apptForm.type === t
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-[#0a0c10] border border-[#1f2430] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">메모</label>
                <input
                  className={inputCls}
                  value={apptForm.memo}
                  onChange={(e) => setApptForm({ ...apptForm, memo: e.target.value })}
                  placeholder="준비물, 특이사항 등"
                />
              </div>
            </div>
            {apptError && <p className="text-sm text-rose-400">{apptError}</p>}
            <div className="flex justify-end">
              <button
                onClick={submitAppointment}
                disabled={apptSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
              >
                {apptSubmitting ? '등록 중...' : '일정 등록'}
              </button>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 연결 매물 */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">
              연결 매물 <span className="text-zinc-500 font-normal">{customer.properties.length}건</span>
            </h2>
            {customer.properties.length === 0 ? (
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-8 text-center text-zinc-500 text-sm">
                연결된 매물이 없습니다.
              </div>
            ) : (
              <ul className="space-y-2">
                {customer.properties.map((p) => (
                  <li key={p.id} className="bg-[#11141a] border border-[#1f2430] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-white text-sm leading-snug">{p.address}</p>
                      <span className="shrink-0 text-xs text-zinc-500">{p.status}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {p.propertyType} · {p.dealType} ·{' '}
                      <span className="text-zinc-300 tabular-nums">
                        {p.dealType === '월세'
                          ? `${formatKoreanPrice(p.price)} / ${formatKoreanPrice(p.monthlyRent ?? 0)}`
                          : formatKoreanPrice(p.price)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 일정 타임라인 */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">
              일정 타임라인 <span className="text-zinc-500 font-normal">최근 {customer.appointments.length}건</span>
            </h2>
            {customer.appointments.length === 0 ? (
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-8 text-center text-zinc-500 text-sm">
                등록된 일정이 없습니다. [일정 잡기]로 첫 일정을 추가하세요.
              </div>
            ) : (
              <ul className="space-y-2">
                {customer.appointments.map((a) => (
                  <li key={a.id} className="bg-[#11141a] border border-[#1f2430] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white text-sm flex items-center gap-2">
                          {a.title}
                          <span className={`px-2 py-0.5 rounded text-xs font-normal ${APPT_TYPE_CHIP[a.type] ?? APPT_TYPE_CHIP['기타']}`}>
                            {a.type}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                          {dtLabel(a.scheduledAt)}
                          {a.property?.address && <span className="ml-2 text-zinc-600">{a.property.address}</span>}
                        </p>
                        {a.memo && <p className="text-xs text-zinc-400 mt-1">{a.memo}</p>}
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-xs ${STATUS_CHIP[a.status].cls}`}>
                        {STATUS_CHIP[a.status].label}
                      </span>
                    </div>
                    {a.status === 'SCHEDULED' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => patchAppointment(a.id, 'DONE')}
                          disabled={patching === a.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50 transition-colors"
                        >
                          완료
                        </button>
                        <button
                          onClick={() => patchAppointment(a.id, 'CANCELED')}
                          disabled={patching === a.id}
                          className="px-3 py-1.5 rounded-lg text-xs bg-[#0a0c10] border border-[#1f2430] text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
