/*---
id: admin_settlements_page
milestone: M9
why: 100원 룰 정산 엔진의 관리자 화면 — 월 선택 정산 실행, 직급별 분배 내역, 전자결재/지급 상태 처리 (Work_Queue #1 실제화)
backlinks: [[SSOT_Commission_100won_Rule.md]], [[Work_Queue.md]]
---*/

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ROLES_KO, type UserRole } from '@/types';

type SettlementRow = {
  id: string;
  userId: string;
  user: { name: string; role: string; employeeId: string };
  basePay: number;
  bonusPay: number;
  overridePay: number;
  totalPay: number;
  signatureStatus: string;
  paymentStatus: string;
};

const ROLE_BADGE: Record<string, string> = {
  BRANCH_MGR: 'bg-purple-500/20 text-purple-300',
  DIV_HEAD: 'bg-indigo-500/20 text-indigo-300',
  TEAM_LEADER: 'bg-blue-500/20 text-blue-300',
  REGULAR: 'bg-slate-700 text-slate-300',
};

function formatKrw(amount: number) {
  return `₩ ${amount.toLocaleString('ko-KR')}`;
}

function currentYearMonth() {
  return new Date().toISOString().substring(0, 7);
}

export default function AdminSettlementsPage() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [totalGross, setTotalGross] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/dashboard?yearMonth=${yearMonth}&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error(`조회 실패 (HTTP ${res.status})`);
      const data = await res.json();
      setRows(data.settlements);
      setTotalGross(data.totalGross);
    } catch (e) {
      setError(e instanceof Error ? e.message : '정산 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [yearMonth, search]);

  useEffect(() => { load(); }, [load]);

  const runSettlement = async () => {
    if (!confirm(`${yearMonth} 월 정산을 실행합니다. 해당 월의 기존 정산 내역은 재계산됩니다. 진행할까요?`)) return;
    setRunning(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearMonth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `정산 실행 실패 (HTTP ${res.status})`);
      setNotice(`✅ ${data.yearMonth} 정산 완료 — ${data.count}명 처리`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '정산 실행에 실패했습니다.');
    } finally {
      setRunning(false);
    }
  };

  const patchStatus = async (row: SettlementRow, field: 'signatureStatus' | 'paymentStatus') => {
    const label = field === 'signatureStatus' ? '전자결재 서명' : '지급';
    const reason = prompt(`${row.user.name}님의 ${label} 처리 사유를 입력하세요. (감사 로그에 기록됩니다)`, `${yearMonth} 정산 ${label} 처리`);
    if (reason === null) return;
    setError('');
    try {
      const res = await fetch(`/api/settlements/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: field === 'signatureStatus' ? 'SIGNED' : 'PAID', reason: reason || `${label} 처리` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `${label} 처리 실패 (HTTP ${res.status})`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} 처리에 실패했습니다.`);
    }
  };

  const totalPaid = rows.reduce((s, r) => s + r.totalPay, 0);
  const companyProfit = totalGross - totalPaid;
  const marginRate = totalGross > 0 ? ((companyProfit / totalGross) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">통합 정산 관리 (M9)</h1>
            <p className="text-slate-400 mt-1">
              100원 룰 — 직원 55 · 팀장 10 · 본부장 5 · 지점장 2.5 · 회사 27.5 (SSOT_Commission_100won_Rule)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={yearMonth}
              onChange={e => setYearMonth(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={runSettlement}
              disabled={running}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-colors"
            >
              {running ? '정산 계산 중...' : `⚡ ${yearMonth} 정산 실행`}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3">⚠️ {error}</div>
        )}
        {notice && (
          <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-300 rounded-lg px-4 py-3">{notice}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-sm text-slate-400 mb-2">{yearMonth} 총 발생 매출 (중개보수 총액)</div>
            <div className="text-3xl font-bold text-emerald-400">{loading ? '—' : formatKrw(totalGross)}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-sm text-slate-400 mb-2">지급 총액 (영업수당+지원비+오버라이딩)</div>
            <div className="text-3xl font-bold text-indigo-400">{loading ? '—' : formatKrw(totalPaid)}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
            <div className="text-sm text-pink-400 font-medium mb-2">본사 귀속분 (마진율 {loading ? '—' : `${marginRate}%`})</div>
            <div className="text-3xl font-bold text-pink-500">{loading ? '—' : formatKrw(companyProfit)}</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-white">직원별 100원 룰 정산 내역 ({yearMonth})</h2>
            <input
              type="text"
              placeholder="사원명 또는 사번으로 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-72 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 bg-slate-900/50">
                  <th className="px-5 py-4 font-medium">직원명</th>
                  <th className="px-5 py-4 font-medium">직급</th>
                  <th className="px-5 py-4 font-medium text-right">기본 영업수당</th>
                  <th className="px-5 py-4 font-medium text-right">영업지원비</th>
                  <th className="px-5 py-4 font-medium text-right text-indigo-400">오버라이딩</th>
                  <th className="px-5 py-4 font-medium text-right text-emerald-400">최종 지급액</th>
                  <th className="px-5 py-4 font-medium text-center">전자결재</th>
                  <th className="px-5 py-4 font-medium text-center">지급 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading && (
                  <tr><td colSpan={8} className="px-6 py-14 text-center text-slate-400">정산 데이터를 불러오는 중입니다...</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-14 text-center text-slate-500">
                    {yearMonth}의 정산 내역이 없습니다. 우측 상단의 <b>정산 실행</b> 버튼으로 월 정산을 생성하세요.
                  </td></tr>
                )}
                {!loading && rows.map(row => (
                  <tr key={row.id} className="text-slate-300 hover:bg-slate-700/30">
                    <td className="px-5 py-4 font-medium text-white">
                      <a
                        href={`/admin/transparency?userId=${row.userId}&yearMonth=${yearMonth}`}
                        className="hover:text-indigo-300 transition-colors"
                        title="100원 분해 추적기에서 이 직원의 매출 흐름 보기"
                      >
                        {row.user.name} <span className="text-indigo-500/70 text-xs">⌕</span>
                      </a>
                      <span className="text-xs text-slate-500 block">{row.user.employeeId}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${ROLE_BADGE[row.user.role] ?? 'bg-slate-700 text-slate-300'}`}>
                        {ROLES_KO[row.user.role as UserRole] ?? row.user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">{formatKrw(row.basePay)}</td>
                    <td className="px-5 py-4 text-right">{formatKrw(row.bonusPay)}</td>
                    <td className="px-5 py-4 text-right text-indigo-400">{formatKrw(row.overridePay)}</td>
                    <td className="px-5 py-4 text-right text-emerald-400 font-bold bg-emerald-900/10">{formatKrw(row.totalPay)}</td>
                    <td className="px-5 py-4 text-center">
                      {row.signatureStatus === 'SIGNED' ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300">서명 완료</span>
                      ) : (
                        <button
                          onClick={() => patchStatus(row, 'signatureStatus')}
                          className="px-3 py-1 rounded-lg text-xs bg-slate-700 hover:bg-indigo-600 text-slate-200 transition-colors"
                        >
                          서명 처리
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {row.paymentStatus === 'PAID' ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300">지급 완료</span>
                      ) : row.signatureStatus === 'SIGNED' ? (
                        <button
                          onClick={() => patchStatus(row, 'paymentStatus')}
                          className="px-3 py-1 rounded-lg text-xs bg-slate-700 hover:bg-emerald-600 text-slate-200 transition-colors"
                        >
                          지급 처리
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">서명 대기</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          ※ 결재 라인 규정: 전자결재(서명) 완료 없이는 지급 처리가 불가합니다 (Global_SSOT_Business_and_Operations §3).
          모든 상태 변경은 사유와 함께 감사 로그(AuditLog)에 기록됩니다.
        </p>
      </div>
    </div>
  );
}
