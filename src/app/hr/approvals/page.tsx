/*---
id: hr/approvals/page.tsx
milestone: M3
why: 채용 ATS — 순차 결재함 (TL→DH→BM→CEO 승인/반려, APPROVED 시 사원 전환)
backlinks: [[[Pages]], [[api/onboarding/route.ts]], [[api/onboarding/[id]/route.ts]]]
---*/

'use client';

import { useCallback, useEffect, useState } from 'react';

type OnboardingRow = {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  address: string;
  bankAccount: string;
  documents: string;
  atsStage: string;
  status: string;
  tlMemo: string | null;
  dhMemo: string | null;
  bmMemo: string | null;
  ceoMemo: string | null;
  createdAt: string;
};

type ApproverRole = 'TL' | 'DH' | 'BM' | 'CEO';

const ROLE_OPTIONS: { value: ApproverRole; label: string; pending: string }[] = [
  { value: 'TL', label: '팀장 (1차)', pending: 'PENDING_TL' },
  { value: 'DH', label: '본부장 (2차)', pending: 'PENDING_DH' },
  { value: 'BM', label: '지점장 (3차)', pending: 'PENDING_BM' },
  { value: 'CEO', label: '대표 (최종)', pending: 'PENDING_CEO' },
];

// 현재 결재자 이전 단계의 메모들
const PRIOR_MEMOS: Record<ApproverRole, { field: keyof OnboardingRow; label: string }[]> = {
  TL: [],
  DH: [{ field: 'tlMemo', label: '팀장 메모' }],
  BM: [
    { field: 'tlMemo', label: '팀장 메모' },
    { field: 'dhMemo', label: '본부장 메모' },
  ],
  CEO: [
    { field: 'tlMemo', label: '팀장 메모' },
    { field: 'dhMemo', label: '본부장 메모' },
    { field: 'bmMemo', label: '지점장 메모' },
  ],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function parseDocuments(json: string): { type: string; url: string }[] {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed.filter((d) => d && d.type && d.url) : [];
  } catch {
    return [];
  }
}

