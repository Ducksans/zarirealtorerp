/*---
id: trust/page.tsx
milestone: M13
why: 고객용 인증매물 목록 — "중개사의 선의가 아니라 시스템이 신뢰를 보증한다"를 입사설명회·고객 화면에서 증명
backlinks: [[Trust UI]], [[A/B 전장 ④]]
---*/

'use client';

import { useEffect, useMemo, useState } from 'react';
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

type DocRow = {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};

type TrustContract = {
  id: string;
  propertyAddress: string | null;
  clientName: string | null;
  contractType: string | null;
  contractDate: string;
  signatureStatus: string;
  paymentStatus: string;
  agent: { name: string; role: UserRole; employeeId: string } | null;
  documents: DocRow[];
};

/** 7종 필수 서류 중 몇 종이 충족됐는지 (중복 type은 1종으로) */
function coveredDocTypes(docs: DocRow[]): number {
  const types = new Set(docs.map((d) => d.type));
  return DOC_TYPES.filter((t) => types.has(t)).length;
}

type BadgeTier = {
  label: string;
  className: string;
  dot: string;
};

function certTier(covered: number): BadgeTier {
  if (covered >= 7)
    return {
      label: '자리 인증 완료',
      className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      dot: 'bg-emerald-400',
    };
  if (covered >= 4)
    return {
      label: '인증 진행 중',
      className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
      dot: 'bg-indigo-400',
    };
  if (covered >= 1)
    return {
      label: '검증 착수',
      className: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/40',
      dot: 'bg-zinc-400',
    };
  return {
    label: '인증 준비 중',
    className: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/60',
    dot: 'bg-zinc-600',
  };
}

export default function TrustListPage() {
  const [contracts, setContracts] = useState<TrustContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/contracts?withDocs=1&limit=100')
      .then((res) => {
        if (!res.ok) throw new Error('매물 정보를 불러오지 못했습니다');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setContracts(Array.isArray(data.contracts) ? data.contracts : []);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '오류가 발생했습니다');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const inProgress = contracts.filter((c) => c.documents.length >= 1).length;
    const complete = contracts.filter((c) => coveredDocTypes(c.documents) >= 7).length;
    const timelineEvents = contracts.reduce((sum, c) => sum + c.documents.length, 0);
    return { inProgress, complete, timelineEvents };
  }, [contracts]);

  return (
    <div className="min-h-screen bg-[#0c0e13] text-zinc-100 [word-break:keep-all]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* 헤더 */}
        <header className="mb-10 sm:mb-14">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-bold">
              ✓
            </span>
            <span className="text-emerald-300 text-sm font-semibold tracking-wide">
              ZARI TRUST
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            자리 인증매물
          </h1>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
            모든 매물은 현장 인증·서류 검증·타임라인 공개를 거칩니다. 중개사의
            선의가 아니라, 시스템이 신뢰를 보증합니다.
          </p>
        </header>

        {/* 신뢰 지표 */}
        <section
          aria-label="신뢰 지표"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-14"
        >
          <div className="rounded-2xl bg-[#131720] border border-white/5 p-5 sm:p-6">
            <div className="text-sm text-zinc-400 mb-1">인증 진행 매물</div>
            <div className="text-3xl sm:text-4xl font-bold text-indigo-300">
              {loading ? '—' : stats.inProgress}
              <span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">검증 서류 1건 이상 등록</div>
          </div>
          <div className="rounded-2xl bg-[#131720] border border-white/5 p-5 sm:p-6">
            <div className="text-sm text-zinc-400 mb-1">서류 완비 매물</div>
            <div className="text-3xl sm:text-4xl font-bold text-emerald-300">
              {loading ? '—' : stats.complete}
              <span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">필수 서류 7종 전부 충족</div>
          </div>
          <div className="rounded-2xl bg-[#131720] border border-white/5 p-5 sm:p-6">
            <div className="text-sm text-zinc-400 mb-1">공개 타임라인 이벤트</div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100">
              {loading ? '—' : stats.timelineEvents}
              <span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">고객에게 공개된 검증 기록</div>
          </div>
        </section>

        {/* 매물 카드 그리드 */}
        {error ? (
          <div className="rounded-2xl bg-[#131720] border border-red-500/30 p-8 text-center text-red-300">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#131720] border border-white/5 h-44 animate-pulse"
              />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="rounded-2xl bg-[#131720] border border-white/5 p-12 text-center text-zinc-500">
            공개된 인증매물이 아직 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((c) => {
              const covered = coveredDocTypes(c.documents);
              const tier = certTier(covered);
              return (
                <Link
                  key={c.id}
                  href={`/trust/${c.id}`}
                  className="group rounded-2xl bg-[#131720] border border-white/5 p-5 sm:p-6 flex flex-col gap-4 transition-colors hover:border-emerald-500/40 focus-visible:outline-2 focus-visible:outline-emerald-400"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg sm:text-xl font-semibold leading-snug text-zinc-100 group-hover:text-emerald-200 transition-colors">
                      {c.propertyAddress || '주소 비공개 매물'}
                    </h2>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tier.className}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                      {tier.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                    <span>{c.contractType || '유형 미공개'}</span>
                    <span className="text-zinc-600">·</span>
                    <span>
                      담당{' '}
                      <span className="text-zinc-200 font-medium">
                        {c.agent
                          ? `${c.agent.name} ${ROLES_KO[c.agent.role] ?? ''}`
                          : '배정 중'}
                      </span>
                    </span>
                  </div>

                  <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      검증 서류 <span className="text-zinc-300 font-semibold">{covered}</span>
                      /7종
                    </span>
                    <span className="text-emerald-300/80 font-medium group-hover:text-emerald-300">
                      타임라인 보기 →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <footer className="mt-14 text-center text-xs text-zinc-600 leading-relaxed">
          자리 공인중개사 사무소 · 모든 인증 기록은 기록 즉시 봉인되어 위·변조할 수
          없습니다
        </footer>
      </div>
    </div>
  );
}
