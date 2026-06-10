/*---
id: showcase_page
milestone: M16
why: 입사설명회 대형 화면 자동 데모 모드 — 발표자가 키보드만으로 제어하는 풀스크린 7-슬라이드 프레젠테이션. "투명하고 스마트한 초거대 중개기업"의 메시지를 100원 룰 → 라이브 정산 데이터 → 성장 로드맵 순서로 증명한다.
backlinks: [[admin_transparency_page]], [[home_page]], [[SSOT_Commission_100won_Rule.md]]
---*/

'use client';

import { useState, useEffect, useCallback } from 'react';

const TOTAL_SLIDES = 7;

/* ── 유틸 ───────────────────────────────────────────── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** rAF 기반 ease-out 카운트업. active가 false면 0으로 리셋, delay(ms) 후 시작 */
function useCountUp(target: number, active: boolean, duration = 1400, delay = 0): number {
  const [value, setValue] = useState(0);
  const [prevActive, setPrevActive] = useState(active);

  // active 전환 시 렌더 중 상태 보정 (effect 내 동기 setState 회피)
  if (prevActive !== active) {
    setPrevActive(active);
    if (!active) setValue(0);
  }

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setValue(target * easeOutCubic(p));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, active, duration, delay]);

  return value;
}

/** 슬라이드 active 후 단계적 등장을 위한 phase 카운터 */
function usePhases(active: boolean, delays: number[]): number {
  const [phase, setPhase] = useState(0);
  const [prevActive, setPrevActive] = useState(active);

  if (prevActive !== active) {
    setPrevActive(active);
    if (!active) setPhase(0);
  }

  useEffect(() => {
    if (!active) return;
    const timers = delays.map((ms, i) => window.setTimeout(() => setPhase(i + 1), ms));
    return () => timers.forEach(t => window.clearTimeout(t));
    // delays는 각 슬라이드에서 상수 배열로만 전달됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return phase;
}

function formatWon(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/* ── 슬라이드 래퍼 ──────────────────────────────────── */

function Slide({ active, isPast, children }: { active: boolean; isPast: boolean; children: React.ReactNode }) {
  return (
    <section
      aria-hidden={!active}
      className={`absolute inset-0 flex flex-col items-center justify-center px-10 transition-all duration-700 ease-out ${
        active
          ? 'opacity-100 translate-x-0'
          : isPast
            ? 'opacity-0 -translate-x-12 pointer-events-none'
            : 'opacity-0 translate-x-12 pointer-events-none'
      }`}
    >
      {children}
    </section>
  );
}

/* ── 1. 오프닝 ──────────────────────────────────────── */

const OPENING_DELAYS = [500, 2200, 3900];

function SlideOpening({ active }: { active: boolean }) {
  const phase = usePhases(active, OPENING_DELAYS);
  const line = (visible: boolean, extra = '') =>
    `transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${extra}`;

  return (
    <div className="max-w-5xl text-center break-keep space-y-12">
      <h1 className={line(phase >= 1, 'text-6xl md:text-7xl font-bold leading-tight text-white')}>
        부동산 중개업은
        <br />
        투명해질 수 있는가.
      </h1>
      <p className={line(phase >= 2, 'text-3xl md:text-4xl text-neutral-300 font-light')}>
        우리는 말 대신 시스템으로 증명합니다.
      </p>
      <p className={line(phase >= 3, 'text-2xl tracking-[0.3em] text-emerald-400 font-semibold pt-8')}>
        자리 공인중개사
      </p>
    </div>
  );
}

/* ── 2. 100원 룰 ────────────────────────────────────── */

const SHARES = [
  { label: '직원', pct: 55, color: 'bg-emerald-500', text: 'text-emerald-400' },
  { label: '팀장', pct: 10, color: 'bg-indigo-500', text: 'text-indigo-300' },
  { label: '본부장', pct: 5, color: 'bg-indigo-600', text: 'text-indigo-300' },
  { label: '지점장', pct: 2.5, color: 'bg-indigo-700', text: 'text-indigo-300' },
  { label: '회사', pct: 27.5, color: 'bg-neutral-600', text: 'text-neutral-400' },
] as const;

function ShareRow({ share, active, index }: { share: (typeof SHARES)[number]; active: boolean; index: number }) {
  const delay = 400 + index * 550;
  const v = useCountUp(share.pct, active, 1100, delay);
  const shown = active;
  return (
    <div
      className="flex items-center gap-6 transition-opacity duration-700"
      style={{ opacity: shown ? 1 : 0, transitionDelay: `${delay}ms` }}
    >
      <span className="w-28 text-right text-2xl text-neutral-300">{share.label}</span>
      <span className={`w-36 text-4xl font-bold tabular-nums ${share.text}`}>
        {share.pct % 1 === 0 ? Math.round(v) : v.toFixed(1)}원
      </span>
      <div className="flex-1 h-10 rounded bg-neutral-900 overflow-hidden">
        <div
          className={`h-full ${share.color} transition-[width] duration-1000 ease-out`}
          style={{ width: shown ? `${share.pct}%` : '0%', transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function SlideHundredWon({ active }: { active: boolean }) {
  return (
    <div className="w-full max-w-5xl break-keep">
      <h2 className="text-6xl font-bold text-white text-center mb-16">중개보수 100원의 여행</h2>
      <div className="space-y-5">
        {SHARES.map((s, i) => (
          <ShareRow key={s.label} share={s} active={active} index={i} />
        ))}
      </div>
      <p className="mt-16 text-center text-2xl text-neutral-400">
        오버라이딩은 <span className="text-white font-semibold">회사 몫</span>에서 나갑니다.
        당신의 몫은 <span className="text-emerald-400 font-semibold">1원도 줄지 않습니다.</span>
      </p>
    </div>
  );
}

/* ── 3. 라이브 정산 데이터 ──────────────────────────── */

type LiveData = { totalGross: number; totalPay: number; count: number };

function SlideLive({ active }: { active: boolean }) {
  const [data, setData] = useState<LiveData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard?yearMonth=${currentYearMonth()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: { settlements?: { totalPay?: number }[]; totalGross?: number }) => {
        if (cancelled) return;
        const settlements = Array.isArray(json.settlements) ? json.settlements : [];
        setData({
          totalGross: json.totalGross ?? 0,
          totalPay: settlements.reduce((sum, s) => sum + (s.totalPay ?? 0), 0),
          count: settlements.length,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = active && data !== null;
  const gross = useCountUp(data?.totalGross ?? 0, ready, 1800, 300);
  const pay = useCountUp(data?.totalPay ?? 0, ready, 1800, 700);
  const count = useCountUp(data?.count ?? 0, ready, 1400, 1100);

  return (
    <div className="w-full max-w-6xl text-center break-keep">
      <h2 className="text-6xl font-bold text-white mb-6">지금 이 순간의 진짜 숫자입니다</h2>
      <p className="text-xl text-neutral-500 mb-16">{currentYearMonth()} · 라이브 정산 시스템에서 방금 불러왔습니다</p>
      {failed ? (
        <p className="text-3xl text-neutral-400 font-light leading-relaxed">
          지금은 데이터를 불러올 수 없지만,
          <br />
          입사하시면 매일 아침 이 숫자를 직접 확인하게 됩니다.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-10">
          <div>
            <p className="text-xl text-neutral-500 mb-4">이달 매출 총액</p>
            <p className="text-5xl font-bold text-white tabular-nums">{formatWon(gross)}원</p>
          </div>
          <div>
            <p className="text-xl text-neutral-500 mb-4">지급 총액</p>
            <p className="text-5xl font-bold text-emerald-400 tabular-nums">{formatWon(pay)}원</p>
          </div>
          <div>
            <p className="text-xl text-neutral-500 mb-4">정산 인원</p>
            <p className="text-5xl font-bold text-indigo-300 tabular-nums">{Math.round(count)}명</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 4. 신입의 한 달 ────────────────────────────────── */

function SlideNewbie({ active }: { active: boolean }) {
  const take = useCountUp(3_300_000, active, 1800, 600);
  return (
    <div className="max-w-5xl text-center break-keep">
      <h2 className="text-6xl font-bold text-white mb-6">신입의 한 달</h2>
      <p className="text-2xl text-neutral-400 mb-14">월 600만 원 매출을 올렸다고 가정하면</p>
      <div className="flex items-center justify-center gap-8 text-3xl text-neutral-300 mb-12">
        <span>기본 300만</span>
        <span className="text-neutral-600">+</span>
        <span>지원비 30만</span>
        <span className="text-neutral-600">=</span>
      </div>
      <p className="text-8xl font-bold text-emerald-400 tabular-nums mb-4">{formatWon(take)}원</p>
      <p className="text-2xl text-neutral-500 mb-14">실수령 (매출의 55%)</p>
      <p className="text-2xl text-neutral-300">
        계산식은 공개되어 있고, <span className="text-white font-semibold">시스템이 검증합니다.</span>
      </p>
    </div>
  );
}

/* ── 5. 성장 로드맵 ─────────────────────────────────── */

const ROADMAP = [
  { title: '사원', desc: '매출의 55%를 가져갑니다', accent: 'border-neutral-700' },
  { title: '팀장', desc: '누적 회사입금 3,600만 원 달성 시', accent: 'border-indigo-500' },
  { title: '본부장', desc: '누적 회사입금 7,200만 원 달성 시', accent: 'border-emerald-500' },
] as const;

function SlideRoadmap({ active }: { active: boolean }) {
  return (
    <div className="w-full max-w-6xl text-center break-keep">
      <h2 className="text-6xl font-bold text-white mb-16">성장 로드맵</h2>
      <div className="grid grid-cols-3 gap-8 mb-14">
        {ROADMAP.map((step, i) => (
          <div
            key={step.title}
            className={`rounded-2xl border-2 ${step.accent} bg-neutral-950/60 p-10 transition-all duration-700 ease-out`}
            style={{
              opacity: active ? 1 : 0,
              transform: active ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: `${300 + i * 400}ms`,
            }}
          >
            <p className="text-4xl font-bold text-white mb-5">{step.title}</p>
            <p className="text-xl text-neutral-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-2xl text-neutral-300">
        팀원 1명당 <span className="text-emerald-400 font-semibold">월 +60만 원</span> 오버라이딩
      </p>
    </div>
  );
}

/* ── 6. 투명성 시연 안내 ────────────────────────────── */

function SlideDemo({ active }: { active: boolean }) {
  return (
    <div className="max-w-5xl text-center break-keep">
      <h2 className="text-6xl font-bold text-white mb-16">지금 바로 보여드리겠습니다</h2>
      <div
        className="grid grid-cols-2 gap-10 transition-opacity duration-700"
        style={{ opacity: active ? 1 : 0, transitionDelay: '400ms' }}
      >
        <a
          href="/admin/transparency"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-500/5 p-12 hover:bg-emerald-500/15 transition-colors"
        >
          <p className="text-3xl font-bold text-emerald-400 mb-4">100원 추적기</p>
          <p className="text-xl text-neutral-400">실제 직원의 이번 달 매출이 누구에게 얼마씩 흐르는지</p>
          <p className="mt-6 text-lg text-neutral-600">/admin/transparency</p>
        </a>
        <a
          href="/home"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border-2 border-indigo-500/60 bg-indigo-500/5 p-12 hover:bg-indigo-500/15 transition-colors"
        >
          <p className="text-3xl font-bold text-indigo-300 mb-4">영업사원 모바일 홈</p>
          <p className="text-xl text-neutral-400">폰을 열면 첫 화면 첫 숫자가 &ldquo;이번 달 내가 받을 돈&rdquo;</p>
          <p className="mt-6 text-lg text-neutral-600">/home</p>
        </a>
      </div>
    </div>
  );
}

/* ── 7. 클로징 ──────────────────────────────────────── */

function SlideClosing({ active }: { active: boolean }) {
  const phase = usePhases(active, [400, 1800]);
  return (
    <div className="max-w-5xl text-center break-keep space-y-14">
      <h2
        className={`text-6xl md:text-7xl font-bold leading-tight text-white transition-all duration-1000 ease-out ${
          phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        당신의 다음 계약은
        <br />
        <span className="text-emerald-400">투명한 회사</span>에서.
      </h2>
      <div
        className={`transition-all duration-1000 ease-out ${
          phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <p className="text-2xl text-neutral-400 mb-6">입사 지원은 지금 이 주소에서</p>
        <p className="text-5xl font-bold tracking-wide text-indigo-300">/onboarding</p>
      </div>
    </div>
  );
}

/* ── 페이지 ─────────────────────────────────────────── */

export default function ShowcasePage() {
  const [slide, setSlide] = useState(0);

  const go = useCallback((delta: number) => {
    setSlide(prev => Math.min(TOTAL_SLIDES - 1, Math.max(0, prev + delta)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const slides = [
    SlideOpening,
    SlideHundredWon,
    SlideLive,
    SlideNewbie,
    SlideRoadmap,
    SlideDemo,
    SlideClosing,
  ];

  return (
    <main className="fixed inset-0 z-50 min-h-screen overflow-hidden text-white" style={{ backgroundColor: '#07090d' }}>
      <div className="relative w-full h-full">
        {slides.map((SlideComp, i) => (
          <Slide key={i} active={slide === i} isPast={i < slide}>
            <SlideComp active={slide === i} />
          </Slide>
        ))}
      </div>

      {/* 발표자 안내 (좌하단) */}
      <p className="absolute bottom-6 left-8 text-sm text-neutral-600 select-none">
        ←/→ 또는 스페이스로 이동 · F 전체화면
      </p>

      {/* 슬라이드 번호 (우하단) */}
      <p className="absolute bottom-6 right-8 text-sm text-neutral-500 tabular-nums select-none">
        {slide + 1} / {TOTAL_SLIDES}
      </p>
    </main>
  );
}