export default function ApprovalsInboxPage() {
  const [role, setRole] = useState<ApproverRole>('TL');
  const [rows, setRows] = useState<OnboardingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [memo, setMemo] = useState('');
  const [acting, setActing] = useState(false);
  const [convertedInfo, setConvertedInfo] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '목록 조회 실패');
      setRows(data.requests);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleOption = ROLE_OPTIONS.find((r) => r.value === role)!;
  const pendingRows = rows.filter((r) => r.status === roleOption.pending);
  const approvedRows = rows.filter((r) => r.status === 'APPROVED' && r.atsStage !== 'ONBOARDING');
  const selected = pendingRows.find((r) => r.id === selectedId) || pendingRows[0] || null;

  const decide = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selected) return;
    if (decision === 'REJECT' && !memo.trim()) {
      alert('반려 시 사유(메모) 입력은 필수입니다.');
      return;
    }
    setActing(true);
    try {
      const res = await fetch(`/api/onboarding/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: { as: role, memo: memo.trim(), decision } }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '결재 처리 실패');
        return;
      }
      setMemo('');
      setSelectedId('');
      await load();
    } catch {
      alert('네트워크 오류로 결재 처리에 실패했습니다.');
    } finally {
      setActing(false);
    }
  };

  const convert = async (row: OnboardingRow) => {
    setActing(true);
    try {
      const res = await fetch(`/api/onboarding/${row.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert', actorId: role }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '사원 전환 실패');
        return;
      }
      setConvertedInfo((prev) => ({ ...prev, [row.id]: data.employeeId }));
      await load();
    } catch {
      alert('네트워크 오류로 사원 전환에 실패했습니다.');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-6 lg:p-10 font-sans [word-break:keep-all]">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">입사 결재함</h1>
            <p className="text-sm text-[#8b93a3]">
              팀장 → 본부장 → 지점장 → 대표 순서로 결재합니다. 최종 승인된 지원자는 사원으로 전환할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#6b7280]">데모 모드 — 결재자 역할</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as ApproverRole);
                setSelectedId('');
                setMemo('');
              }}
              className="bg-[#11141a] border border-[#1f2430] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#11141a] border border-[#1f2430] rounded-xl px-5 py-3 text-sm inline-block">
          내 결재 대기 <span className="font-extrabold text-amber-400">{pendingRows.length}건</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {loading ? (
          <div className="text-sm text-[#6b7280] py-16 text-center">결재 목록을 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 대기 목록 */}
            <div className="lg:col-span-4 bg-[#11141a] border border-[#1f2430] rounded-2xl overflow-hidden flex flex-col max-h-[640px]">
              <div className="px-5 py-4 border-b border-[#1f2430] font-bold text-white text-sm">
                {roleOption.label} 결재 대기 목록
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {pendingRows.length === 0 && (
                  <div className="text-xs text-[#4a5161] text-center py-10">현재 단계의 결재 대기 건이 없습니다.</div>
                )}
                {pendingRows.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => {
                      setSelectedId(row.id);
                      setMemo('');
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${
                      selected?.id === row.id
                        ? 'bg-indigo-500/10 border-indigo-500/50'
                        : 'bg-[#0a0c10] border-[#1f2430] hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white text-sm">{row.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold">
                        결재 대기
                      </span>
                    </div>
                    <div className="text-xs text-[#6b7280]">
                      {row.phone} · 접수일 {formatDate(row.createdAt)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 상세 + 결재 */}
            <div className="lg:col-span-8 bg-[#11141a] border border-[#1f2430] rounded-2xl flex flex-col max-h-[640px] overflow-hidden">
              {!selected ? (
                <div className="flex-1 flex items-center justify-center text-sm text-[#4a5161]">
                  좌측 목록에서 결재할 지원자를 선택하세요.
                </div>
              ) : (
                <>
                  <div className="px-6 py-4 border-b border-[#1f2430] flex justify-between items-center">
                    <h2 className="font-bold text-white">{selected.name} 지원자</h2>
                    <span className="text-xs text-[#6b7280]">ATS 단계: {selected.atsStage}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 지원자 정보 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm bg-[#0a0c10] border border-[#1f2430] rounded-xl p-5">
                      <div><span className="text-[#6b7280] block text-xs mb-0.5">생년월일</span>{selected.birthDate}</div>
                      <div><span className="text-[#6b7280] block text-xs mb-0.5">연락처</span>{selected.phone}</div>
                      <div className="sm:col-span-2"><span className="text-[#6b7280] block text-xs mb-0.5">주소</span>{selected.address}</div>
                      <div className="sm:col-span-2"><span className="text-[#6b7280] block text-xs mb-0.5">급여 계좌</span>{selected.bankAccount}</div>
                      <div className="sm:col-span-2">
                        <span className="text-[#6b7280] block text-xs mb-1">첨부 서류</span>
                        {parseDocuments(selected.documents).length === 0 ? (
                          <span className="text-[#4a5161] text-xs">첨부 없음</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {parseDocuments(selected.documents).map((d, i) => (
                              <a
                                key={i}
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs px-2.5 py-1 rounded-lg border border-[#1f2430] bg-[#11141a] text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                {d.type} ↗
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 이전 결재 메모 */}
                    {PRIOR_MEMOS[role].length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white">이전 결재 메모</h3>
                        {PRIOR_MEMOS[role].map(({ field, label }) => (
                          <div key={field} className="bg-[#0a0c10] border border-[#1f2430] rounded-xl p-4">
                            <div className="text-xs text-emerald-400 font-bold mb-1">{label} — 승인</div>
                            <p className="text-sm text-[#8b93a3]">
                              {(selected[field] as string | null) || '메모 없음'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 결재 입력 */}
                    <div className="bg-[#0a0c10] border border-[#1f2430] rounded-xl p-5 space-y-3">
                      <label className="block text-sm font-bold text-white">
                        {roleOption.label} 결재 메모 <span className="text-xs font-normal text-[#6b7280]">(반려 시 필수)</span>
                      </label>
                      <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="멘토링 계획, 평가 의견, 반려 사유 등을 기록하세요."
                        className="w-full h-24 bg-[#11141a] border border-[#1f2430] rounded-lg p-3 text-sm text-[#cdd2da] placeholder:text-[#4a5161] focus:outline-none focus:ring-1 focus:ring-indigo-500/60 resize-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => decide('APPROVE')}
                          disabled={acting}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-wait text-white font-bold py-2.5 rounded-lg transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => decide('REJECT')}
                          disabled={acting}
                          className="flex-1 bg-[#11141a] border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-wait font-bold py-2.5 rounded-lg transition-colors"
                        >
                          반려
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 최종 승인 완료 — 사원 전환 */}
        {!loading && (
          <div className="bg-[#11141a] border border-[#1f2430] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-sm">최종 승인 완료 — 사원 전환 대기</h2>
              <span className="text-xs text-[#6b7280]">{approvedRows.length}건</span>
            </div>
            {approvedRows.length === 0 && Object.keys(convertedInfo).length === 0 && (
              <p className="text-xs text-[#4a5161]">전환 대기 중인 지원자가 없습니다.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedRows.map((row) => (
                <div key={row.id} className="bg-[#0a0c10] border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-sm">{row.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold">
                      APPROVED
                    </span>
                  </div>
                  <div className="text-xs text-[#6b7280] mb-3">
                    {row.phone} · 접수일 {formatDate(row.createdAt)}
                  </div>
                  <button
                    onClick={() => convert(row)}
                    disabled={acting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-wait text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
                  >
                    사원 전환 (사번 발급)
                  </button>
                </div>
              ))}
              {/* 방금 전환 완료된 건 — 발급 사번 표시 */}
              {Object.entries(convertedInfo).map(([reqId, employeeId]) => {
                const row = rows.find((r) => r.id === reqId);
                return (
                  <div key={reqId} className="bg-[#0a0c10] border border-emerald-500/40 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-white text-sm">{row?.name || '신규 사원'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold">
                        전환 완료
                      </span>
                    </div>
                    <div className="text-xs text-[#8b93a3]">
                      발급 사번 <span className="font-mono font-bold text-emerald-400">{employeeId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
