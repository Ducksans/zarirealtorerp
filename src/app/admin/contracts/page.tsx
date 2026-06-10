/*---
id: page.tsx
milestone: M16
why: 계약 원장(관리자) — 월별 계약 총액/건수, 상태 처리, 문서함 진입
backlinks: [[[Pages]]]
---*/

/**
 * @file src/app/admin/contracts/page.tsx
 * @description 관리자 계약 원장 — 선택 월의 계약 총액·건수가 답. 검색/상태필터, 서명→지급 처리, 문서 N/7
 * @dependencies /api/contracts (GET month/withDocs, POST, PATCH /api/contracts/[id]), /api/users?search=
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES_KO, type UserRole } from '@/types';

const DOC_TYPES = [
  '계약서',
  '중개대상물확인설명서',
  '등기부등본',
  '건축물대장',
  '영수증',
  '비밀유지서약서',
  '기타',
] as const;

type AgentInfo = { name: string; role: string; employeeId: string };
type DocInfo = { id: string; type: string; fileName: string; fileUrl: string; uploadedAt: string };
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
  agent: AgentInfo;
  documents: DocInfo[];
};

type UserOption = { id: string; name: string; role: string; employeeId: string };

const roleKo = (role: string) => ROLES_KO[role as UserRole] ?? role;
const fmt = (n: number) => n.toLocaleString('ko-KR');
const currentMonth = () => new Date().toISOString().slice(0, 7);

function statusOf(c: ContractRow): 'SIGN_PENDING' | 'PAY_PENDING' | 'DONE' | 'NON_PAID' {
  if (c.signatureStatus === 'PENDING') return 'SIGN_PENDING';
  if (c.paymentStatus === 'PAID') return 'DONE';
  if (c.paymentStatus === 'NON_PAID') return 'NON_PAID';
  return 'PAY_PENDING';
}

function docTypeCount(c: ContractRow): number {
  const types = new Set(c.documents.map((d) => d.type));
  return DOC_TYPES.filter((t) => types.has(t)).length;
}

export default function AdminContractsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SIGN_PENDING' | 'PAY_PENDING' | 'DONE'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts?month=${month}&withDocs=1&limit=500`);
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

  // 월 요약 (필터와 무관 — 선택 월 전체)
  const summary = useMemo(() => {
    const totalAmount = contracts.reduce((s, c) => s + c.grossCommission, 0);
    const signPending = contracts.filter((c) => statusOf(c) === 'SIGN_PENDING').length;
    const payPending = contracts.filter((c) => statusOf(c) === 'PAY_PENDING').length;
    return { count: contracts.length, totalAmount, signPending, payPending };
  }, [contracts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contracts.filter((c) => {
      if (statusFilter !== 'ALL' && statusOf(c) !== statusFilter) return false;
      if (!q) return true;
      return [c.clientName, c.propertyAddress, c.agent?.name]
        .some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [contracts, search, statusFilter]);

  const filteredTotal = useMemo(
    () => filtered.reduce((s, c) => s + c.grossCommission, 0),
    [filtered]
  );

  const patchStatus = async (
    c: ContractRow,
    field: 'signatureStatus' | 'paymentStatus',
    value: string,
    promptMsg: string
  ) => {
    const reason = window.prompt(promptMsg);
    if (!reason || !reason.trim()) return;
    try {
      const res = await fetch(`/api/contracts/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '상태 변경에 실패했습니다.');
        return;
      }
      fetchContracts();
    } catch {
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더: 선택 월의 계약 총액·건수가 답 */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">계약 원장</h1>
            <p className="text-sm text-zinc-500 mt-1">관리자 — 계약 등록·상태 처리·문서 보관함</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="bg-[#11141a] border border-[#1f2430] rounded-lg px-3 py-2 text-sm text-[#cdd2da] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              + 신규 계약 등록
            </button>
          </div>
        </header>

        {/* 월 요약 카드 */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">{month.replace('-', '년 ')}월 계약 총액</p>
            <p className="text-3xl font-bold text-white tabular-nums">
              {fmt(summary.totalAmount)}<span className="text-base font-medium text-zinc-500 ml-1">원</span>
            </p>
          </div>
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">계약 건수</p>
            <p className="text-3xl font-bold text-white tabular-nums">
              {summary.count}<span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </p>
          </div>
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">서명 대기</p>
            <p className={`text-3xl font-bold tabular-nums ${summary.signPending > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
              {summary.signPending}<span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </p>
          </div>
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">지급 대기</p>
            <p className={`text-3xl font-bold tabular-nums ${summary.payPending > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
              {summary.payPending}<span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </p>
          </div>
        </section>

        {/* 검색 + 상태 필터 */}
        <section className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="고객명 / 주소 / 담당자 검색"
            className="flex-1 bg-[#11141a] border border-[#1f2430] rounded-lg px-4 py-2 text-sm text-[#cdd2da] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex gap-1">
            {([
              ['ALL', '전체'],
              ['SIGN_PENDING', '서명대기'],
              ['PAY_PENDING', '지급대기'],
              ['DONE', '완료'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  statusFilter === key
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 계약 테이블 */}
        <section className="bg-[#11141a] border border-[#1f2430] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-zinc-500 text-sm">계약 목록을 불러오는 중...</div>
          ) : error ? (
            <div className="p-16 text-center">
              <p className="text-rose-400 text-sm mb-3">{error}</p>
              <button
                onClick={fetchContracts}
                className="text-sm text-indigo-400 hover:text-indigo-300 underline"
              >
                다시 시도
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 text-sm">
              {contracts.length === 0
                ? `${month} 등록된 계약이 없습니다.`
                : '검색/필터 조건에 맞는 계약이 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-xs border-b border-[#1f2430]">
                    <th className="text-left font-medium px-4 py-3">계약일</th>
                    <th className="text-left font-medium px-4 py-3">담당자</th>
                    <th className="text-left font-medium px-4 py-3">고객명</th>
                    <th className="text-left font-medium px-4 py-3">주소</th>
                    <th className="text-left font-medium px-4 py-3">유형</th>
                    <th className="text-right font-medium px-4 py-3">보수액(원)</th>
                    <th className="text-center font-medium px-4 py-3">서명</th>
                    <th className="text-center font-medium px-4 py-3">지급</th>
                    <th className="text-center font-medium px-4 py-3">문서</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const docCount = docTypeCount(c);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/admin/contracts/${c.id}/archive`)}
                        className="border-b border-[#1f2430] last:border-b-0 hover:bg-[#171b23] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                          {c.contractDate?.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.agent?.name}
                          <span className="text-zinc-500 ml-1 text-xs">{roleKo(c.agent?.role)}</span>
                        </td>
                        <td className="px-4 py-3">{c.clientName || <span className="text-zinc-600">—</span>}</td>
                        <td className="px-4 py-3 max-w-[240px] truncate" title={c.propertyAddress || ''}>
                          {c.propertyAddress || <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.contractType || <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                          {fmt(c.grossCommission)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {c.signatureStatus === 'SIGNED' ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400">서명완료</span>
                          ) : (
                            <button
                              onClick={() => patchStatus(c, 'signatureStatus', 'SIGNED', '서명 처리 사유를 입력하세요.')}
                              className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            >
                              서명대기 → 처리
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {c.paymentStatus === 'PAID' ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400">입금완료</span>
                          ) : c.paymentStatus === 'NON_PAID' ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-rose-500/10 text-rose-400">미지급</span>
                          ) : c.signatureStatus === 'SIGNED' ? (
                            <button
                              onClick={() => patchStatus(c, 'paymentStatus', 'PAID', '입금 확인 사유(입금자/일자 등)를 입력하세요.')}
                              className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            >
                              지급대기 → 처리
                            </button>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded text-xs bg-zinc-500/10 text-zinc-500"
                              title="서명 완료 후 지급 처리할 수 있습니다."
                            >
                              서명 후 가능
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => router.push(`/admin/contracts/${c.id}/archive`)}
                            className={`px-2 py-0.5 rounded text-xs tabular-nums transition-colors ${
                              docCount >= DOC_TYPES.length
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                            }`}
                          >
                            문서함 {docCount}/{DOC_TYPES.length}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#1f2430]">
                    <td colSpan={5} className="px-4 py-3 text-zinc-400 text-xs">
                      합계 ({filtered.length}건)
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white tabular-nums">
                      {fmt(filteredTotal)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <NewContractModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            fetchContracts();
          }}
        />
      )}
    </div>
  );
}

/* ── 신규 계약 등록 인라인 모달 ────────────────────────────── */

const CONTRACT_TYPES = ['매매', '전세', '월세', '상가매매', '상가임대', '기타'];

function NewContractModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [agentQuery, setAgentQuery] = useState('');
  const [agentOptions, setAgentOptions] = useState<UserOption[]>([]);
  const [agent, setAgent] = useState<UserOption | null>(null);
  const [clientName, setClientName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [contractType, setContractType] = useState(CONTRACT_TYPES[0]);
  const [grossCommission, setGrossCommission] = useState('');
  const [contractDate, setContractDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 담당자 검색 (디바운스)
  useEffect(() => {
    if (agent) return;
    const q = agentQuery.trim();
    if (!q) {
      setAgentOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(q)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setAgentOptions(data.users || []);
        }
      } catch {
        /* 검색 실패는 무시 */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [agentQuery, agent]);

  const submit = async () => {
    setFormError(null);
    if (!agent) return setFormError('담당자를 선택해주세요.');
    if (!clientName.trim()) return setFormError('고객명을 입력해주세요.');
    if (!propertyAddress.trim()) return setFormError('주소를 입력해주세요.');
    const amount = Number(grossCommission);
    if (!amount || amount <= 0) return setFormError('보수액은 0보다 큰 숫자여야 합니다.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          grossCommission: amount,
          contractDate,
          clientName: clientName.trim(),
          propertyAddress: propertyAddress.trim(),
          contractType,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || '계약 등록에 실패했습니다.');
        return;
      }
      onCreated();
    } catch {
      setFormError('계약 등록 중 오류가 발생했습니다.');
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
        <h2 className="text-lg font-bold text-white">신규 계약 등록</h2>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">담당자</label>
          {agent ? (
            <div className="flex items-center justify-between bg-[#0a0c10] border border-[#1f2430] rounded-lg px-3 py-2 text-sm">
              <span>
                {agent.name}
                <span className="text-zinc-500 ml-1 text-xs">{roleKo(agent.role)} · {agent.employeeId}</span>
              </span>
              <button onClick={() => { setAgent(null); setAgentQuery(''); }} className="text-zinc-500 hover:text-white text-xs">
                변경
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={agentQuery}
                onChange={(e) => setAgentQuery(e.target.value)}
                placeholder="이름 또는 사번으로 검색"
                className={inputCls}
              />
              {agentOptions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-[#11141a] border border-[#1f2430] rounded-lg max-h-44 overflow-y-auto shadow-xl">
                  {agentOptions.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => { setAgent(u); setAgentOptions([]); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#171b23] transition-colors"
                      >
                        {u.name}
                        <span className="text-zinc-500 ml-1 text-xs">{roleKo(u.role)} · {u.employeeId}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">고객명</label>
          <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="예: 홍길동 (매수인)" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">거래 목적물 주소</label>
          <input type="text" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder="예: 서울시 강남구 테헤란로 123" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">계약 유형</label>
            <select value={contractType} onChange={(e) => setContractType(e.target.value)} className={inputCls}>
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">계약일</label>
            <input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">중개보수액 (원, 부가세 별도)</label>
          <input
            type="number"
            value={grossCommission}
            onChange={(e) => setGrossCommission(e.target.value)}
            placeholder="예: 5000000"
            min={0}
            step={100}
            className={`${inputCls} text-right tabular-nums`}
          />
        </div>

        {formError && <p className="text-rose-400 text-xs">{formError}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors">
            취소
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
          >
            {submitting ? '등록 중...' : '계약 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
