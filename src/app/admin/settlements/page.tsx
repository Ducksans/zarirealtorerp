/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';

export default function SettlementsMockup() {
  const [data] = useState([
    { id: 1, agent: '이민수 사원', role: '사원', gross: 10000000, base: 5000000, bonus: 1000000, overrides: 0, total: 6000000 },
    { id: 2, agent: '김지현 팀장', role: '팀장', gross: 5000000, base: 2500000, bonus: 500000, overrides: 1000000, total: 4000000 },
    { id: 3, agent: '조률 지점장', role: '지점장', gross: 0, base: 0, bonus: 0, overrides: 8500000, total: 8500000 }
  ]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white tracking-tight">자동 정산 및 급여 대시보드 (M9)</h1>
          <p className="text-slate-400 mt-1">SSOT 100원 Rule 기반 자동 수익 분배 (기본급, 영업지원비, 오버라이딩)</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-sm text-slate-400 mb-2">이번 달 총 발생 매출액</div>
            <div className="text-3xl font-bold text-emerald-400">₩ 15,000,000</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-sm text-slate-400 mb-2">지급 총액 (사원+관리자)</div>
            <div className="text-3xl font-bold text-indigo-400">₩ 10,875,000</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
            <div className="text-sm text-pink-400 font-medium mb-2">본사 순 마진 (27.5%)</div>
            <div className="text-3xl font-bold text-pink-500">₩ 4,125,000</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/80">
            <h2 className="text-lg font-semibold text-white">사원별 100원 Rule 정산 내역</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 bg-slate-900/50 text-sm">
                  <th className="px-6 py-4 font-medium">직원명</th>
                  <th className="px-6 py-4 font-medium text-right">총 창출매출 (100%)</th>
                  <th className="px-6 py-4 font-medium text-right">기본 배분 (50%)</th>
                  <th className="px-6 py-4 font-medium text-right">영업지원비 (10%)</th>
                  <th className="px-6 py-4 font-medium text-right text-indigo-400">오버라이딩 수당</th>
                  <th className="px-6 py-4 font-medium text-right text-emerald-400 font-bold">최종 지급액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.map(row => (
                  <tr key={row.id} className="text-slate-300 hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-medium">{row.agent} <span className="text-xs text-slate-500 ml-1">({row.role})</span></td>
                    <td className="px-6 py-4 text-right">₩ {row.gross.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-400">₩ {row.base.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-400">₩ {row.bonus.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-indigo-400">₩ {row.overrides.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-bold bg-emerald-900/10">₩ {row.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
