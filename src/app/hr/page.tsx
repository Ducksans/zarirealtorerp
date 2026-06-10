/**
 * @file src/app/hr/page.tsx
 * @description 인사 관리 메인 페이지 컴포넌트
 * @dependencies UserForm, UserTable
 * @purpose 서브 컴포넌트 조합 및 사용자 리스트 상태 중앙 관리 (1파일 1책임 분리)
 */

'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import UserForm from '@/components/hr/UserForm';
import UserTable from '@/components/hr/UserTable';

type User = {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  uplineId: string | null;
  upline?: { name: string, employeeId: string } | null;
};

export default function HRManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const queryUrl = `/api/users?search=${encodeURIComponent(debouncedSearch)}&role=${roleFilter}&status=${statusFilter}&page=${page}&limit=${limit}`;
  const { data, error, isLoading: loading, mutate } = useSWR(queryUrl, fetcher);

  const users = data?.users || [];
  const totalCount = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 직원을 삭제하시겠습니까? 관련 데이터가 꼬일 수 있습니다.')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('삭제 처리 중 오류가 발생했습니다.');
        return;
      }
      mutate();
    } catch (e) {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">인사 관리 시스템</h1>
          <p className="text-slate-400 mt-1">사번 관리, 사원 등록, 조직도(사수) 배정 및 검색</p>
          <div className="flex gap-2 mt-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">모든 직급</option>
              <option value="BRANCH_MGR">지점장</option>
              <option value="DIV_HEAD">본부장</option>
              <option value="TEAM_LEADER">팀장</option>
              <option value="REGULAR">사원</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="ACTIVE">재직자</option>
              <option value="RESIGNED">퇴사자</option>
            </select>
            <button
              onClick={() => setIsFormVisible(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors ml-auto flex items-center gap-2"
            >
              <span>➕ 신규 사원 등록</span>
            </button>
          </div>
        </div>

        <div className="w-full">
          {/* Modal for UserForm */}
          {isFormVisible && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-10">
              <div className="relative w-full max-w-3xl my-auto">
                <button
                  onClick={() => setIsFormVisible(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2"
                >
                  ✕ 닫기
                </button>
                <UserForm onUserAdded={() => {
                  mutate();
                  setIsFormVisible(false);
                }} />
              </div>
            </div>
          )}
          
          <UserTable 
            users={users} 
            loading={loading} 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            onDelete={handleDelete}
            page={page}
            limit={limit}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      </div>
    </div>
  );
}
