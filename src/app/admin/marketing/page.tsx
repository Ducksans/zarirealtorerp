/*---
id: page.tsx
milestone: M12
why: 마케팅 콘텐츠 생성기 — 실매물 데이터 기반 결정론적 템플릿 (허위매물 없는 정직한 홍보)
backlinks: [[[Pages]]]
---*/

/**
 * @file src/app/admin/marketing/page.tsx
 * @description M12 마케팅 콘텐츠 생성기 — 매물 선택 시 채널 4종(블로그/인스타/SMS/전단지) 콘텐츠를
 *              실매물 데이터로 즉시 생성. LLM 아님 — 결정론적 템플릿 엔진이라 거짓말이 불가능하다.
 * @dependencies /api/properties (GET, status=ACTIVE), @/app/properties/format (가격·면적 표기 SSOT)
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { areaLabel, priceLabel } from '../../properties/format';

// ──────────────────────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────────────────────

type AgentInfo = { name: string; role: string; employeeId: string };

type PropertyRow = {
  id: string;
  address: string;
  propertyType: string;
  dealType: string;
  price: number;
  monthlyRent: number | null;
  areaM2: number | null;
  description: string | null;
  status: 'ACTIVE' | 'CONTRACTED' | 'HIDDEN';
  ownerName: string | null;
  ownerVerified: boolean;
  fieldVerifiedAt: string | null;
  agent: AgentInfo;
  createdAt: string;
};

const TONES = ['정중한', '친근한', '프리미엄'] as const;
type Tone = (typeof TONES)[number];

const TABS = [
  ['blog', '네이버 블로그'],
  ['insta', '인스타그램'],
  ['sms', '고객 문자(SMS)'],
  ['flyer', '전단지 문구'],
] as const;
type TabKey = (typeof TABS)[number][0];

/** 템플릿 엔진 입력 컨텍스트 — 전부 실매물 데이터에서만 파생 */
type TemplateCtx = {
  p: PropertyRow;
  tone: Tone;
  /** 마스킹 옵션 반영된 표기용 주소 */
  addr: string;
  /** 주소에서 추출한 동/구 단위 지역명 (예: "역삼동") */
  dong: string;
  /** 한국어 축약 가격 (예: "12억 3,000만") */
  price: string;
  /** ㎡/평 병기 면적 */
  area: string;
  verified: boolean;
};

// ──────────────────────────────────────────────────────────────
// 순수 유틸 — 결정론적, 입력이 같으면 출력이 같다
// ──────────────────────────────────────────────────────────────

/** SMS 바이트 계산 (EUC-KR 과금 기준: 한글 2바이트, ASCII 1바이트) */
function smsBytes(s: string): number {
  let n = 0;
  for (const ch of s) {
    n += ch.charCodeAt(0) > 0x7f ? 2 : 1;
    if (ch.length > 1) n += 2; // 서로게이트 페어(이모지 등)는 4바이트로 집계
  }
  return n;
}

/** 주소 일부 마스킹: 숫자 포함 토큰(번지·동호수)의 첫 숫자만 남기고 '*' 처리 */
function maskAddress(addr: string): string {
  return addr
    .split(' ')
    .map((tok) => {
      if (!/\d/.test(tok)) return tok;
      // 행정구역 토큰(역삼1동 등)은 그대로 둔다
      if (/(시|구|군|동|읍|면|로|길|가)$/.test(tok)) return tok;
      let first = true;
      return tok.replace(/\d/g, (d) => {
        if (first) {
          first = false;
          return d;
        }
        return '*';
      });
    })
    .join(' ');
}

/** 주소에서 가장 좁은 행정구역 토큰 추출 (동 > 구 > 시 순) */
function extractDong(addr: string): string {
  const tokens = addr.split(' ');
  const dong = tokens.filter((t) => /(동|읍|면|가)$/.test(t)).pop();
  const gu = tokens.filter((t) => /(구|군)$/.test(t)).pop();
  const si = tokens.filter((t) => /시$/.test(t)).pop();
  return dong ?? gu ?? si ?? tokens[0] ?? '';
}

/** 해시태그용 문자열 정제 (공백·특수문자 제거) */
const tag = (s: string) => `#${s.replace(/[^가-힣a-zA-Z0-9]/g, '')}`;

