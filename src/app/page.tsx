/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

/**
 * @id MainB2CPortal
 * @milestone M0
 * @why 일반 고객이 처음 진입하는 B2C 포털 메인 화면
 * @backlinks [[project_roadmap.md]]
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ROLES_KO } from '@/types';

export default function MainDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/main')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-indigo-400 font-semibold animate-pulse text-lg">대시보드 데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-400">데이터를 불러오지 못했습니다.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Company Overview</h1>
            <p className="text-slate-400 font-medium">전사 매출 및 운영 현황 통합 대시보드</p>
          </div>
          <div className="flex gap-4">
            <Link href="/hr" className="px-6 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/40 transition-colors border border-indigo-500/50 font-medium">
              인사 관리 (HR) 바로가기
            </Link>
            <Link href="/settlements" className="px-6 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 font-medium">
              월간 정산 시스템 열기
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="text-slate-400 text-sm font-semibold mb-2">누적 총 매출 (Gross Revenue)</div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {(data.metrics?.totalRevenue || 0).toLocaleString()} <span className="text-lg text-slate-500 font-medium">KRW</span>
            </div>
            <div className="text-emerald-400 text-xs font-medium flex items-center gap-1">
              <span className="text-lg">↗</span> 전월 대비 상승
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
             <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="text-slate-400 text-sm font-semibold mb-2">활성 소속 사원 (Active Agents)</div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {data.metrics?.activeAgents || 0} <span className="text-lg text-slate-500 font-medium">명</span>
            </div>
            <div className="text-slate-500 text-xs font-medium">
              정상 재직 중인 직원 수
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
             <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="text-slate-400 text-sm font-semibold mb-2">전자결재 대기 (Pending Contracts)</div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {data.metrics?.pendingContracts || 0} <span className="text-lg text-slate-500 font-medium">건</span>
            </div>
            <div className="text-amber-400 text-xs font-medium flex items-center gap-1">
              신속한 승인이 필요합니다.
            </div>
          </div>
        </div>

        {/* Main Chart & Leaderboard */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Chart */}
          <div className="xl:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col min-h-[400px]">
            <h2 className="text-lg font-bold text-white mb-6">전사 월별 매출 성장 추이</h2>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 10000).toLocaleString()}만`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    formatter={(value) => [`${Number(value).toLocaleString()} 원`, '매출액']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 6, fill: '#818cf8', stroke: '#312e81', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="xl:col-span-1 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col">
            <h2 className="text-lg font-bold text-white mb-2">🏆 이달의 탑 퍼포머</h2>
            <p className="text-xs text-slate-500 mb-6">이번 달 누적 매출 기준 상위 5명</p>
            
            <div className="flex-1 flex flex-col gap-3">
              {(data.leaderboard && data.leaderboard.length > 0) ? (
                data.leaderboard.map((agent: any) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${agent.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                          agent.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                          agent.rank === 3 ? 'bg-amber-700/20 text-amber-600' :
                          'bg-slate-800 text-slate-500'}`}
                      >
                        {agent.rank}
                      </div>
                      <div>
                        <div className="font-bold text-white">{agent.name}</div>
                        <div className="text-xs text-slate-500">{ROLES_KO[agent.role as keyof typeof ROLES_KO]} | {agent.employeeId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-indigo-400">{(agent.sales).toLocaleString()}원</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                  이달의 계약 데이터가 없습니다.
                </div>
              )}
            </div>
            
            <button className="w-full mt-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-700 hover:text-white transition-colors border border-slate-700">
              전체 랭킹 보기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
