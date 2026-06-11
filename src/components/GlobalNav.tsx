/*---
id: GlobalNav
milestone: M2
why: 전 페이지 공통 내비게이션 — URL 타이핑 없이 모든 모듈 접근 (2026-06-11 대표 지시) + 세션 사용자 표시
backlinks: [[Launch_Battle_Plan_D30.md]]
---*/

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type MenuGroup = { label: string; items: { href: string; label: string; desc?: string }[] };

const MENU: MenuGroup[] = [
  {
    label: '경영 관리',
    items: [
      { href: '/', label: '경영 대시보드', desc: '전사 매출·현황' },
      { href: '/admin/settlements', label: '통합 정산', desc: '100원 룰 월 정산' },
      { href: '/admin/transparency', label: '100원 분해 추적기', desc: '투명성 엔진' },
      { href: '/admin/contracts', label: '계약 원장', desc: '계약·전자결재' },
      { href: '/admin/archive', label: '문서 보관소', desc: '서류 완비율' },
    ],
  },
  {
    label: '영업 현장',
    items: [
      { href: '/home', label: '모바일 홈', desc: '내가 받을 돈 + AI 보좌관' },
      { href: '/properties', label: '매물 원장', desc: '매물 등록·인증' },
      { href: '/customers', label: '고객 원장', desc: '고객 DB' },
      { href: '/schedule', label: '일정', desc: '임장·계약 스케줄' },
    ],
  },
  {
    label: '조직·채용',
    items: [
      { href: '/hr', label: '인사 관리', desc: '직원·조직도' },
      { href: '/admin/ats', label: '채용 파이프라인', desc: 'ATS 칸반' },
      { href: '/hr/approvals', label: '결재함', desc: '순차 결재' },
      { href: '/onboarding', label: '입사지원', desc: '지원 폼' },
      { href: '/admin/roles', label: '권한 관리', desc: 'RBAC' },
    ],
  },
  {
    label: '쇼룸·고객',
    items: [
      { href: '/trust', label: '인증매물 (Trust)', desc: '고객용 신뢰 타임라인' },
      { href: '/showcase', label: '입사설명회 모드', desc: '대형화면 7막 데모' },
      { href: '/rulebook', label: '운영 규정집', desc: '보상·진급 원문' },
      { href: '/notice', label: '공지사항' },
    ],
  },
  {
    label: '시스템',
    items: [
      { href: '/dev', label: '관제탑 (Neural Sync)', desc: 'SSOT 문서·그래프' },
    ],
  },
];

// 상단 바에 항상 노출할 핵심 메뉴
const PRIMARY = [
  { href: '/', label: '대시보드' },
  { href: '/admin/settlements', label: '정산' },
  { href: '/admin/contracts', label: '계약' },
  { href: '/properties', label: '매물' },
  { href: '/customers', label: '고객' },
  { href: '/home', label: '모바일 홈' },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  // 세션 사용자 표시 (M2 인증 합류 전에는 404/401 → 조용히 비로그인 표시)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setUser(d?.user ?? null))
      .catch(() => setUser(null));
  }, [pathname]);

  // 라우트 이동 시 드로어 닫기
  useEffect(() => { setOpen(false); }, [pathname]);

  // 쇼케이스는 풀스크린 자체 제어
  if (pathname?.startsWith('/showcase')) return null;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <>
      <header className="h-14 min-h-[3.5rem] bg-[#0a0c10]/90 backdrop-blur-xl border-b border-white/5 flex items-center px-4 lg:px-6 gap-4 z-40 sticky top-0" style={{ wordBreak: 'keep-all' }}>
        {/* 햄버거 */}
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-zinc-300 transition-colors"
          aria-label="전체 메뉴"
        >
          <span className="block w-5 space-y-1">
            <span className="block h-0.5 bg-current rounded" />
            <span className="block h-0.5 bg-current rounded" />
            <span className="block h-0.5 bg-current rounded" />
          </span>
        </button>

        <Link href="/" className="shrink-0 flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold text-white tracking-tight">자리 ERP</span>
          <span className="hidden sm:inline text-[10px] font-semibold tracking-[0.2em] text-indigo-400/70 uppercase">Transparency</span>
        </Link>

        {/* 핵심 메뉴 (데스크톱) */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {PRIMARY.map(m => (
            <Link
              key={m.href}
              href={m.href}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                isActive(m.href) ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m.label}
            </Link>
          ))}
        </nav>

        {/* 우측: 사용자 */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-[13px] text-zinc-300"><b className="text-white">{user.name}</b>님</span>
              <button
                onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); window.location.href = '/login'; }}
                className="text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="px-4 py-1.5 rounded-lg text-[13px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* 전체 메뉴 드로어 */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[320px] max-w-[85vw] bg-[#0c0e13] border-r border-[#1f2430] overflow-y-auto p-5" style={{ wordBreak: 'keep-all' }}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[15px] font-bold text-white">전체 메뉴</span>
              <button onClick={() => setOpen(false)} className="p-2 text-zinc-400 hover:text-white" aria-label="닫기">✕</button>
            </div>
            {MENU.map(group => (
              <div key={group.label} className="mb-6">
                <p className="text-[11px] font-semibold tracking-[0.15em] text-zinc-500 uppercase mb-2 px-2">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.items.map(item => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-3 py-2 rounded-lg transition-colors ${
                          isActive(item.href) ? 'bg-indigo-500/15 text-white' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="text-[14px] font-medium">{item.label}</span>
                        {item.desc && <span className="block text-[11px] text-zinc-500 mt-0.5">{item.desc}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-[11px] text-zinc-600 px-2 pt-2 border-t border-[#1f2430]">
              자리 공인중개사 — 투명함이 만드는 압도적 성과
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
