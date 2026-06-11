/*---
id: page.tsx
milestone: M4
why: 매물 원장 목록 — 활성/인증 현황이 답, 검색·필터·카드 그리드
backlinks: [[[Pages]]]
---*/

/**
 * @file src/app/properties/page.tsx
 * @description 매물 목록 — "활성 매물 N건 · 인증 완료 N건" 답 먼저, 검색 + 거래유형/상태 필터, 카드 그리드
 * @dependencies /api/properties (GET)
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ROLES_KO, type UserRole } from '@/types';
import { areaLabel, priceLabel } from './format';

type AgentInfo = { name: string; role: string; employeeId: string };
type PropertyRow = {
  id: string;
  address: string;
  propertyType: string;
  dealType: string;
  price: number;
  monthlyRent: number | null;
  areaM2: number | null;
  status: 'ACTIVE' | 'CONTRACTED' | 'HIDDEN';
  ownerName: string | null;
  ownerVerified: boolean;
  fieldVerifiedAt: string | null;
  agent: AgentInfo;
  createdAt: string;
};

const DEAL_FILTERS = ['ALL', '매매', '전세', '월세'] as const;
const STATUS_FILTERS = [
  ['ALL', '전체'],
  ['ACTIVE', '활성'],
  ['CONTRACTED', '계약완료'],
  ['HIDDEN', '숨김'],
] as const;

const STATUS_CHIP: Record<PropertyRow['status'], { label: string; cls: string }> = {
  ACTIVE: { label: '활성', cls: 'bg-emerald-500/10 text-emerald-400' },
  CONTRACTED: { label: '계약완료', cls: 'bg-indigo-500/10 text-indigo-400' },
  HIDDEN: { label: '숨김', cls: 'bg-zinc-500/10 text-zinc-500' },
};

const roleKo = (role: string) => ROLES_KO[role as UserRole] ?? role;

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dealFilter, setDealFilter] = useState<(typeof DEAL_FILTERS)[number]>('ALL');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number][0]>('ALL');

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: '500' });
      if (search.trim()) qs.set('search', search.trim());
      if (dealFilter !== 'ALL') qs.set('dealType', dealFilter);
      if (statusFilter !== 'ALL') qs.set('status', statusFilter);
      const res = await fetch(`/api/properties?${qs.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '매물 목록을 불러오지 못했습니다.');
      }
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '매물 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [search, dealFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchProperties, 300);
    return () => clearTimeout(t);
  }, [fetchProperties]);

  // 답 먼저: 활성 매물 수 · 인증 완료(의뢰인+현장 모두) 수
  const summary = useMemo(() => {
    const active = properties.filter((p) => p.status === 'ACTIVE').length;
    const verified = properties.filter((p) => p.ownerVerified && p.fieldVerifiedAt).length;
    return { active, verified };
  }, [properties]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">매물 원장</h1>
            <p className="text-sm text-zinc-500 mt-1">매물 등록·인증·상태 관리</p>
          </div>
          <Link
            href="/properties/new"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            + 신규 매물 등록
          </Link>
        </header>

        {/* 답 먼저: 큰 숫자 요약 */}
        <section className="grid grid-cols-2 gap-4 max-w-xl">
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">활성 매물</p>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">
              {loading ? '—' : summary.active}
              <span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </p>
          </div>
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">인증 완료 (의뢰인 + 현장)</p>
            <p className="text-3xl font-bold text-white tabular-nums">
              {loading ? '—' : summary.verified}
              <span className="text-base font-medium text-zinc-500 ml-1">건</span>
            </p>
          </div>
        </section>

        {/* 검색 + 필터 */}
        <section className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="주소 / 의뢰인명 검색"
            className="flex-1 bg-[#11141a] border border-[#1f2430] rounded-lg px-4 py-2 text-sm text-[#cdd2da] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1">
              {DEAL_FILTERS.map((key) => (
                <button
                  key={key}
                  onClick={() => setDealFilter(key)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    dealFilter === key
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white'
                  }`}
                >
                  {key === 'ALL' ? '전체 거래' : key}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {STATUS_FILTERS.map(([key, label]) => (
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
          </div>
        </section>

        {/* 매물 카드 그리드 */}
        {loading ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            매물 목록을 불러오는 중...
          </div>
        ) : error ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button
              onClick={fetchProperties}
              className="text-sm text-indigo-400 hover:text-indigo-300 underline"
            >
              다시 시도
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
            조건에 맞는 매물이 없습니다.{' '}
            <Link href="/properties/new" className="text-indigo-400 hover:text-indigo-300 underline">
              신규 매물 등록
            </Link>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="block bg-[#11141a] border border-[#1f2430] rounded-xl p-5 hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-white leading-snug">{p.address}</h2>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs ${STATUS_CHIP[p.status].cls}`}>
                    {STATUS_CHIP[p.status].label}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-1">
                  {p.propertyType} · {p.dealType}
                  {p.dealType === '월세' && <span className="ml-1">(보증금/월세)</span>}
                </p>
                <p className="text-xl font-bold text-white tabular-nums mb-2">{priceLabel(p)}</p>
                <p className="text-xs text-zinc-500 mb-3">{areaLabel(p.areaM2)}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    담당 {p.agent?.name}
                    <span className="text-zinc-600 ml-1">{roleKo(p.agent?.role)}</span>
                  </span>
                  <span className="flex gap-1">
                    {p.ownerVerified && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">의뢰인 인증 ✓</span>
                    )}
                    {p.fieldVerifiedAt && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">현장 인증 ✓</span>
                    )}
                    {!p.ownerVerified && !p.fieldVerifiedAt && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">미인증</span>
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
