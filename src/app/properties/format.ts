/*---
id: format.ts
milestone: M4
why: 매물 가격·면적 표기 공통 헬퍼 — 목록/상세 페이지가 동일 표기 사용
backlinks: [[[Pages]]]
---*/

/**
 * @file src/app/properties/format.ts
 * @description 매물 원장 공통 포맷 유틸 — 한국어 가격 축약("12억 3,000만"), 월세 "보증금/월세", ㎡/평 병기
 * @purpose 목록(page.tsx)·상세([id]/page.tsx) 간 표기 불일치 방지 (SSOT)
 */

/** 원 단위 금액 → "12억 3,000만" 한국어 축약 표기 */
export function formatKoreanPrice(won: number): string {
  if (won < 10000) return `${won.toLocaleString('ko-KR')}원`;
  const eok = Math.floor(won / 100_000_000);
  const man = Math.floor((won % 100_000_000) / 10_000);
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`);
  return parts.join(' ');
}

/** 거래유형별 가격 라벨: 매매/전세 단일가, 월세는 "보증금/월세" */
export function priceLabel(p: {
  dealType: string;
  price: number;
  monthlyRent: number | null;
}): string {
  if (p.dealType === '월세') {
    return `${formatKoreanPrice(p.price)} / ${formatKoreanPrice(p.monthlyRent ?? 0)}`;
  }
  return formatKoreanPrice(p.price);
}

/** 면적 ㎡/평 병기 */
export function areaLabel(areaM2: number | null): string {
  if (!areaM2) return '면적 미입력';
  const pyeong = areaM2 / 3.305785;
  return `${areaM2.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}㎡ (${pyeong.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}평)`;
}
