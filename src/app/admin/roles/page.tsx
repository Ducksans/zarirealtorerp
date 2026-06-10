/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';

import { useState } from 'react';

// 더미 데이터 세팅
const ROLES = [
  { id: '1', name: 'CEO', displayName: '대표', users: 1 },
  { id: '2', name: 'ADMIN', displayName: '총무', users: 3 },
  { id: '3', name: 'BRANCH_MGR', displayName: '지점장', users: 5 },
  { id: '4', name: 'DIV_HEAD', displayName: '본부장', users: 12 },
  { id: '5', name: 'TEAM_LEADER', displayName: '팀장', users: 45 },
  { id: '6', name: 'REGULAR', displayName: '직원', users: 549 },
];

const PERMISSIONS = [
  { category: '대시보드 (Dashboard)', items: [
    { id: 'VIEW_REVENUE', label: '전사 누적 매출 열람' },
    { id: 'VIEW_LEADERBOARD', label: '이달의 탑 퍼포머 열람' },
  ]},
  { category: '인사 관리 (HR)', items: [
    { id: 'CREATE_USER', label: '신규 사원 등록' },
    { id: 'EDIT_USER_INFO', label: '사원 개인정보 수정' },
    { id: 'DELETE_USER', label: '사원 퇴사 처리 (Soft Delete)' },
    { id: 'VIEW_AUDIT_LOG', label: 'Audit Log (변경 이력) 열람' },
  ]},
  { category: '계약 관리 (Contracts)', items: [
    { id: 'CREATE_CONTRACT', label: '신규 계약 등록' },
    { id: 'APPROVE_CONTRACT', label: '계약 건 전자결재 승인' },
    { id: 'DELETE_CONTRACT', label: '계약 건 삭제' },
  ]},
  { category: '정산 및 급여 (Settlements)', items: [
    { id: 'VIEW_ALL_SETTLEMENTS', label: '전사 급여 명세서 열람' },
    { id: 'APPROVE_SETTLEMENTS', label: '월간 정산 일괄 승인' },
    { id: 'EDIT_PAYROLL', label: '명세서 수기 수정' },
  ]}
];

export default function RolePermissionManagement() {
  const [activeRole, setActiveRole] = useState(ROLES[0]);
  
  // 더미 상태: 대표(CEO)는 모든 권한 true, 직원은 일부만 true
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'VIEW_REVENUE': true,
    'CREATE_USER': true,
    'VIEW_ALL_SETTLEMENTS': true,
  });

  const handleToggle = (permId: string) => {
    setToggles(prev => ({ ...prev, [permId]: !prev[permId] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
            <span className="text-indigo-500">🛡️</span> Role & Permission Management
          </h1>
          <p className="text-slate-400 font-medium text-sm">시스템 직급별 세부 접근 권한(RBAC)을 제어합니다. 대표(CEO) 및 총무 계정만 접근 가능합니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Roles List */}
          <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[700px]">
            <div className="p-5 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
              <h2 className="font-bold text-white">직급 계층 (Roles)</h2>
              <button className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-600/40 transition-colors">
                + 직급 추가
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {ROLES.map(role => (
                <button 
                  key={role.id}
                  onClick={() => setActiveRole(role)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                    activeRole.id === role.id 
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-200">{role.displayName}</div>
                    <div className="text-xs text-slate-500 mt-1">{role.name}</div>
                  </div>
                  <div className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                    {role.users}명
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Permissions Toggles */}
          <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[700px]">
            <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-white text-xl flex items-center gap-2">
                  <span className="text-indigo-400">{activeRole.displayName}</span> 권한 커스터마이징
                </h2>
                <p className="text-xs text-slate-400 mt-1">이 변경 사항은 실시간으로 모든 {activeRole.displayName} 사용자에게 적용됩니다.</p>
              </div>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                변경 사항 저장
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {PERMISSIONS.map(group => (
                <div key={group.category}>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                    {group.category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.items.map(perm => (
                      <div key={perm.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                        <div>
                          <div className="font-semibold text-slate-200 text-sm">{perm.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-mono">{perm.id}</div>
                        </div>
                        {/* Custom Toggle Switch */}
                        <button 
                          onClick={() => handleToggle(perm.id)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            toggles[perm.id] ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            toggles[perm.id] ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
