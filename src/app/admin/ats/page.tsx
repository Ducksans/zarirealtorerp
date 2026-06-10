/*---
id: admin/ats/page.tsx
milestone: M3
why: 채용 ATS — 실데이터 기반 6단계 채용 파이프라인 칸반 (GET/PATCH /api/onboarding 연동)
backlinks: [[[Pages]], [[api/onboarding/route.ts]], [[api/onboarding/[id]/route.ts]]]
---*/

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type OnboardingRow = {
  id: string;
  name: string;
  phone: string;
  atsStage: string;
  status: string;
  createdAt: string;
};

const COLUMNS = [
  { id: 'NEW', title: '신규 지원', accent: 'border-slate-500' },
  { id: 'RECRUITER', title: '리크루터 검토', accent: 'border-blue-500' },
  { id: 'PRACTICAL', title: '실무진 면접', accent: 'border-amber-500' },
  { id: 'MANAGER', title: '관리자 면접', accent: 'border-orange-500' },
  { id: 'FINAL', title: '최종 승인 대기', accent: 'border-indigo-500' },
  { id: 'ONBOARDING', title: '온보딩 (전환 완료)', accent: 'border-emerald-500' },
] as const;

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  PENDING_TL: { label: '팀장 결재 대기', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  PENDING_DH: { label: '본부장 결재 대기', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  PENDING_BM: { label: '지점장 결재 대기', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  PENDING_CEO: { label: '대표 결재 대기', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  APPROVED: { label: '결재 완료', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  REJECTED: { label: '반려', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function AtsKanbanPage() {
  const [rows, setRows] = useState<OnboardingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movingId, setMovingId] = useState('');
  const [weekCutoff, setWeekCutoff] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '목록 조회 실패');
      setRows(data.requests);
      setWeekCutoff(Date.now() - 7 * 24 * 60 * 60 * 1000);
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

  const moveStage = async (row: OnboardingRow, direction: -1 | 1) => {
    const idx = COLUMNS.findIndex((c) => c.id === row.atsStage);
    const target = COLUMNS[idx + direction];
    if (!target) return;
    setMovingId(row.id);
    try {
      const res = await fetch(`/api/onboarding/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atsStage: target.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '단계 이동 실패');
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, atsStage: data.atsStage } : r)));
    } catch {
      alert('네트워크 오류로 단계 이동에 실패했습니다.');
    } finally {
      setMovingId('');
    }
  };

  const active = rows.filter((r) => r.status !== 'REJECTED');
  const rejected = rows.filter((r) => r.status === 'REJECTED');

  const newThisWeek = active.filter((r) => new Date(r.createdAt).getTime() >= weekCutoff).length;
  const inProgress = active.filter((r) => r.atsStage !== 'ONBOARDING').length;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cdd2da] p-6 lg:p-10 font-sans [word-break:keep-all]">
      <div className="max-w-[1800px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">채용 파이프라인 (ATS)</h1>
          <p className="text-sm text-[#8b93a3]">
            입사지원부터 사원 전환까지의 단계를 관리합니다. 결재는{' '}
            <Link href="/hr/approvals" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">순차 결재함</Link>
            에서 진행됩니다.
          </p>
        </div>
        <div className="bg-[#11141a] border border-[#1f2430] px-5 py-3 rounded-xl text-sm">
          진행 중 지원자 <span className="font-extrabold text-white">{inProgress}명</span>
          <span className="text-[#4a5161] mx-2">·</span>
          이번 주 신규 <span className="font-extrabold text-indigo-400">{newThisWeek}명</span>
        </div>
      </div>

      {error && (
        <div className="max-w-[1800px] mx-auto mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="max-w-[1800px] mx-auto text-sm text-[#6b7280] py-20 text-center">지원자 목록을 불러오는 중...</div>
      ) : (
        <>
          {/* Kanban */}
          <div className="max-w-[1800px] mx-auto overflow-x-auto pb-4">
            <div className="flex gap-5 min-w-max">
              {COLUMNS.map((column, colIdx) => {
                const cards = active.filter((r) => r.atsStage === column.id);
                return (
                  <div key={column.id} className="w-[300px] bg-[#11141a] rounded-2xl border border-[#1f2430] flex flex-col max-h-[720px]">
                    <div className={`p-4 border-b-2 ${column.accent} flex justify-between items-center`}>
                      <h2 className="font-bold text-white text-sm">{column.title}</h2>
                      <span className="bg-[#0a0c10] text-[#8b93a3] text-xs px-2.5 py-1 rounded-full font-mono border border-[#1f2430]">
                        {cards.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {cards.length === 0 && (
                        <div className="text-xs text-[#4a5161] text-center py-8">지원자 없음</div>
                      )}
                      {cards.map((row) => {
                        const chip = STATUS_CHIP[row.status] || STATUS_CHIP.PENDING_TL;
                        const canLeft = colIdx > 0 && column.id !== 'ONBOARDING';
                        // FINAL→ONBOARDING은 결재함의 [사원 전환]으로만 진입
                        const canRight = colIdx < COLUMNS.length - 2;
                        return (
                          <div key={row.id} className="bg-[#0a0c10] border border-[#1f2430] rounded-xl p-4 hover:border-indigo-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-white text-sm">{row.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${chip.cls}`}>
                                {chip.label}
                              </span>
                            </div>
                            <div className="text-xs text-[#6b7280] space-y-1 mb-3">
                              <div>{row.phone}</div>
                              <div>접수일 {formatDate(row.createdAt)}</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <button
                                onClick={() => moveStage(row, -1)}
                                disabled={!canLeft || movingId === row.id}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#11141a] border border-[#1f2430] text-[#8b93a3] hover:text-white hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                ◀
                              </button>
                              {column.id === 'FINAL' && (
                                <span className="text-[10px] text-[#6b7280]">결재함에서 전환</span>
                              )}
                              {column.id === 'ONBOARDING' && (
                                <span className="text-[10px] text-emerald-400 font-bold">사원 전환 완료</span>
                              )}
                              <button
                                onClick={() => moveStage(row, 1)}
                                disabled={!canRight || movingId === row.id}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#11141a] border border-[#1f2430] text-[#8b93a3] hover:text-white hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                ▶
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REJECTED 접힘 영역 */}
          <details className="max-w-[1800px] mx-auto mt-6 bg-[#11141a]/60 border border-[#1f2430] rounded-2xl">
            <summary className="cursor-pointer select-none px-5 py-4 text-sm font-bold text-[#6b7280] hover:text-[#8b93a3] transition-colors">
              반려된 지원자 {rejected.length}명
            </summary>
            <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {rejected.length === 0 && <div className="text-xs text-[#4a5161] py-2">반려된 지원자가 없습니다.</div>}
              {rejected.map((row) => (
                <div key={row.id} className="bg-[#0a0c10]/60 border border-[#1f2430] rounded-xl p-4 opacity-60 grayscale">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-[#8b93a3] text-sm">{row.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-500/15 text-red-400 border-red-500/30 font-semibold">
                      반려
                    </span>
                  </div>
                  <div className="text-xs text-[#4a5161]">
                    {row.phone} · 접수일 {formatDate(row.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
