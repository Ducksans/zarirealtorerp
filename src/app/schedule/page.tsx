/*---
id: schedule/page.tsx
milestone: M11
why: 일정 주간 뷰 — 오늘 일정 N건이 답, 7일 컬럼(오늘 하이라이트) + 카드 클릭 완료/취소 + 신규 일정 폼
backlinks: [[[Pages]], [[api/appointments/route.ts]], [[api/appointments/[id]/route.ts]]]
---*/

/**
 * @file src/app/schedule/page.tsx
 * @description 주간 7일 컬럼 일정 뷰 — "오늘 일정 N건" 답 먼저, ◀ 이번 주 ▶ 이동,
 *              일정 카드(시간/제목/유형 칩/고객·매물명) 클릭 → 완료/취소 PATCH,
 *              신규 일정 버튼(고객 검색 옵션 폼 → POST /api/appointments)
 * @dependencies /api/appointments (GET, POST), /api/appointments/[id] (PATCH), /api/users, /api/customers
 * @note 외부 캘린더(구글/네이버) 연동은 M11 범위 외 — 추후 ICS export로 확장 예정.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AppointmentRow = {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  memo: string | null;
  status: 'SCHEDULED' | 'DONE' | 'CANCELED';
  agent: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
  property: { id: string; address: string } | null;
};

type UserOption = { id: string; name: string; role: string };
type CustomerOption = { id: string; name: string; type: string };

const APPOINTMENT_TYPES = ['임장', '계약', '상담', '기타'] as const;

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

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

/** 해당 날짜가 속한 주의 월요일 00:00 */
function mondayOf(d: Date): Date {
  const monday = new Date(d);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

/** 신규 일정 폼 (모달) — 담당자 필수 검색, 고객 검색은 옵션 */
function NewAppointmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', type: '상담', scheduledAt: '', memo: '' });
  const [agentQuery, setAgentQuery] = useState('');
  const [agentOptions, setAgentOptions] = useState<UserOption[]>([]);
  const [agent, setAgent] = useState<UserOption | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 담당자 검색 (디바운스)
  useEffect(() => {
    if (agent || !agentQuery.trim()) {
      setAgentOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(agentQuery.trim())}&limit=8`);
        if (!res.ok) return;
        const data = await res.json();
        setAgentOptions(data.users || []);
      } catch {
        /* 검색 실패는 무시 */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [agentQuery, agent]);

  // 고객 검색 — 옵션 (디바운스)
  useEffect(() => {
    if (customer || !customerQuery.trim()) {
      setCustomerOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(customerQuery.trim())}&limit=8`);
        if (!res.ok) return;
        const data = await res.json();
        setCustomerOptions(data.customers || []);
      } catch {
        /* 검색 실패는 무시 */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [customerQuery, customer]);

  const submit = async () => {
    setError(null);
    if (!form.title.trim()) return setError('일정 제목을 입력하세요.');
    if (!form.scheduledAt) return setError('일시를 선택하세요.');
    if (!agent) return setError('담당자를 검색해 선택하세요.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          scheduledAt: form.scheduledAt,
          agentId: agent.id,
          customerId: customer?.id ?? null,
          memo: form.memo.trim() || null,
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

  const searchPicker = (
    label: string,
    picked: { name: string } | null,
    clear: () => void,
    query: string,
    setQuery: (v: string) => void,
    options: { id: string; name: string; sub?: string }[],
    pick: (id: string) => void,
    placeholder: string
  ) => (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      {picked ? (
        <div className="flex items-center justify-between bg-[#0a0c10] border border-indigo-500/40 rounded-lg px-3 py-2 text-sm">
          <span className="text-white">{picked.name}</span>
          <button type="button" onClick={clear} className="text-xs text-zinc-500 hover:text-white">
            변경
          </button>
        </div>
      ) : (
        <div className="relative">
          <input className={inputCls} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} />
          {options.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-[#0a0c10] border border-[#1f2430] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => pick(o.id)}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-[#1f2430]"
                  >
                    {o.name} {o.sub && <span className="text-zinc-600 text-xs">{o.sub}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#11141a] border border-[#1f2430] rounded-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">신규 일정</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">제목 *</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: OO상가 임장"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">유형 *</label>
            <div className="flex gap-1">
              {APPOINTMENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.type === t
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
            <label className="block text-xs text-zinc-500 mb-1">일시 *</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </div>

          {searchPicker(
            '담당자 * (이름 검색)',
            agent,
            () => {
              setAgent(null);
              setAgentQuery('');
            },
            agentQuery,
            setAgentQuery,
            agentOptions.map((u) => ({ id: u.id, name: u.name, sub: u.role })),
            (uid) => setAgent(agentOptions.find((u) => u.id === uid) ?? null),
            '담당 직원 이름 검색'
          )}

          {searchPicker(
            '고객 (옵션, 이름 검색)',
            customer,
            () => {
              setCustomer(null);
              setCustomerQuery('');
            },
            customerQuery,
            setCustomerQuery,
            customerOptions.map((c) => ({ id: c.id, name: c.name, sub: c.type })),
            (cid) => setCustomer(customerOptions.find((c) => c.id === cid) ?? null),
            '고객 이름 검색 (선택 안 해도 됨)'
          )}

          <div>
            <label className="block text-xs text-zinc-500 mb-1">메모</label>
            <input
              className={inputCls}
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="준비물, 특이사항 등"
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
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [patching, setPatching] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ from: weekStart.toISOString(), to: weekEnd.toISOString() });
      const res = await fetch(`/api/appointments?${qs.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '일정을 불러오지 못했습니다.');
      }
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '일정을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const today = new Date();

  // 답 먼저: 오늘 일정 건수 (취소 제외)
  const todayCount = useMemo(
    () => appointments.filter((a) => sameDay(new Date(a.scheduledAt), today) && a.status !== 'CANCELED').length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments]
  );

  // 7일 컬럼 분배
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const items = appointments.filter((a) => sameDay(new Date(a.scheduledAt), date));
      return { date, items };
    });
  }, [weekStart, appointments]);

  const moveWeek = (delta: number) => {
    setSelectedId(null);
    if (delta === 0) {
      setWeekStart(mondayOf(new Date()));
      return;
    }
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * 7);
      return next;
    });
  };

  const patchAppointment = async (id: string, status: 'DONE' | 'CANCELED') => {
    setPatching(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '일정 상태 변경에 실패했습니다.');
      }
      setSelectedId(null);
      fetchAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : '일정 상태 변경에 실패했습니다.');
    } finally {
      setPatching(null);
    }
  };

  const rangeLabel = `${weekStart.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ~ ${new Date(
    weekEnd.getTime() - 1
  ).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">일정</h1>
            <p className="text-sm text-zinc-500 mt-1">주간 일정 관리 — 임장·계약·상담</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            + 신규 일정
          </button>
        </header>

        {/* 답 먼저: 오늘 일정 큰 숫자 */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5 max-w-xs w-full">
            <p className="text-xs text-zinc-500 mb-2">오늘 일정</p>
            <p className="text-3xl font-bold text-amber-400 tabular-nums">
              {loading ? '—' : todayCount}
              <span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </p>
          </div>

          {/* 주간 이동 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => moveWeek(-1)}
              className="px-3 py-2 rounded-lg text-sm bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white transition-colors"
              aria-label="이전 주"
            >
              ◀
            </button>
            <button
              onClick={() => moveWeek(0)}
              className="px-4 py-2 rounded-lg text-sm bg-[#11141a] border border-[#1f2430] text-zinc-300 hover:text-white transition-colors"
            >
              이번 주
            </button>
            <button
              onClick={() => moveWeek(1)}
              className="px-3 py-2 rounded-lg text-sm bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white transition-colors"
              aria-label="다음 주"
            >
              ▶
            </button>
            <span className="text-sm text-zinc-500 ml-2 tabular-nums">{rangeLabel}</span>
          </div>
        </section>

        {/* 주간 7일 컬럼 뷰 */}
        {error ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button onClick={fetchAppointments} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              다시 시도
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {days.map(({ date, items }, i) => {
              const isToday = sameDay(date, today);
              return (
                <div
                  key={date.toISOString()}
                  className={`rounded-xl border p-3 min-h-40 ${
                    isToday ? 'bg-indigo-500/5 border-indigo-500/40' : 'bg-[#11141a] border-[#1f2430]'
                  }`}
                >
                  <p className={`text-xs font-semibold mb-2 tabular-nums ${isToday ? 'text-indigo-300' : 'text-zinc-500'}`}>
                    {DAY_LABELS[i]} {date.getMonth() + 1}/{date.getDate()}
                    {isToday && <span className="ml-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">오늘</span>}
                  </p>

                  {loading ? (
                    <p className="text-xs text-zinc-600">불러오는 중...</p>
                  ) : items.length === 0 ? (
                    <p className="text-xs text-zinc-700">일정 없음</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((a) => (
                        <li key={a.id}>
                          <button
                            onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
                            className={`w-full text-left rounded-lg border p-2 transition-colors ${
                              a.status === 'CANCELED'
                                ? 'bg-[#0a0c10] border-[#1f2430] opacity-50'
                                : 'bg-[#0a0c10] border-[#1f2430] hover:border-indigo-500/50'
                            }`}
                          >
                            <p className="text-xs text-zinc-500 tabular-nums">{timeLabel(a.scheduledAt)}</p>
                            <p className={`text-sm font-medium ${a.status === 'CANCELED' ? 'text-zinc-500 line-through' : 'text-white'}`}>
                              {a.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${APPT_TYPE_CHIP[a.type] ?? APPT_TYPE_CHIP['기타']}`}>
                                {a.type}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_CHIP[a.status].cls}`}>
                                {STATUS_CHIP[a.status].label}
                              </span>
                            </div>
                            {(a.customer || a.property) && (
                              <p className="text-[11px] text-zinc-500 mt-1 truncate">
                                {a.customer?.name}
                                {a.customer && a.property && ' · '}
                                {a.property?.address}
                              </p>
                            )}
                          </button>

                          {/* 클릭 시 완료/취소 액션 */}
                          {selectedId === a.id && a.status === 'SCHEDULED' && (
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => patchAppointment(a.id, 'DONE')}
                                disabled={patching === a.id}
                                className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50 transition-colors"
                              >
                                완료
                              </button>
                              <button
                                onClick={() => patchAppointment(a.id, 'CANCELED')}
                                disabled={patching === a.id}
                                className="flex-1 px-2 py-1.5 rounded-lg text-xs bg-[#0a0c10] border border-[#1f2430] text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>

      {showModal && <NewAppointmentModal onClose={() => setShowModal(false)} onCreated={fetchAppointments} />}
    </div>
  );
}
