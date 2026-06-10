/*---
id: trust/[id]/page.tsx
milestone: M13
why: 인증매물 상세 — 신뢰 타임라인(현장 인증·본인인증·서류 검증·권리분석)을 고객에게 공개하는 시그니처 화면
backlinks: [[Trust UI]], [[trust/page.tsx]]
---*/

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

type TrustContractDetail = {
  id: string;
  propertyAddress: string | null;
  clientName: string | null;
  contractType: string | null;
  contractDate: string;
  signatureStatus: string;
  paymentStatus: string;
  agent: { name: string; role: UserRole; employeeId: string } | null;
};

function coveredDocTypes(docs: DocRow[]): number {
  const types = new Set(docs.map((d) => d.type));
  return DOC_TYPES.filter((t) => types.has(t)).length;
}

function certTier(covered: number) {
  if (covered >= 7)
    return {
      label: '자리 인증 완료',
      className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      ring: 'border-emerald-500/50 text-emerald-300',
    };
  if (covered >= 4)
    return {
      label: '인증 진행 중',
      className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
      ring: 'border-indigo-500/50 text-indigo-300',
    };
  if (covered >= 1)
    return {
      label: '검증 착수',
      className: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/40',
      ring: 'border-zinc-500/50 text-zinc-300',
    };
  return {
    label: '인증 준비 중',
    className: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/60',
    ring: 'border-zinc-700 text-zinc-500',
  };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 「시연 데이터」 회색 라벨 — 실데이터와 시연용을 구분하는 필수 표시 */
function DemoLabel() {
  return (
    <span className="inline-flex items-center rounded bg-zinc-700/50 border border-zinc-600/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
      시연 데이터
    </span>
  );
}

export default function TrustDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [contract, setContract] = useState<TrustContractDetail | null>(null);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/contracts/${id}/documents`)
      .then((res) => {
        if (!res.ok) throw new Error('매물 정보를 불러오지 못했습니다');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setContract(data.contract ?? null);
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
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
  }, [id]);

  const sortedDocs = useMemo(
    () =>
      [...documents].sort(
        (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      ),
    [documents]
  );

  const covered = coveredDocTypes(documents);
  const tier = certTier(covered);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0e13] text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">인증 기록을 불러오는 중…</div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-[#0c0e13] text-zinc-100 flex flex-col items-center justify-center gap-4 px-4 [word-break:keep-all]">
        <div className="text-red-300">{error || '매물을 찾을 수 없습니다'}</div>
        <Link
          href="/trust"
          className="text-sm text-emerald-300 hover:text-emerald-200 font-medium"
        >
          ← 인증매물 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e13] text-zinc-100 [word-break:keep-all]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/trust"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-emerald-300 transition-colors mb-8"
        >
          ← 자리 인증매물
        </Link>

        {/* 매물 식별 + 인증 뱃지 */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
              {contract.propertyAddress || '주소 비공개 매물'}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base text-zinc-400">
              <span>{contract.contractType || '유형 미공개'}</span>
              <span className="text-zinc-600">·</span>
              <span>
                담당 중개사{' '}
                <span className="text-zinc-100 font-semibold">
                  {contract.agent
                    ? `${contract.agent.name} ${ROLES_KO[contract.agent.role] ?? ''}`
                    : '배정 중'}
                </span>
              </span>
            </div>
          </div>

          {/* 큰 인증 뱃지 */}
          <div
            className={`shrink-0 self-start rounded-2xl border-2 ${tier.ring} bg-[#131720] px-5 py-4 text-center`}
          >
            <div className="text-2xl mb-1">✓</div>
            <div className="text-sm font-bold whitespace-nowrap">{tier.label}</div>
            <div className="mt-1 text-xs text-zinc-500">검증 서류 {covered}/7종</div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* 신뢰 타임라인 */}
          <section aria-label="신뢰 타임라인">
            <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-emerald-300">●</span> 신뢰 타임라인
            </h2>

            <ol className="relative border-l-2 border-white/10 ml-2 space-y-8">
              {/* ① 시연: 현장 방문 인증 */}
              <li className="pl-6 relative">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400" />
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-semibold text-zinc-100">현장 방문 인증</span>
                  <span className="text-emerald-300 text-sm">✓</span>
                  <DemoLabel />
                </div>
                <div className="rounded-2xl bg-[#131720] border border-white/5 p-4 space-y-3">
                  <div className="aspect-video max-w-sm rounded-xl bg-[#0c0e13] border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-600 text-sm gap-1">
                    <span className="text-2xl">📷</span>
                    <span>현장 인증 셀카</span>
                  </div>
                  <div className="rounded-xl bg-[#0c0e13] border border-white/5 px-4 py-3 text-sm text-zinc-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>📍 37.4923, 127.0312</span>
                    <span className="text-zinc-600">·</span>
                    <span>2026-06-09 14:23</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-emerald-300 font-medium">기기 서명 검증됨</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    담당 중개사가 매물 현장에서 직접 촬영해 GPS 좌표·촬영시각이
                    함께 봉인됩니다. &ldquo;문만 열어주는 중개&rdquo;는 이 단계를
                    통과할 수 없습니다.
                  </p>
                </div>
              </li>

              {/* ② 시연: 매물 의뢰인 본인인증 */}
              <li className="pl-6 relative">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400" />
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-semibold text-zinc-100">매물 의뢰인 본인인증</span>
                  <span className="text-emerald-300 text-sm">✓</span>
                  <DemoLabel />
                </div>
                <div className="rounded-2xl bg-[#131720] border border-white/5 p-4 flex items-center gap-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xl">
                    ✓
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">
                      소유자 본인인증 완료
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      등기부상 소유자와 매물 의뢰인의 동일성이 확인되었습니다.
                      허위매물은 이 단계에서 걸러집니다.
                    </p>
                  </div>
                </div>
              </li>

              {/* 실데이터: 서류 검증 이벤트 */}
              {sortedDocs.map((doc) => (
                <li key={doc.id} className="pl-6 relative">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500/20 border-2 border-indigo-400" />
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-zinc-100">서류 검증</span>
                    <span className="text-emerald-300 text-sm">✓</span>
                  </div>
                  <div className="rounded-2xl bg-[#131720] border border-white/5 p-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{doc.type}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        검증 완료 · {formatDateTime(doc.uploadedAt)}
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-indigo-500/15 border border-indigo-500/40 px-2.5 py-1 text-xs font-semibold text-indigo-300">
                      기록 봉인
                    </span>
                  </div>
                </li>
              ))}
              {sortedDocs.length === 0 && (
                <li className="pl-6 relative">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-zinc-700/40 border-2 border-zinc-600" />
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-zinc-400">서류 검증 대기</span>
                  </div>
                  <div className="rounded-2xl bg-[#131720] border border-white/5 p-4 text-sm text-zinc-500 leading-relaxed">
                    검증 서류가 등록되는 즉시 이 타임라인에 공개됩니다.
                  </div>
                </li>
              )}

              {/* ③ 시연: 권리분석 리포트 */}
              <li className="pl-6 relative">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400" />
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-semibold text-zinc-100">권리분석 리포트</span>
                  <span className="text-emerald-300 text-sm">✓</span>
                  <DemoLabel />
                </div>
                <div className="rounded-2xl bg-[#131720] border border-white/5 p-4">
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    등기부등본 기준 선순위 권리관계 요약 — 전세사기의 핵심 원인인
                    &ldquo;깡통 위험&rdquo;을 계약 전에 투명하게 공개합니다.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-zinc-500 border-b border-white/5">
                          <th className="py-2 pr-4 font-medium">항목</th>
                          <th className="py-2 pr-4 font-medium">내용</th>
                          <th className="py-2 font-medium">판정</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-300">
                        <tr className="border-b border-white/5">
                          <td className="py-2.5 pr-4">소유권</td>
                          <td className="py-2.5 pr-4">단독 소유 · 압류/가압류 없음</td>
                          <td className="py-2.5 text-emerald-300 font-medium">안전</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2.5 pr-4">선순위 근저당</td>
                          <td className="py-2.5 pr-4">채권최고액 1.2억 (시세 대비 18%)</td>
                          <td className="py-2.5 text-emerald-300 font-medium">양호</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-4">선순위 임차권</td>
                          <td className="py-2.5 pr-4">해당 없음</td>
                          <td className="py-2.5 text-emerald-300 font-medium">안전</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </li>
            </ol>
          </section>

          {/* 고정 카드: 봉인 안내 + 연락 */}
          <aside className="lg:sticky lg:top-8 self-start space-y-4">
            <div className="rounded-2xl bg-[#131720] border border-emerald-500/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                  🔒
                </span>
                <span className="text-sm font-bold text-emerald-200">위·변조 불가 기록</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                이 타임라인은 위·변조할 수 없도록 기록 즉시 봉인됩니다. 고객은
                중개사를 믿는 것이 아니라, 봉인된 기록을 확인합니다.
              </p>
            </div>

            <div className="rounded-2xl bg-[#131720] border border-white/5 p-5">
              <div className="text-xs text-zinc-500 mb-1">담당 중개사</div>
              <div className="text-base font-semibold text-zinc-100 mb-4">
                {contract.agent
                  ? `${contract.agent.name} ${ROLES_KO[contract.agent.role] ?? ''}`
                  : '배정 중'}
              </div>
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors text-[#0c0e13] font-bold py-3 text-sm"
              >
                담당 중개사에게 연락하기
              </button>
              <p className="mt-2 text-[11px] text-zinc-600 text-center">
                프로토타입 화면입니다 — 버튼은 동작하지 않습니다
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
