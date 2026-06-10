/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

/**
 * @id AdminCrmMentoringKanban
 * @milestone M17
 * @why 직속 상관이 하위 조직원들의 활성 리드를 한눈에 모니터링하고 코칭하기 위함
 * @backlinks [[plan_crm_mentoring_system.md]]
 */
'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function MentoringKanban() {
  const [columns] = useState([
    { id: 'sos', title: '🚨 긴급 SOS (개입 필요)', count: 2 },
    { id: 'negotiating', title: '💬 코칭/협상 중', count: 5 },
    { id: 'closing', title: '🎯 클로징 단계', count: 3 },
  ]);

  const mockLeads = [
    { id: 101, status: 'sos', agent: '김신입 주임', title: '역삼동 150평 사무실', value: '수수료 예상 1,500만', updated: '10분 전' },
    { id: 102, status: 'sos', agent: '박초보 대리', title: '홍대입구 상가', value: '수수료 예상 800만', updated: '1시간 전' },
    { id: 103, status: 'negotiating', agent: '이대리', title: '성수동 지식산업센터', value: '수수료 예상 2,200만', updated: '어제' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">팀장/본부장 멘토링 데스크</h1>
            <p className="text-sm text-gray-500 mt-1">내 산하 조직원들의 활성 리드를 실시간으로 모니터링하고 코칭합니다.</p>
          </div>
          <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            당월 멘토링 기반 예상 오버라이딩: ₩ 3,450,000
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(col => (
            <div key={col.id} className="flex flex-col bg-gray-50/50 rounded-xl border border-gray-200 h-[700px]">
              <div className="p-4 border-b border-gray-200 bg-white rounded-t-xl flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">{col.title}</h2>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">{col.count}</span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {mockLeads.filter(lead => lead.status === col.id).map(lead => (
                  <Link href={`/crm/leads/${lead.id}`} key={lead.id}>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{lead.agent}</span>
                        <span className="text-xs text-gray-400">{lead.updated}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{lead.title}</h3>
                      <p className="text-sm text-gray-500 mt-2 font-mono">{lead.value}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