// ──────────────────────────────────────────────────────────────
// 채널별 템플릿 엔진 — 톤 3종 분기
// ──────────────────────────────────────────────────────────────

function genBlog(ctx: TemplateCtx): { titles: string[]; body: string; hashtags: string } {
  const { p, tone, addr, dong, price, area, verified } = ctx;
  const deal = p.dealType;
  const type = p.propertyType;

  const titles: Record<Tone, string[]> = {
    정중한: [
      `${dong} ${type} ${deal} ${price} — 직접 확인하고 정직하게 안내드립니다`,
      `[${deal}] ${dong} ${type}, ${area} 매물 정보 상세 안내`,
      `${dong}에서 ${type} ${deal} 찾으신다면 — ${price}, 확인된 정보만 올립니다`,
    ],
    친근한: [
      `${dong} ${type} ${price}에 나왔어요! 이런 ${deal} 매물 흔치 않아요`,
      `${dong} 살 집 찾는 분 주목 — ${type} ${deal} ${price} 솔직 리뷰`,
      `요즘 ${dong} ${deal} 시세에 이 가격? ${type} ${area} 직접 보고 왔습니다`,
    ],
    프리미엄: [
      `${dong} ${type} — ${price}, 기준이 다른 ${deal} 프리미엄 매물`,
      `엄선된 단 하나의 선택, ${dong} ${type} ${deal} ${price}`,
      `${dong}의 가치를 담은 ${type}, ${area} 프라이빗 안내`,
    ],
  };

  const greeting: Record<Tone, string> = {
    정중한: `안녕하세요, 자리 공인중개사입니다.\n오늘은 ${dong}의 ${type} ${deal} 매물을 정확한 정보 그대로 안내드립니다.`,
    친근한: `안녕하세요! ${dong} 지킴이 자리 공인중개사예요 🙂\n오늘 소개할 매물, 정말 자신 있게 보여드려요.`,
    프리미엄: `자리 공인중개사가 엄선한 ${dong} 프리미엄 매물을 소개합니다.\n검증된 정보만을, 있는 그대로 전합니다.`,
  };

  const closing: Record<Tone, string> = {
    정중한: '방문 상담은 언제든 환영합니다. 과장 없이, 본 것만 말씀드리겠습니다.',
    친근한: '궁금한 점은 편하게 댓글이나 전화 주세요! 직접 같이 보러 가요 🏃',
    프리미엄: '프라이빗 안내를 원하시면 사전 예약을 부탁드립니다. 단 한 분을 위한 상담을 준비하겠습니다.',
  };

  const lines = [
    greeting[tone],
    '',
    `■ 위치: ${addr}`,
    `■ 유형: ${type} · ${deal}${deal === '월세' ? ' (보증금/월세)' : ''}`,
    `■ 가격: ${price}`,
    `■ 면적: ${area}`,
  ];
  if (p.description) lines.push(`■ 특징: ${p.description}`);
  lines.push('');
  if (verified) {
    lines.push('✓ 의뢰인 본인인증 완료 매물 — 소유주 확인을 마친, 허위매물이 아닌 실매물입니다.');
    if (p.fieldVerifiedAt) lines.push('✓ 현장 인증 완료 — 담당자가 현장을 직접 방문해 확인했습니다.');
    lines.push('');
  }
  lines.push(`담당: ${p.agent?.name ?? '미지정'} (자리 공인중개사)`);
  lines.push('');
  lines.push(closing[tone]);

  const hashtags = [
    tag(`${dong}부동산`),
    tag(`${dong}${type}`),
    tag(`${type}${deal}`),
    tag(deal),
    verified ? tag('인증매물') : tag('실매물'),
    tag('허위매물없는중개'),
    tag('자리공인중개사'),
  ].join(' ');

  return { titles: titles[tone], body: lines.join('\n'), hashtags };
}

