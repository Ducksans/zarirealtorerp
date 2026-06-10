/*---
id: page.tsx
milestone: M16
why: 전사 문서 보관소 대시보드 — 서류 완비율이 답
backlinks: [[[Pages]]]
---*/

/**
 * @file src/app/admin/archive/page.tsx
 * @description 전사 문서 보관소 — 전체 계약 서류 완비율(%), 미비 계약 목록(누락 종류), 최근 등록 문서 10건
 * @dependencies GET /api/contracts?withDocs=1
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

type DocRow = { id: string; type: string; fileName: string; fileUrl: string; uploadedAt: string };
type ContractRow = {
  id: string;
  propertyAddress: string | null;
  clientName: string | null;
  contractType: string | null;
  grossCommission: number;
  contractDate: string;
  agent: { name: string; role: string; employeeId: string };
  documents: DocRow[];
};

const roleKo = (role: string) => ROLES_KO[role as UserRole] ?? role;
const fmtDateTime = (iso: string) => iso.replace('T', ' ').slice(0, 16);

function missingTypes(c: ContractRow): string[] {
  const types = new Set(c.documents.map((d) => d.type));
  return DOC_TYPES.filter((t) => !types.has(t));
}

export default function ArchiveDashboardPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contracts?withDocs=1&limit=1000');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '문서 보관소 데이터를 불러오지 못했습니다.');
      }
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '문서 보관소 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const incomplete = contracts
      .map((c) => ({ contract: c, missing: missingTypes(c) }))
      .filter((x) => x.missing.length > 0);
    const completeCount = contracts.length - incomplete.length;
    const rate = contracts.length === 0 ? 0 : Math.round((completeCount / contracts.length) * 100);
    return { incomplete, completeCount, rate };
  }, [contracts]);

  const recentDocs = useMemo(() => {
    return contracts
      .flatMap((c) => c.documents.map((d) => ({ doc: d, contract: c })))
      .sort((a, b) => (a.doc.uploadedAt < b.doc.uploadedAt ? 1 : -1))
      .slice(0, 10);
  }, [contracts]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white tracking-tight">전사 문서 보관소</h1>
          <p className="text-sm text-zinc-500 mt-1">계약별 필수 서류 7종 완비 현황</p>
        </header>

        {loading ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            보관소 현황을 불러오는 중...
          </div>
        ) : error ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button onClick={fetchData} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              다시 시도
            </button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            등록된 계약이 없습니다.
          </div>
        ) : (
          <>
            {/* 답: 서류 완비율 */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-6">
                <p className="text-xs text-zinc-500 mb-2">전체 계약 서류 완비율</p>
                <p className={`text-5xl font-bold tabular-nums ${stats.rate === 100 ? 'text-emerald-400' : 'text-white'}`}>
                  {stats.rate}<span className="text-xl font-medium text-zinc-500 ml-1">%</span>
                </p>
              </div>
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-6">
                <p className="text-xs text-zinc-500 mb-2">완비 계약</p>
                <p className="text-3xl font-bold text-emerald-400 tabular-nums">
                  {stats.completeCount}<span className="text-base font-medium text-zinc-500 ml-1">건</span>
                </p>
              </div>
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-6">
                <p className="text-xs text-zinc-500 mb-2">미비 계약</p>
                <p className={`text-3xl font-bold tabular-nums ${stats.incomplete.length > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {stats.incomplete.length}<span className="text-base font-medium text-zinc-500 ml-1">건</span>
                </p>
              </div>
            </section>

            {/* 미비 계약 목록 */}
            <section className="bg-[#11141a] border border-[#1f2430] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1f2430]">
                <h2 className="text-sm font-semibold text-white">
                  서류 미비 계약 <span className="text-amber-400 tabular-nums">{stats.incomplete.length}건</span>
                </h2>
              </div>
              {stats.incomplete.length === 0 ? (
                <div className="p-12 text-center text-emerald-400 text-sm">
                  모든 계약의 필수 서류가 완비되었습니다.
                </div>
              ) : (
                <div className="divide-y divide-[#1f2430]">
                  {stats.incomplete.map(({ contract: c, missing }) => (
                    <button
                      key={c.id}
                      onClick={() => router.push(`/admin/contracts/${c.id}/archive`)}
                      className="w-full text-left px-6 py-4 hover:bg-[#171b23] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">
                            {c.propertyAddress || '(주소 미입력)'}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {c.clientName || '—'}
                            <span className="mx-1.5 text-zinc-700">·</span>
                            {c.agent?.name} {roleKo(c.agent?.role)}
                            <span className="mx-1.5 text-zinc-700">·</span>
                            <span className="tabular-nums">{c.contractDate?.slice(0, 10)}</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 shrink-0">
                          {missing.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400">
                              {t} 누락
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 최근 등록 문서 10건 */}
            <section className="bg-[#11141a] border border-[#1f2430] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1f2430]">
                <h2 className="text-sm font-semibold text-white">최근 등록 문서 10건</h2>
              </div>
              {recentDocs.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-sm">등록된 문서가 없습니다.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 text-xs border-b border-[#1f2430]">
                      <th className="text-left font-medium px-6 py-3">등록일시</th>
                      <th className="text-left font-medium px-4 py-3">종류</th>
                      <th className="text-left font-medium px-4 py-3">파일명</th>
                      <th className="text-left font-medium px-4 py-3">계약</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocs.map(({ doc, contract: c }) => (
                      <tr
                        key={doc.id}
                        onClick={() => router.push(`/admin/contracts/${c.id}/archive`)}
                        className="border-b border-[#1f2430] last:border-b-0 hover:bg-[#171b23] cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3 whitespace-nowrap tabular-nums text-zinc-400">
                          {fmtDateTime(doc.uploadedAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-xs bg-zinc-500/10 text-zinc-400">{doc.type}</span>
                        </td>
                        <td className="px-4 py-3 break-all">{doc.fileName}</td>
                        <td className="px-4 py-3 max-w-[260px] truncate text-zinc-400" title={c.propertyAddress || ''}>
                          {c.clientName || '—'}
                          <span className="mx-1 text-zinc-700">·</span>
                          {c.propertyAddress || '(주소 미입력)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
