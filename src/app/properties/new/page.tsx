/*---
id: page.tsx
milestone: M4
why: 신규 매물 등록 폼 — 담당자 검색, 거래유형별 가격 입력, 이미지 URL 동적 입력
backlinks: [[[Pages]]]
---*/

/**
 * @file src/app/properties/new/page.tsx
 * @description 신규 매물 등록 — 담당자 디바운스 검색(/api/users), 월세 선택 시 월세 필드, 이미지 URL 0~5 동적, POST 후 상세 이동
 * @dependencies /api/users (GET), /api/properties (POST)
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AgentOption = {
  id: string;
  name: string;
  employeeId: string;
  role?: string;
};

const PROPERTY_TYPES = ['아파트', '오피스텔', '빌라', '상가', '사무실', '토지', '기타'] as const;
const DEAL_TYPES = ['매매', '전세', '월세'] as const;
const MAX_IMAGES = 5;

const inputCls =
  'w-full bg-[#0a0c10] border border-[#1f2430] rounded-lg px-4 py-2 text-sm text-[#cdd2da] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500';
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5';

export default function NewPropertyPage() {
  const router = useRouter();

  // 담당자 검색
  const [agentSearch, setAgentSearch] = useState('');
  const [agentOptions, setAgentOptions] = useState<AgentOption[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(null);
  const [searching, setSearching] = useState(false);

  // 폼 필드
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPES)[number]>('아파트');
  const [dealType, setDealType] = useState<(typeof DEAL_TYPES)[number]>('매매');
  const [price, setPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // 제출 상태
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 담당자 디바운스 검색 (300ms)
  useEffect(() => {
    const q = agentSearch.trim();
    if (!q) {
      setAgentOptions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setAgentOptions(data.users || []);
        } else {
          setAgentOptions([]);
        }
      } catch {
        setAgentOptions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [agentSearch]);

  const priceTitle = dealType === '매매' ? '매매가' : '보증금';

  const updateImageUrl = (idx: number, value: string) => {
    setImageUrls((prev) => prev.map((u, i) => (i === idx ? value : u)));
  };
  const removeImageUrl = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address.trim()) return setError('주소는 필수입니다.');
    if (!selectedAgent) return setError('담당자를 검색해 선택해주세요.');
    const priceNum = Number(price);
    if (!price || !Number.isFinite(priceNum) || priceNum <= 0)
      return setError(`${priceTitle}을(를) 원 단위 양수로 입력해주세요.`);
    if (dealType === '월세') {
      const rentNum = Number(monthlyRent);
      if (!monthlyRent || !Number.isFinite(rentNum) || rentNum <= 0)
        return setError('월세 거래는 월세 금액이 필수입니다.');
    }

    const cleanImages = imageUrls.map((u) => u.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          propertyType,
          dealType,
          price: priceNum,
          ...(dealType === '월세' ? { monthlyRent: Number(monthlyRent) } : {}),
          ...(areaM2 ? { areaM2: Number(areaM2) } : {}),
          ...(ownerName.trim() ? { ownerName: ownerName.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(cleanImages.length > 0 ? { imageUrls: cleanImages } : {}),
          agentId: selectedAgent.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || '매물 등록에 실패했습니다.');
      }
      router.push(`/properties/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물 등록에 실패했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-8 [word-break:keep-all]">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <Link href="/properties" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            ← 매물 원장
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2">신규 매물 등록</h1>
          <p className="text-sm text-zinc-500 mt-1">주소·담당자·가격은 필수입니다.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 담당자 검색 */}
          <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5 space-y-3">
            <label className={labelCls}>
              담당자 <span className="text-rose-400">*</span>
            </label>
            {selectedAgent ? (
              <div className="flex items-center justify-between bg-[#0a0c10] border border-indigo-500/40 rounded-lg px-4 py-2.5">
                <span className="text-sm text-white">
                  {selectedAgent.name}
                  <span className="text-zinc-500 ml-2 text-xs">{selectedAgent.employeeId}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAgent(null);
                    setAgentSearch('');
                  }}
                  className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  변경
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  placeholder="이름 또는 사번으로 검색..."
                  className={inputCls}
                />
                {agentSearch.trim() && (
                  <ul className="border border-[#1f2430] rounded-lg divide-y divide-[#1f2430] overflow-hidden">
                    {searching ? (
                      <li className="px-4 py-2.5 text-xs text-zinc-500">검색 중...</li>
                    ) : agentOptions.length === 0 ? (
                      <li className="px-4 py-2.5 text-xs text-zinc-500">검색 결과가 없습니다.</li>
                    ) : (
                      agentOptions.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedAgent(u)}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#cdd2da] hover:bg-indigo-500/10 hover:text-white transition-colors"
                          >
                            {u.name}
                            <span className="text-zinc-500 ml-2 text-xs">{u.employeeId}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </>
            )}
          </section>

          {/* 기본 정보 */}
          <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5 space-y-4">
            <div>
              <label className={labelCls}>
                주소 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 서울시 강남구 테헤란로 123, 101동 1001호"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>매물 유형</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as (typeof PROPERTY_TYPES)[number])}
                  className={inputCls}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>거래 유형</label>
                <select
                  value={dealType}
                  onChange={(e) => setDealType(e.target.value as (typeof DEAL_TYPES)[number])}
                  className={inputCls}
                >
                  {DEAL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  {priceTitle} (원) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="예: 1230000000"
                  className={inputCls}
                />
              </div>
              {dealType === '월세' && (
                <div>
                  <label className={labelCls}>
                    월세 (원) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder="예: 1500000"
                    className={inputCls}
                  />
                </div>
              )}
              <div>
                <label className={labelCls}>전용면적 (㎡)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={areaM2}
                  onChange={(e) => setAreaM2(e.target.value)}
                  placeholder="예: 84.9"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>의뢰인명</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="예: 김의뢰"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="매물 특이사항, 입주 가능일 등"
                className={`${inputCls} resize-y`}
              />
            </div>
          </section>

          {/* 이미지 URL 0~5 동적 */}
          <section className="bg-[#11141a] border border-[#1f2430] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className={labelCls}>이미지 URL ({imageUrls.length}/{MAX_IMAGES})</label>
              <button
                type="button"
                onClick={() => setImageUrls((prev) => (prev.length < MAX_IMAGES ? [...prev, ''] : prev))}
                disabled={imageUrls.length >= MAX_IMAGES}
                className="text-xs text-indigo-400 hover:text-indigo-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
              >
                + URL 추가
              </button>
            </div>
            {imageUrls.length === 0 ? (
              <p className="text-xs text-zinc-600">이미지 없이 등록할 수 있습니다.</p>
            ) : (
              imageUrls.map((url, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateImageUrl(idx, e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeImageUrl(idx)}
                    className="shrink-0 px-3 rounded-lg border border-[#1f2430] text-xs text-zinc-500 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </section>

          {/* 에러 + 제출 */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {submitting ? '등록 중...' : '매물 등록'}
            </button>
            <Link
              href="/properties"
              className="px-5 py-2.5 rounded-lg border border-[#1f2430] text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