function genInsta(ctx: TemplateCtx): { caption: string; hashtags: string } {
  const { p, tone, dong, price, area, verified } = ctx;
  const type = p.propertyType;
  const deal = p.dealType;

  const captions: Record<Tone, string> = {
    정중한: `🏠 ${dong} ${type} ${deal}\n💰 ${price}\n📐 ${area}\n${verified ? '✅ 의뢰인 본인인증 완료 매물\n' : ''}\n정확한 정보만 올립니다. 문의는 DM 또는 프로필 링크로 부탁드립니다 🙏`,
    친근한: `📢 ${dong}에 이런 ${type}이 나왔다고?!\n💸 ${deal} ${price}\n📏 ${area}\n${verified ? '✅ 본인인증 완료! 허위매물 아니에요\n' : ''}\n먼저 보는 사람이 임자 😎 DM 주세요!`,
    프리미엄: `✨ ${dong} ${type} — Private Listing\n◾ ${deal} ${price}\n◾ ${area}\n${verified ? '◾ 의뢰인 본인인증 완료 ✓\n' : ''}\n조용히, 확실하게. 프라이빗 상담은 DM 🥂`,
  };

  const pool = [
    `${dong}부동산`,
    `${dong}${type}`,
    `${dong}${deal}`,
    type,
    deal,
    `${type}${deal}`,
    verified ? '인증매물' : '실매물',
    '허위매물없음',
    '부동산',
    '부동산스타그램',
    '내집마련',
    '집스타그램',
    '이사준비',
    '공인중개사',
    '자리공인중개사',
    '매물추천',
    '부동산투자',
  ];
  const hashtags = Array.from(new Set(pool.map(tag).filter((t) => t.length > 1)))
    .slice(0, 15)
    .join(' ');

  return { caption: captions[tone], hashtags };
}

function genSms(ctx: TemplateCtx): { short: string; long: string } {
  const { p, tone, addr, dong, price, area, verified } = ctx;
  const type = p.propertyType;
  const deal = p.dealType;
  const agent = p.agent?.name ?? '담당자';
  const optOut = '무료거부 0808880000';

  const shortBody: Record<Tone, string> = {
    정중한: `(광고)[자리공인] ${dong} ${type} ${deal} ${price} 나왔습니다. ${optOut}`,
    친근한: `(광고)[자리공인] ${dong} ${type} ${deal} ${price}! 먼저 연락주세요. ${optOut}`,
    프리미엄: `(광고)[자리공인] ${dong} ${type} ${deal} ${price} 프리미엄 매물. ${optOut}`,
  };

  const longIntro: Record<Tone, string> = {
    정중한: `안녕하세요, 자리 공인중개사 ${agent}입니다.\n조건에 맞는 매물이 나와 안내드립니다.`,
    친근한: `안녕하세요! 자리 공인중개사 ${agent}이에요.\n딱 맞는 매물이 나와서 바로 연락드려요 :)`,
    프리미엄: `자리 공인중개사 ${agent}입니다.\n고객님께 먼저 소개드리는 프리미엄 매물입니다.`,
  };

  const long = [
    `(광고)[자리공인중개사]`,
    longIntro[tone],
    '',
    `· 위치: ${addr}`,
    `· ${type} ${deal} ${price}`,
    `· ${area}`,
    verified ? '· 의뢰인 본인인증 완료 매물' : '',
    '',
    `상담: ${agent} (자리 공인중개사)`,
    optOut,
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n');

  return { short: shortBody[tone], long };
}

function genFlyer(ctx: TemplateCtx): { headline: string; points: string[] } {
  const { p, tone, dong, price, area, verified } = ctx;
  const type = p.propertyType;
  const deal = p.dealType;

  const headlines: Record<Tone, string> = {
    정중한: `${dong} ${type} ${deal} — 확인된 정보만 정직하게 안내합니다`,
    친근한: `${dong}에서 집 찾으세요? 이 ${type}, 놓치면 아까워요!`,
    프리미엄: `${dong}의 품격, ${type} ${deal} — 기준이 다른 선택`,
  };

  const points = [
    `${deal} ${price}${deal === '월세' ? ' (보증금/월세)' : ''}`,
    `${type} · ${area}`,
    verified
      ? '의뢰인 본인인증 완료 — 허위매물이 아닌 실매물'
      : `담당 ${p.agent?.name ?? '중개사'} 직접 확인 매물`,
  ];

  return { headline: headlines[tone], points };
}

// ──────────────────────────────────────────────────────────────
// UI 조각
// ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard 권한 거부 시 조용히 무시 (http 환경 등)
    }
  };
  return (
    <button
      onClick={onCopy}
      className={`shrink-0 px-2.5 py-1 rounded-md text-xs transition-colors border ${
        copied
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-[#11141a] border-[#1f2430] text-zinc-400 hover:text-white hover:border-indigo-500/50'
      }`}
    >
      {copied ? '✓ 복사됨' : '📋 복사'}
    </button>
  );
}

