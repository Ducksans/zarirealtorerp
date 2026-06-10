/*---
id: onboarding/page.tsx
milestone: M3
why: 채용 ATS — 예비 사원 입사지원 폼 (POST /api/onboarding 실연동, 모바일 우선)
backlinks: [[[Pages]], [[api/onboarding/route.ts]]]
---*/

'use client';

import { useState } from 'react';
import Link from 'next/link';

type DocumentMeta = { type: string; url: string };

type FormState = {
  name: string;
  birthDate: string;
  phone: string;
  address: string;
  bankAccount: string;
  ssnSuffix: string;
};

const INITIAL_FORM: FormState = {
  name: '',
  birthDate: '',
  phone: '',
  address: '',
  bankAccount: '',
  ssnSuffix: '',
};

const DOC_TYPES = ['이력서', '자격증', '포트폴리오'];

export default function OnboardingApplyPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptId, setReceiptId] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addDocument = () => {
    if (documents.length >= 3) return;
    setDocuments([...documents, { type: '이력서', url: '' }]);
  };

  const updateDocument = (idx: number, patch: Partial<DocumentMeta>) => {
    setDocuments(documents.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const removeDocument = (idx: number) => {
    setDocuments(documents.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate)) {
      setError('생년월일은 YYYY-MM-DD 형식으로 입력해 주세요.');
      return;
    }
    if (form.ssnSuffix && !/^\d{7}$/.test(form.ssnSuffix)) {
      setError('주민번호 뒷자리는 7자리 숫자입니다.');
      return;
    }
    const incompleteDoc = documents.find((d) => !d.url.trim());
    if (incompleteDoc) {
      setError('첨부 서류의 URL을 입력하거나 해당 항목을 삭제해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          birthDate: form.birthDate,
          phone: form.phone,
          address: form.address,
          bankAccount: form.bankAccount,
          ssnSuffix: form.ssnSuffix || undefined,
          documents: documents.map((d) => ({ type: d.type, url: d.url.trim() })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      setReceiptId(data.id);
    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[#0a0c10] border border-[#1f2430] rounded-xl px-4 py-3 text-[#cdd2da] placeholder:text-[#4a5161] focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-shadow';
  const labelClass = 'block text-sm font-semibold text-[#cdd2da] mb-2';

  // ─────────────── 접수 완료 화면 ───────────────
  if (receiptId) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] font-sans flex items-center justify-center px-4 py-12 [word-break:keep-all]">
        <div className="w-full max-w-lg bg-[#11141a] border border-[#1f2430] rounded-2xl p-8 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-extrabold text-white">접수 완료 — 리크루팅 담당자가 곧 연락드립니다</h1>
          <div className="bg-[#0a0c10] border border-[#1f2430] rounded-xl p-4">
            <div className="text-xs text-[#6b7280] mb-1">접수번호</div>
            <div className="font-mono text-emerald-400 text-sm break-all">{receiptId}</div>
          </div>
          <p className="text-sm text-[#8b93a3] leading-relaxed">
            지원해 주셔서 감사합니다. 검토 후 기재해 주신 연락처로 안내드리겠습니다.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────── 지원 폼 ───────────────
  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] font-sans px-4 py-10 [word-break:keep-all]">
      <main className="max-w-lg mx-auto space-y-6">
        {/* Hero */}
        <header className="space-y-3">
          <span className="inline-block text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
            Recruitment
          </span>
          <h1 className="text-2xl font-extrabold text-white leading-snug">
            자리에 합류하세요 — 투명한 보상은 이미 시스템이 증명합니다
          </h1>
          <p className="text-sm text-[#8b93a3]">
            데모로 직접 확인:{' '}
            <Link href="/home" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">메인 대시보드</Link>
            {' · '}
            <Link href="/admin/transparency" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">정산 투명성 보드</Link>
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-[#11141a] border border-[#1f2430] rounded-2xl p-6 space-y-5">
          <div>
            <label className={labelClass}>이름 <span className="text-red-400">*</span></label>
            <input required name="name" value={form.name} onChange={handleChange} placeholder="홍길동" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>생년월일 <span className="text-red-400">*</span></label>
            <input required name="birthDate" value={form.birthDate} onChange={handleChange} placeholder="1990-01-01" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>연락처 <span className="text-red-400">*</span></label>
            <input required name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>주소 <span className="text-red-400">*</span></label>
            <input required name="address" value={form.address} onChange={handleChange} placeholder="서울특별시 ..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>급여 수령 계좌 <span className="text-red-400">*</span></label>
            <input required name="bankAccount" value={form.bankAccount} onChange={handleChange} placeholder="은행명 000-0000-0000" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>
              주민번호 뒷자리 <span className="text-xs font-normal text-[#6b7280]">(선택 — 입력 시 암호화 보관)</span>
            </label>
            <input
              name="ssnSuffix"
              value={form.ssnSuffix}
              onChange={handleChange}
              placeholder="0000000"
              maxLength={7}
              inputMode="numeric"
              className={inputClass}
            />
          </div>

          {/* 서류 메타 (0~3건 동적 추가) */}
          <div className="pt-4 border-t border-[#1f2430] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#cdd2da]">첨부 서류 (URL, 최대 3건)</span>
              <button
                type="button"
                onClick={addDocument}
                disabled={documents.length >= 3}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:text-[#4a5161] disabled:cursor-not-allowed transition-colors"
              >
                + 서류 추가
              </button>
            </div>

            {documents.length === 0 && (
              <p className="text-xs text-[#6b7280]">이력서·자격증 링크가 있다면 추가해 주세요. 없어도 지원 가능합니다.</p>
            )}

            {documents.map((doc, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={doc.type}
                  onChange={(e) => updateDocument(idx, { type: e.target.value })}
                  className="bg-[#0a0c10] border border-[#1f2430] rounded-lg px-2 py-2.5 text-sm text-[#cdd2da] focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  value={doc.url}
                  onChange={(e) => updateDocument(idx, { url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 bg-[#0a0c10] border border-[#1f2430] rounded-lg px-3 py-2.5 text-sm text-[#cdd2da] placeholder:text-[#4a5161] focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                />
                <button
                  type="button"
                  onClick={() => removeDocument(idx)}
                  aria-label="서류 삭제"
                  className="text-[#6b7280] hover:text-red-400 text-sm px-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-wait text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? '접수 중...' : '입사 지원하기'}
          </button>
        </form>
      </main>
    </div>
  );
}
