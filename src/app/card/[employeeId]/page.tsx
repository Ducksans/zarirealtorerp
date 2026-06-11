/*---
id: card_page
milestone: M15
why: 고객이 받는 스마트 명함 — 종이 명함의 자랑이 아니라 시스템이 발급한 위·변조 불가 실적으로 신뢰를 보증하는 공개 화면
backlinks: [[card_api]], [[trust_page]]
---*/

/**
 * @file src/app/card/[employeeId]/page.tsx
 * @description M15 스마트 명함 (공개, 모바일 세로 우선)
 * @purpose 이름·직급·근속·실적 뱃지(누적 계약/인증매물) + 인증매물·상담 CTA.
 *          QR은 라이브러리 없이 페이지 URL 텍스트 표기로 대체.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ROLES_KO, type UserRole } from '@/types';

type CardData = {
  name: string;
  role: string;
  employeeId: string;
  joinedAt: string;
  stats: {
    thisMonthContracts: number;
    totalContracts: number;
    verifiedProperties: number;
  };
};

/** 근속 기간 한글 표기 (n년 n개월 / n개월 / 이번 달 합류) */
function tenureLabel(joinedAt: string): string {
  const joined = new Date(joinedAt);
  const now = new Date();
  let months =
    (now.getFullYear() - joined.getFullYear()) * 12 +
    (now.getMonth() - joined.getMonth());
  if (now.getDate() < joined.getDate()) months -= 1;
  if (months <= 0) return '이번 달 합류';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `근속 ${m}개월`;
  return m === 0 ? `근속 ${y}년` : `근속 ${y}년 ${m}개월`;
}

export default function SmartCardPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = params?.employeeId ?? '';

  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    // QR 대체: 현재 명함 URL 텍스트 표기
    if (typeof window !== 'undefined') setPageUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/card/${encodeURIComponent(employeeId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '명함을 불러오지 못했습니다.');
        if (!cancelled) setData(json as CardData);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : '명함을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [employeeId]);

  const roleKo = data ? (ROLES_KO[data.role as UserRole] ?? data.role) : '';

  return (
    <main className="min-h-screen bg-[#0a0c10] text-[#cdd2da] break-keep">
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 py-10">

        {/* ===== 회사 브랜드 ===== */}
        <header className="text-center">
          <p className="text-sm font-semibold tracking-widest text-indigo-400">자리 공인중개사</p>
          <p className="mt-1 text-xs text-zinc-500">투명함이 만드는 압도적 성과</p>
        </header>

        {loading && (
          <section className="animate-pulse rounded-3xl border border-[#1f2430] bg-[#11141a] p-6" aria-label="로딩 중">
            <div className="mx-auto h-6 w-32 rounded bg-[#1f2430]" />
            <div className="mx-auto mt-3 h-4 w-24 rounded bg-[#1f2430]" />
            <div className="mt-6 h-16 rounded-xl bg-[#1f2430]" />
            <div className="mt-3 h-10 rounded-xl bg-[#1f2430]" />
          </section>
        )}

        {error && !loading && (
          <section className="rounded-3xl border border-[#1f2430] bg-[#11141a] p-8 text-center">
            <p className="text-base font-semibold text-white">명함을 찾을 수 없습니다</p>
            <p className="mt-2 text-xs text-zinc-500">{error}</p>
            <Link
              href="/trust"
              className="mt-5 inline-block rounded-lg border border-[#1f2430] px-4 py-2 text-sm text-zinc-300 hover:bg-[#1f2430]"
            >자리 인증매물 보러가기</Link>
          </section>
        )}

        {data && !loading && !error && (
          <>
            {/* ===== 명함 카드 ===== */}
            <section className="rounded-3xl border border-[#1f2430] bg-[#11141a] p-6">
              {/* 이름 + 직급 + 근속 */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">
                  {data.name} <span className="text-base font-semibold text-indigo-300">{roleKo}</span>
                </h1>
                <p className="mt-1.5 text-xs text-zinc-500 tabular-nums">
                  {tenureLabel(data.joinedAt)} · 사번 {data.employeeId.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* 실적 뱃지 — 시스템이 보증하는 숫자 */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[#1f2430] bg-[#0a0c10] px-3 py-3 text-center">
                  <p className="text-[11px] text-zinc-500">누적 계약</p>
                  <p className="mt-1 text-xl font-bold text-emerald-400 tabular-nums">{data.stats.totalContracts}건</p>
                </div>
                <div className="rounded-xl border border-[#1f2430] bg-[#0a0c10] px-3 py-3 text-center">
                  <p className="text-[11px] text-zinc-500">인증매물</p>
                  <p className="mt-1 text-xl font-bold text-emerald-400 tabular-nums">{data.stats.verifiedProperties}건</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-zinc-500 tabular-nums">
                이번 달 계약 {data.stats.thisMonthContracts}건 진행
              </p>

              {/* CTA */}
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/trust"
                  className="block rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                >인증매물 보러가기 →</Link>
                <a
                  href="tel:010-0000-0000"
                  className="block rounded-xl border border-[#1f2430] px-4 py-3 text-center text-sm font-semibold text-zinc-200 hover:bg-[#1f2430]"
                >상담 예약 문의</a>
              </div>
            </section>

            {/* ===== QR 대체: 명함 URL ===== */}
            <section className="rounded-2xl border border-[#1f2430] bg-[#11141a] px-4 py-3">
              <p className="text-[11px] text-zinc-500">이 명함의 주소 (QR 대신 공유하세요)</p>
              <p className="mt-1 break-all font-mono text-[11px] text-zinc-300">
                {pageUrl || `/card/${data.employeeId}`}
              </p>
            </section>

            {/* ===== 발급 보증 문구 ===== */}
            <footer className="text-center">
              <p className="text-[11px] text-zinc-600">
                이 명함은 위·변조 불가 시스템 발급 — 모든 실적은 자리 ERP 원장에서 실시간 집계됩니다
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
