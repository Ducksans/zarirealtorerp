/*---
id: customers/page.tsx
milestone: M5
why: 고객 원장 목록 — 활성/이번 주 신규가 답, 검색·유형 필터 테이블 + 인라인 등록 모달
backlinks: [[[Pages]], [[api/customers/route.ts]]]
---*/

/**
 * @file src/app/customers/page.tsx
 * @description 고객 목록 — "활성 고객 N명 · 이번 주 신규 N명" 답 먼저, 검색 + 유형 필터,
 *              테이블(이름/유형/마스킹 연락처/담당자/매물·일정 수/등록일) → 상세 링크,
 *              신규 등록 인라인 모달(담당자 검색 /api/users?search=)
 * @dependencies /api/customers (GET, POST), /api/users (GET)
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
const TYPE_FILTERS = ['ALL', ...CUSTOMER_TYPES] as const;

const TYPE_CHIP: Record<string, string> = {
  임대인: 'bg-amber-500/10 text-amber-400',
  임차인: 'bg-sky-500/10 text-sky-400',
  매수인: 'bg-emerald-500/10 text-emerald-400',
  매도인: 'bg-indigo-500/10 text-indigo-400',
  기타: 'bg-zinc-500/10 text-zinc-400',
};

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

/** 신규 고객 등록 인라인 모달 — 담당자는 /api/users 검색으로 선택 */
function NewCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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
        throw new Error(data.error || '고객 등록에 실패했습니다.');
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '고객 등록에 실패했습니다.');
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
        <h2 className="text-lg font-bold text-white">신규 고객 등록</h2>

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [summary, setSummary] = useState<{ active: number; newThisWeek: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>('ALL');
  const [showModal, setShowModal] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: '100' });
      if (search.trim()) qs.set('search', search.trim());
      if (typeFilter !== 'ALL') qs.set('type', typeFilter);
      const res = await fetch(`/api/customers?${qs.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '고객 목록을 불러오지 못했습니다.');
      }
      const data = await res.json();
      setCustomers(data.customers || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '고객 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">고객 원장</h1>
            <p className="text-sm text-zinc-500 mt-1">고객 등록·연결 매물·일정 관리</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            + 신규 고객 등록
          </button>
        </header>

        {/* 답 먼저: 큰 숫자 요약 */}
        <section className="grid grid-cols-2 gap-4 max-w-xl">
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">활성 고객</p>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">
              {loading && !summary ? '—' : summary?.active ?? 0}
              <span className="text-base font-medium text-zinc-500 ml-1">명</span>
            </p>
          </div>
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">이번 주 신규</p>
            <p className="text-3xl font-bold text-white tabular-nums">
              {loading && !summary ? '—' : summary?.newThisWeek ?? 0}
              <span className="text-base font-medium text-zinc-500 ml-1">명</span>
            </p>
          </div>
        </section>

        {/* 검색 + 유형 필터 */}
        <section className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 / 연락처 검색"
            className="flex-1 bg-[#11141a] border border-[#1f2430] rounded-lg px-4 py-2 text-sm text-[#cdd2da] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap gap-1">
            {TYPE_FILTERS.map((key) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  typeFilter === key
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white'
                }`}
              >
                {key === 'ALL' ? '전체 유형' : key}
              </button>
            ))}
          </div>
        </section>

        {/* 고객 테이블 */}
        {loading ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            고객 목록을 불러오는 중...
          </div>
        ) : error ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button onClick={fetchCustomers} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              다시 시도
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            조건에 맞는 고객이 없습니다.{' '}
            <button onClick={() => setShowModal(true)} className="text-indigo-400 hover:text-indigo-300 underline">
              신규 고객 등록
            </button>
          </div>
        ) : (
          <section className="bg-[#11141a] border border-[#1f2430] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-[#1f2430]">
                  <th className="px-5 py-3 font-medium">이름</th>
                  <th className="px-5 py-3 font-medium">유형</th>
                  <th className="px-5 py-3 font-medium">연락처</th>
                  <th className="px-5 py-3 font-medium">담당자</th>
                  <th className="px-5 py-3 font-medium">매물 · 일정</th>
                  <th className="px-5 py-3 font-medium">등록일</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-[#1f2430] last:border-0 hover:bg-[#1f2430]/40 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/customers/${c.id}`} className="font-semibold text-white hover:text-indigo-300">
                        {c.name}
                      </Link>
                      {c.source && <span className="ml-2 text-xs text-zinc-600">{c.source}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${TYPE_CHIP[c.type] ?? TYPE_CHIP['기타']}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400 tabular-nums">{c.phone || '—'}</td>
                    <td className="px-5 py-3 text-zinc-400">{c.agent?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-zinc-400 tabular-nums">
                      매물 {c._count?.properties ?? 0} · 일정 {c._count?.appointments ?? 0}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 tabular-nums">{dateLabel(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {showModal && <NewCustomerModal onClose={() => setShowModal(false)} onCreated={fetchCustomers} />}
    </div>
  );
}
