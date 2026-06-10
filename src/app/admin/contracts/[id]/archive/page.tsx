/*---
id: page.tsx
milestone: M16
why: 계약별 문서 보관함 — 필수 서류 7종 완비 여부가 답
backlinks: [[[Pages]]]
---*/

/**
 * @file src/app/admin/contracts/[id]/archive/page.tsx
 * @description 계약별 문서함 — 계약 요약 + 필수 서류 7종 체크리스트("완비 N/7") + 문서 목록/등록/삭제
 * @dependencies GET/POST/DELETE /api/contracts/[id]/documents
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
type DocType = (typeof DOC_TYPES)[number];

type ContractInfo = {
  id: string;
  propertyAddress: string | null;
  clientName: string | null;
  contractType: string | null;
  grossCommission: number;
  contractDate: string;
  signatureStatus: 'PENDING' | 'SIGNED';
  paymentStatus: 'PENDING' | 'PAID' | 'NON_PAID';
  agent: { name: string; role: string; employeeId: string };
};

type DocRow = {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};

const roleKo = (role: string) => ROLES_KO[role as UserRole] ?? role;
const fmt = (n: number) => n.toLocaleString('ko-KR');
const fmtDateTime = (iso: string) => iso.replace('T', ' ').slice(0, 16);

export default function ContractArchivePage() {
  const params = useParams<{ id: string }>();
  const contractId = params.id;

  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 등록 폼
  const [formType, setFormType] = useState<DocType>('계약서');
  const [formFileName, setFormFileName] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/documents`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '문서함 정보를 불러오지 못했습니다.');
      }
      const data = await res.json();
      setContract(data.contract);
      setDocuments(data.documents || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '문서함 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const registeredTypes = useMemo(() => new Set(documents.map((d) => d.type)), [documents]);
  const completedCount = useMemo(
    () => DOC_TYPES.filter((t) => registeredTypes.has(t)).length,
    [registeredTypes]
  );
  const isComplete = completedCount === DOC_TYPES.length;

  const submitDocument = async () => {
    setFormError(null);
    if (!formFileName.trim()) return setFormError('파일명을 입력해주세요.');
    if (!formFileUrl.trim()) return setFormError('파일 URL/경로를 입력해주세요.');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          fileName: formFileName.trim(),
          fileUrl: formFileUrl.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || '문서 등록에 실패했습니다.');
        return;
      }
      setFormFileName('');
      setFormFileUrl('');
      fetchData();
    } catch {
      setFormError('문서 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDocument = async (doc: DocRow) => {
    const reason = window.prompt(`'${doc.fileName}' 삭제 사유를 입력하세요.`);
    if (!reason || !reason.trim()) return;
    try {
      const res = await fetch(
        `/api/contracts/${contractId}/documents?docId=${encodeURIComponent(doc.id)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason.trim() }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '문서 삭제에 실패했습니다.');
        return;
      }
      fetchData();
    } catch {
      alert('문서 삭제 중 오류가 발생했습니다.');
    }
  };

  const inputCls =
    'w-full bg-[#0a0c10] border border-[#1f2430] rounded-lg px-3 py-2 text-sm text-[#cdd2da] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-zinc-500 flex items-center justify-center text-sm">
        문서함을 불러오는 중...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center gap-3">
        <p className="text-rose-400 text-sm">{error || '계약 정보를 찾을 수 없습니다.'}</p>
        <button onClick={fetchData} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
          다시 시도
        </button>
        <Link href="/admin/contracts" className="text-xs text-zinc-500 hover:text-white">
          ← 계약 원장으로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/admin/contracts" className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← 계약 원장
        </Link>

        {/* 계약 요약 헤더 */}
        <header className="bg-[#11141a] border border-[#1f2430] rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {contract.contractType && (
                  <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/10 text-indigo-400">
                    {contract.contractType}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    contract.signatureStatus === 'SIGNED'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {contract.signatureStatus === 'SIGNED' ? '서명완료' : '서명대기'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    contract.paymentStatus === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : contract.paymentStatus === 'NON_PAID'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {contract.paymentStatus === 'PAID' ? '입금완료' : contract.paymentStatus === 'NON_PAID' ? '미지급' : '지급대기'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white">
                {contract.propertyAddress || '(주소 미입력)'}
              </h1>
              <p className="text-sm text-zinc-400 mt-2">
                고객 <span className="text-[#cdd2da]">{contract.clientName || '—'}</span>
                <span className="mx-2 text-zinc-700">·</span>
                담당 <span className="text-[#cdd2da]">{contract.agent.name} {roleKo(contract.agent.role)}</span>
                <span className="mx-2 text-zinc-700">·</span>
                계약일 <span className="text-[#cdd2da] tabular-nums">{contract.contractDate?.slice(0, 10)}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-zinc-500 mb-1">중개보수액 (부가세 별도)</p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {fmt(contract.grossCommission)}<span className="text-sm font-medium text-zinc-500 ml-1">원</span>
              </p>
            </div>
          </div>
        </header>

        {/* 필수 서류 체크리스트: "완비 N/7"이 답 */}
        <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-6">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">필수 서류 체크리스트</h2>
            <p className={`text-3xl font-bold tabular-nums ${isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
              완비 {completedCount}/{DOC_TYPES.length}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DOC_TYPES.map((t) => {
              const ok = registeredTypes.has(t);
              return (
                <div
                  key={t}
                  className={`rounded-lg border px-3 py-2 text-xs text-center ${
                    ok
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  }`}
                >
                  <span className="block font-semibold mb-0.5">{ok ? '✓ 등록' : '누락'}</span>
                  {t}
                </div>
              );
            })}
          </div>
        </section>

        {/* 문서 등록 폼 */}
        <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">문서 등록</h2>
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_1fr_auto] gap-3 items-start">
            <select value={formType} onChange={(e) => setFormType(e.target.value as DocType)} className={inputCls}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              value={formFileName}
              onChange={(e) => setFormFileName(e.target.value)}
              placeholder="파일명 (예: 매매계약서_최종.pdf)"
              className={inputCls}
            />
            <input
              type="text"
              value={formFileUrl}
              onChange={(e) => setFormFileUrl(e.target.value)}
              placeholder="파일 URL 또는 보관 경로"
              className={inputCls}
            />
            <button
              onClick={submitDocument}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            스토리지 연동 전 단계 — 파일은 외부 보관 후 URL/경로 문자열로 등록합니다.
          </p>
          {formError && <p className="text-rose-400 text-xs mt-2">{formError}</p>}
        </section>

        {/* 문서 목록 */}
        <section className="bg-[#11141a] border border-[#1f2430] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1f2430]">
            <h2 className="text-sm font-semibold text-white">
              보관 문서 <span className="text-zinc-500 tabular-nums">{documents.length}건</span>
            </h2>
          </div>
          {documents.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-sm">등록된 문서가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs border-b border-[#1f2430]">
                  <th className="text-left font-medium px-6 py-3">종류</th>
                  <th className="text-left font-medium px-4 py-3">파일명</th>
                  <th className="text-left font-medium px-4 py-3">등록일시</th>
                  <th className="text-right font-medium px-6 py-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} className="border-b border-[#1f2430] last:border-b-0 hover:bg-[#171b23] transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-xs bg-zinc-500/10 text-zinc-400">{d.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 hover:underline break-all"
                      >
                        {d.fileName}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-zinc-400">
                      {fmtDateTime(d.uploadedAt)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => deleteDocument(d)}
                        className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