/** 출력 1블록 — 라벨 + 본문(pre-wrap) + 복사 + 글자수(/바이트) */
function OutputBlock({
  label,
  text,
  smsLimit,
}: {
  label: string;
  text: string;
  smsLimit?: number;
}) {
  const bytes = smsLimit ? smsBytes(text) : 0;
  const over = smsLimit ? bytes > smsLimit : false;
  return (
    <div className="bg-[#0a0c10] border border-[#1f2430] rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-zinc-400">{label}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] tabular-nums ${over ? 'text-rose-400' : 'text-zinc-600'}`}>
            {text.length}자
            {smsLimit ? ` · ${bytes}/${smsLimit}바이트${over ? ' 초과' : ''}` : ''}
          </span>
          <CopyButton text={text} />
        </div>
      </div>
      <p className="text-sm text-[#cdd2da] whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 페이지
// ──────────────────────────────────────────────────────────────

export default function MarketingGeneratorPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>('정중한');
  const [tab, setTab] = useState<TabKey>('blog');
  const [maskAddr, setMaskAddr] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ status: 'ACTIVE', limit: '200' });
      if (search.trim()) qs.set('search', search.trim());
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
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProperties, 300);
    return () => clearTimeout(t);
  }, [fetchProperties]);

  const selected = useMemo(
    () => properties.find((p) => p.id === selectedId) ?? null,
    [properties, selectedId]
  );

  // 결정론적 생성 — 선택 매물 + 톤 + 마스킹 옵션이 같으면 결과도 항상 같다
  const generated = useMemo(() => {
    if (!selected) return null;
    const ctx: TemplateCtx = {
      p: selected,
      tone,
      addr: maskAddr ? maskAddress(selected.address) : selected.address,
      dong: extractDong(selected.address),
      price: priceLabel(selected),
      area: areaLabel(selected.areaM2),
      verified: selected.ownerVerified,
    };
    return {
      blog: genBlog(ctx),
      insta: genInsta(ctx),
      sms: genSms(ctx),
      flyer: genFlyer(ctx),
    };
  }, [selected, tone, maskAddr]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <header>
          <h1 className="text-2xl font-bold text-white tracking-tight">마케팅 콘텐츠 생성기</h1>
          <p className="text-sm text-zinc-500 mt-1">
            매물을 선택하면 채널별 홍보 문구가 실매물 데이터로 즉시 생성됩니다 — 템플릿 엔진이라
            거짓말을 못 합니다.
          </p>
        </header>

        {/* 답 먼저: 선택 매물 요약 */}
        {selected ? (
          <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1">선택된 매물</p>
                <h2 className="text-lg font-bold text-white leading-snug">{selected.address}</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {selected.propertyType} · {selected.dealType} ·{' '}
                  <span className="text-white font-semibold tabular-nums">
                    {priceLabel(selected)}
                  </span>{' '}
                  · {areaLabel(selected.areaM2)} · 담당 {selected.agent?.name}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {selected.ownerVerified && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs">
                    의뢰인 인증 ✓
                  </span>
                )}
                {selected.fieldVerifiedAt && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs">
                    현장 인증 ✓
                  </span>
                )}
                {!selected.ownerVerified && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs">
                    미인증
                  </span>
                )}
              </div>
            </div>
            {!selected.ownerVerified && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400">
                ⚠ 인증 미완료 매물 — 인증 후 홍보를 권장합니다.{' '}
                <Link
                  href={`/properties/${selected.id}`}
                  className="underline hover:text-amber-300"
                >
                  /properties/{selected.id}에서 처리
                </Link>
              </div>
            )}
          </section>
        ) : (
          <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5 text-sm text-zinc-500">
            아래 목록에서 매물을 선택하면 채널별 홍보 콘텐츠가 즉시 생성됩니다.
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌: 매물 선택 */}
          <section className="lg:col-span-1 space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="주소 / 의뢰인명 검색 (활성 매물)"
              className="w-full bg-[#11141a] border border-[#1f2430] rounded-lg px-4 py-2 text-sm text-[#cdd2da] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {loading ? (
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-10 text-center text-zinc-500 text-sm">
                활성 매물을 불러오는 중...
              </div>
            ) : error ? (
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-10 text-center">
                <p className="text-rose-400 text-sm mb-3">{error}</p>
                <button
                  onClick={fetchProperties}
                  className="text-sm text-indigo-400 hover:text-indigo-300 underline"
                >
                  다시 시도
                </button>
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-10 text-center text-zinc-500 text-sm">
                조건에 맞는 활성 매물이 없습니다.{' '}
                <Link
                  href="/properties/new"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  신규 매물 등록
                </Link>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {properties.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full text-left bg-[#11141a] border rounded-xl p-4 transition-colors ${
                        p.id === selectedId
                          ? 'border-indigo-500'
                          : 'border-[#1f2430] hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-white leading-snug">{p.address}</p>
                        {p.ownerVerified ? (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px]">
                            인증 ✓
                          </span>
                        ) : (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[11px]">
                            미인증
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {p.propertyType} · {p.dealType} ·{' '}
                        <span className="text-zinc-300 tabular-nums">{priceLabel(p)}</span>
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 우: 채널 탭 + 생성 결과 */}
          <section className="lg:col-span-2 space-y-4">
            {/* 톤 + 옵션 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      tone === t
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-[#11141a] border border-[#1f2430] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={maskAddr}
                  onChange={(e) => setMaskAddr(e.target.checked)}
                  className="accent-indigo-600"
                />
                주소 일부 마스킹 (번지·호수 가림)
              </label>
            </div>

            {/* 채널 탭 */}
            <div className="flex gap-1 border-b border-[#1f2430]">
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                    tab === key
                      ? 'border-indigo-500 text-white font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 생성 결과 */}
            {!generated ? (
              <div className="bg-[#11141a] border border-[#1f2430] rounded-xl p-16 text-center text-zinc-500 text-sm">
                매물을 선택하면 이 자리에 콘텐츠가 생성됩니다.
              </div>
            ) : (
              <div className="space-y-3">
                {tab === 'blog' && (
                  <>
                    {generated.blog.titles.map((t, i) => (
                      <OutputBlock key={i} label={`제목 ${i + 1}안`} text={t} />
                    ))}
                    <OutputBlock label="본문" text={generated.blog.body} />
                    <OutputBlock label="해시태그" text={generated.blog.hashtags} />
                  </>
                )}
                {tab === 'insta' && (
                  <>
                    <OutputBlock label="캡션" text={generated.insta.caption} />
                    <OutputBlock label="해시태그 15개" text={generated.insta.hashtags} />
                  </>
                )}
                {tab === 'sms' && (
                  <>
                    <OutputBlock label="단문 (90바이트)" text={generated.sms.short} smsLimit={90} />
                    <OutputBlock label="장문 (300바이트)" text={generated.sms.long} smsLimit={300} />
                    <p className="text-[11px] text-zinc-600">
                      바이트는 EUC-KR 과금 기준(한글 2바이트)입니다. (광고) 표기와 무료수신거부
                      번호는 정보통신망법 필수 문구입니다.
                    </p>
                  </>
                )}
                {tab === 'flyer' && (
                  <>
                    <OutputBlock label="헤드라인" text={generated.flyer.headline} />
                    {generated.flyer.points.map((pt, i) => (
                      <OutputBlock key={i} label={`핵심 포인트 ${i + 1}`} text={pt} />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TODO(M12+): Canva 연동 자리 — 생성된 전단지 문구를 Canva 템플릿에 자동 주입해 시안 이미지 출력 */}
            {/* TODO(M12+): Notion 연동 자리 — 채널별 생성 콘텐츠를 매물별 Notion 아카이브 페이지로 저장 */}
          </section>
        </div>
      </div>
    </div>
  );
}
