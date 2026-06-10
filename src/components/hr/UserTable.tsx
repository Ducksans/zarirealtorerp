/*---
id: UserTable.tsx
milestone: M0
why: 기본 구조 파일 (UserTable.tsx)
backlinks: []
---*/

/**
 * @file src/components/hr/UserTable.tsx
 * @description 인사 관리 - 직원 목록 및 조직도 테이블 컴포넌트
 * @purpose 검색된 직원 리스트 출력 및 삭제(Delete) 기능 렌더링 전담 (SRP 분리)
 */

'use client';

import Link from 'next/link';

type User = {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  upline?: { name: string, employeeId: string } | null;
};

interface UserTableProps {
  users: User[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDelete: (id: string) => void;
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function UserTable({ 
  users, loading, searchTerm, onSearchChange, onDelete,
  page, limit, totalCount, totalPages, onPageChange, onLimitChange
}: UserTableProps) {
  return (
    <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-white">조직도 및 사원 목록</h2>
        <div className="w-full sm:w-64">
          <input 
            type="text" 
            placeholder="사원명 또는 사번으로 검색..." 
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">사번 / 이름</th>
              <th className="px-6 py-4 font-medium">직급</th>
              <th className="px-6 py-4 font-medium">직속 상사 (오버라이딩 지급처)</th>
              <th className="px-6 py-4 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-white">
                  <Link href={`/hr/${u.id}`} className="hover:text-indigo-400 hover:underline">
                    {u.name}
                  </Link>
                  <span className="block text-xs text-slate-500 font-normal">{u.employeeId}</span>
                </td>
                <td className="px-6 py-4 text-slate-400">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    u.role === 'BRANCH_MGR' ? 'bg-purple-500/20 text-purple-300' :
                    u.role === 'DIV_HEAD' ? 'bg-indigo-500/20 text-indigo-300' :
                    u.role === 'TEAM_LEADER' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {u.upline?.name ? (
                    <div className="text-indigo-400">
                      ↑ {u.upline.name} <span className="text-xs text-indigo-500/70">({u.upline.employeeId})</span>
                    </div>
                  ) : <span className="text-slate-500">-</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onDelete(u.id)}
                    className="text-red-400 hover:text-red-300 transition-colors text-xs font-medium"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  등록된 사원이 없거나 검색 결과가 없습니다.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  데이터를 불러오는 중입니다...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/30">
        <div className="flex items-center gap-4">
          <select 
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1); // 페이지 크기 변경 시 1페이지로 리셋
            }}
            className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value={10}>10개씩 보기</option>
            <option value={30}>30개씩 보기</option>
            <option value={50}>50개씩 보기</option>
            <option value={100}>100개씩 보기</option>
          </select>
          <span className="text-sm text-slate-400">총 {totalCount}명</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            이전
          </button>
          <span className="text-sm text-slate-300">
            {page} / {totalPages || 1}
          </span>
          <button 
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
