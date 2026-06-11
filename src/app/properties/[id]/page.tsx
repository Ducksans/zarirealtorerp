/*---
id: page.tsx
milestone: M4
why: 매물 상세 — 가격이 답, 인증 카드(의뢰인/현장)와 상태 변경을 AuditLog 사유와 함께 처리
backlinks: [[[Pages]]]
---*/

/**
 * @file src/app/properties/[id]/page.tsx
 * @description 매물 상세 — 상단 가격(가장 큰 숫자), 이미지/정보 전체, 인증 카드(PATCH verify), 상태 변경(사유 prompt)
 * @dependencies /api/properties/[id] (GET/PATCH), ../format (가격·면적 공통 표기)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ROLES_KO, type UserRole } from '@/types';
import { areaLabel, formatKoreanPrice, priceLabel } from '../format';

type AgentInfo = { name: string; role: string; employeeId: string };
type PropertyDetail = {
  id: string;
  address: string;
  propertyType: string;
  dealType: string;
  price: number;
  monthlyRent: number | null;
  areaM2: number | null;
  description: string | null;
  imageUrls: string | null;
  status: 'ACTIVE' | 'CONTRACTED' | 'HIDDEN';
  ownerName: string | null;
  ownerVerified: boolean;
  fieldVerifiedAt: string | null;
  agentId: string;
  agent: AgentInfo;
  createdAt: string;
  updatedAt: string;
};

const STATUS_META: Record<
  PropertyDetail['status'],
  { label: string; chip: string }
> = {
  ACTIVE: { label: '활성', chip: 'bg-emerald-500/10 text-emerald-400' },
  CONTRACTED: { label: '계약완료', chip: 'bg-indigo-500/10 text-indigo-400' },
  HIDDEN: { label: '숨김', chip: 'bg-zinc-500/10 text-zinc-500' },
};

const STATUSES = ['ACTIVE', 'CONTRACTED', 'HIDDEN'] as const;

const roleKo = (role: string) => ROLES_KO[role as UserRole] ?? role;

function parseImageUrls(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((u) => typeof u === 'string' && u) : [];
  } catch {
    return [];
  }
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const fetchProperty = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '매물 정보를 불러오지 못했습니다.');
      setProperty(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '매물 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchProperty();
  }, [id, fetchProperty]);

  /** PATCH 공통 처리 — 인증/상태 변경 모두 사유와 함께 전송 */
  const patchProperty = async (payload: Record<string, unknown>, failMsg: string) => {
    setActing(true);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || failMsg);
      setProperty(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : failMsg);
    } finally {
      setActing(false);
    }
  };

  const handleVerify = (kind: 'owner' | 'field') => {
    const title = kind === 'owner' ? '의뢰인 인증' : '현장 인증';
    const reason = window.prompt(`${title} 사유를 입력해주세요. (감사 로그에 기록됩니다)`);
    if (reason === null) return; // 취소
    patchProperty(
      { verify: kind, reason: reason.trim() || `${title} 처리` },
      `${title} 처리에 실패했습니다.`
    );
  };

  const handleStatusChange = (next: PropertyDetail['status']) => {
    if (!property || next === property.status) return;
    const reason = window.prompt(
      `상태를 '${STATUS_META[next].label}'(으)로 변경하는 사유를 입력해주세요.`
    );
    if (reason === null) return; // 취소
    patchProperty(
      { status: next, reason: reason.trim() || '매물 상태 변경' },
      '상태 변경에 실패했습니다.'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
        <div className="max-w-4xl mx-auto bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
          매물 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
        <div className="max-w-4xl mx-auto bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
          <p className="text-rose-400 text-sm mb-4">{error || '매물을 찾을 수 없습니다.'}</p>
          <div className="flex justify-center gap-4 text-sm">
            <button onClick={fetchProperty} className="text-indigo-400 hover:text-indigo-300 underline">
              다시 시도
            </button>
            <Link href="/properties" className="text-zinc-500 hover:text-zinc-300 underline">
              목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = parseImageUrls(property.imageUrls);
  const fullyVerified = property.ownerVerified && !!property.fieldVerifiedAt;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더: 답 먼저 — 가격이 가장 큰 숫자 */}
        <header>
          <Link href="/properties" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            ← 매물 원장
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mt-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs ${STATUS_META[property.status].chip}`}>
                  {STATUS_META[property.status].label}
                </span>
                <span className="text-xs text-zinc-500">
                  {property.propertyType} · {property.dealType}
                  {property.dealType === '월세' && ' (보증금/월세)'}
                </span>
              </div>
              <p className="text-4xl font-bold text-white tabular-nums tracking-tight">
                {priceLabel(property)}
              </p>
              <h1 className="text-base text-zinc-400 mt-2">{property.address}</h1>
            </div>
            <span
              className={`shrink-0 self-start lg:self-end px-3 py-1.5 rounded-lg text-xs font-semibold ${
                fullyVerified
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {fullyVerified ? '인증 완료 매물' : '인증 대기'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 좌: 이미지 + 정보 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 이미지 */}
            <section className="bg-[#11141a] border border-[#1f2430] rounded-xl overflow-hidden">
              {images.length > 0 ? (
                <div className="space-y-px">
                  <img
                    src={images[0]}
                    alt={`${property.address} 대표 이미지`}
                    className="w-full aspect-video object-cover"
                  />
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-px">
                      {images.slice(1).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`${property.address} 이미지 ${i + 2}`}
                          className="w-full aspect-square object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center text-zinc-600 gap-2">
                  <span className="text-3xl">🏠</span>
                  <span className="text-xs">등록된 이미지가 없습니다</span>
                </div>
              )}
            </section>

            {/* 정보 전체 */}
            <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">매물 정보</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-zinc-500 mb-0.5">{property.dealType === '매매' ? '매매가' : '보증금'}</dt>
                  <dd className="text-white tabular-nums">{formatKoreanPrice(property.price)}</dd>
                </div>
                {property.dealType === '월세' && (
                  <div>
                    <dt className="text-xs text-zinc-500 mb-0.5">월세</dt>
                    <dd className="text-white tabular-nums">
                      {property.monthlyRent ? formatKoreanPrice(property.monthlyRent) : '—'}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-zinc-500 mb-0.5">전용면적</dt>
                  <dd>{areaLabel(property.areaM2)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 mb-0.5">의뢰인</dt>
                  <dd>{property.ownerName || '미입력'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 mb-0.5">담당자</dt>
                  <dd>
                    {property.agent?.name}
                    <span className="text-zinc-500 text-xs ml-1.5">
                      {roleKo(property.agent?.role)} · {property.agent?.employeeId}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 mb-0.5">등록일</dt>
                  <dd className="text-zinc-400">{fmtDate(property.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 mb-0.5">최근 수정</dt>
                  <dd className="text-zinc-400">{fmtDate(property.updatedAt)}</dd>
                </div>
              </dl>
              {property.description && (
                <div className="mt-4 pt-4 border-t border-[#1f2430]">
                  <p className="text-xs text-zinc-500 mb-1.5">설명</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* 우: 인증 카드 + 상태 변경 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 인증 카드 */}
            <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">매물 인증</h2>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-300">의뢰인 인증</p>
                  <p className="text-xs text-zinc-600 mt-0.5">의뢰인 본인 확인 완료 마크</p>
                </div>
                {property.ownerVerified ? (
                  <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400">
                    인증 완료 ✓
                  </span>
                ) : (
                  <button
                    onClick={() => handleVerify('owner')}
                    disabled={acting}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    의뢰인 인증
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-300">현장 인증</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {property.fieldVerifiedAt
                      ? fmtDate(property.fieldVerifiedAt)
                      : '현장 방문 확인 시각 기록'}
                  </p>
                </div>
                {property.fieldVerifiedAt ? (
                  <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400">
                    인증 완료 ✓
                  </span>
                ) : (
                  <button
                    onClick={() => handleVerify('field')}
                    disabled={acting}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    현장 인증
                  </button>
                )}
              </div>

              {!fullyVerified && (
                <p className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
                  두 인증을 모두 완료하면 인증 매물로 노출됩니다.
                </p>
              )}
            </section>

            {/* 상태 변경 */}
            <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">상태 변경</h2>
              <div className="grid grid-cols-3 gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={acting || s === property.status}
                    className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      s === property.status
                        ? 'bg-indigo-600 text-white cursor-default'
                        : 'bg-[#0a0c10] border border-[#1f2430] text-zinc-400 hover:text-white hover:border-indigo-500/50 disabled:opacity-50'
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-3">
                변경 시 사유를 입력받아 감사 로그에 기록합니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
