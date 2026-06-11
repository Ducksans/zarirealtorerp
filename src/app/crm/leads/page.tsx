/*---
id: crm/leads/page.tsx
milestone: M10
why: 리드 보드 — 고객(Customer) 유형별(임차/매수/임대/매도) 컬럼 보드 + 신규 리드 등록 모달 (실데이터)
backlinks: [[[Pages]], [[api/customers/route.ts]], [[crm/page.tsx]]]
---*/

/**
 * @file src/app/crm/leads/page.tsx
 * @description 리드 보드 — "활성 N · 이번 주 신규 N" 답 먼저, 유형별 4컬럼(임차인/매수인/임대인/매도인) 보드,
 *              카드(이름/마스킹 연락처/담당/등록일/일정 N) → 고객 상세 링크, 신규 리드 등록 모달(POST /api/customers)
 * @dependencies /api/customers (GET, POST), /api/users (GET ?search=)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null; // 목록 응답은 마스킹된 값
  type: string;
  source: string | null;
  agent: { name: string } | null;
  _count: { properties: number; appointments: number };
  createdAt: string;
};

type UserOption = { id: string; name: string; role: string };

const CUSTOMER_TYPES = ['임대인', '임차인', '매수인', '매도인', '기타'] as const;

// 보드 컬럼 순서: 수요(임차/매수) 먼저, 공급(임대/매도) 다음
const BOARD_COLUMNS = [
  { type: '임차인', accent: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-400' },
  { type: '매수인', accent: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400' },
  { type: '임대인', accent: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400' },
  { type: '매도인', accent: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-400' },
] as const;

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

/** 신규 리드(고객) 등록 모달 — 담당자는 /api/users 검색으로 선택 */
function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', type: '임차인', phone: '', source: '', memo: '' });
  const [agentQuery, setAgentQuery] = useState('');
  const [agentOptions, setAgentOptions] = useState<UserOption[]>([]);
  const [agent, setAgent] = useState<UserOption | null>(null);
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
        // 검색 실패는 치명적이지 않으므로 무시
      }
    }, 250);
    return () => clearTimeout(t);
  }, [agentQuery, agent]);

  const submit = async () => {
    setError(null);
    if (!form.name.trim()) return setError('고객 이름을 입력하세요.');
    if (!agent) return setError('담당자를 검색해 선택하세요.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          agentId: agent.id,
          phone: form.phone.trim() || null,
          source: form.source.trim() || null,
          memo: form.memo.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '리드 등록에 실패했습니다.');
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '리드 등록에 실패했습니다.');
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
        <h2 className="text-lg font-bold text-white">신규 리드 등록</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">이름 *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="고객 이름"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">유형 *</label>
            <div className="flex flex-wrap gap-1">
              {CUSTOMER_TYPES.map((t) => (
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
            <label className="block text-xs text-zinc-500 mb-1">담당자 * (이름 검색)</label>
            {agent ? (
              <div className="flex items-center justify-between bg-[#0a0c10] border border-indigo-500/40 rounded-lg px-3 py-2 text-sm">
                <span className="text-white">{agent.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAgent(null);
                    setAgentQuery('');
                  }}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  변경
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  className={inputCls}
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  placeholder="담당 직원 이름 검색"
                />
                {agentOptions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-[#0a0c10] border border-[#1f2430] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    {agentOptions.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setAgent(u)}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-[#1f2430]"
                        >
                          {u.name} <span className="text-zinc-600 text-xs">{u.role}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">연락처</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">유입 경로</label>
            <input
              className={inputCls}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="네이버 / 소개 / 워크인 ..."
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">메모</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
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
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadsBoardPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [summary, setSummary] = useState<{ active: number; newThisWeek: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/customers?limit=100');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '리드 목록을 불러오지 못했습니다.');
      }
      const data = await res.json();
      setCustomers(data.customers || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '리드 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const byType = (type: string) => customers.filter((c) => c.type === type);
  const etcLeads = byType('기타');

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-[1500px] mx-auto space-y-6">
        {/* 헤더 */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <Link href="/crm" className="text-xs text-indigo-400 hover:text-indigo-300">
              ← CRM 홈
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">리드 보드</h1>
            <p className="text-sm text-zinc-500 mt-1">고객 유형별 리드 현황 — 카드 클릭 시 고객 상세</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            + 신규 리드 등록
          </button>
        </header>

        {/* 답 먼저: 요약 */}
        <section className="grid grid-cols-2 gap-4 max-w-xl">
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">활성 리드</p>
            <p className="text-3xl font-bold text-white tabular-nums">
              {loading && !summary ? '—' : summary?.active ?? 0}
              <span className="text-base font-medium text-zinc-500 ml-1">명</span>
            </p>
          </div>
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">이번 주 신규</p>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">
              {loading && !summary ? '—' : summary?.newThisWeek ?? 0}
              <span className="text-base font-medium text-zinc-500 ml-1">명</span>
            </p>
          </div>
        </section>

        {/* 유형별 보드 */}
        {loading ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            리드 보드를 불러오는 중...
          </div>
        ) : error ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button onClick={fetchLeads} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              다시 시도
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            등록된 리드가 없습니다.{' '}
            <button onClick={() => setShowModal(true)} className="text-indigo-400 hover:text-indigo-300 underline">
              신규 리드 등록
            </button>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
              {BOARD_COLUMNS.map((col) => {
                const items = byType(col.type);
                return (
                  <div key={col.type} className="bg-[#11141a] border border-[#1f2430] rounded-xl flex flex-col">
                    <div className="px-4 py-3 border-b border-[#1f2430] flex items-center justify-between">
                      <h2 className={`text-sm font-semibold ${col.accent}`}>{col.type}</h2>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${col.badge}`}>
                        {items.length}명
                      </span>
                    </div>
                    <div className="p-3 space-y-3 min-h-[80px]">
                      {items.length === 0 && (
                        <p className="text-center text-xs text-zinc-600 py-6">해당 유형 리드 없음</p>
                      )}
                      {items.map((c) => (
                        <Link
                          key={c.id}
                          href={`/crm/leads/${c.id}`}
                          className="block bg-[#0a0c10] border border-[#1f2430] rounded-lg p-3 hover:border-indigo-500/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-semibold text-white text-sm">{c.name}</p>
                            {c._count?.appointments > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 tabular-nums shrink-0">
                                일정 {c._count.appointments}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 tabular-nums mb-2">{c.phone || '연락처 미입력'}</p>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>
                              {c.agent?.name ?? '담당 미지정'}
                              {c.source && <span className="ml-1 text-zinc-600">· {c.source}</span>}
                            </span>
                            <span className="tabular-nums">{dateLabel(c.createdAt)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>

            {etcLeads.length > 0 && (
              <p className="text-xs text-zinc-600">
                유형이 &lsquo;기타&rsquo;인 리드 {etcLeads.length}명은 보드에 표시되지 않습니다 —{' '}
                <Link href="/customers" className="text-indigo-400 hover:text-indigo-300 underline">
                  고객 원장
                </Link>
                에서 확인하세요.
              </p>
            )}
          </>
        )}
      </div>

      {showModal && <NewLeadModal onClose={() => setShowModal(false)} onCreated={fetchLeads} />}
    </div>
  );
}
