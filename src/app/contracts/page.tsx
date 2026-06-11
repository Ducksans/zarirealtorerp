/**
 * @file src/app/contracts/page.tsx
 * @description 계약 관리 메인 페이지 컴포넌트
 * @dependencies ContractForm, ContractTable
 * @purpose 서브 컴포넌트 조합 및 계약 리스트 상태 중앙 관리 (1파일 1책임 분리)
 */

'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import ContractForm from '@/components/contracts/ContractForm';
import ContractTable from '@/components/contracts/ContractTable';
import { toastError } from '@/lib/toast';

type User = {
  id: string;
  name: string;
  employeeId: string;
};

type Transaction = {
  id: string;
  role: string;
  amount: number;
  percentage: number;
  recipient: { name: string };
};

type Contract = {
  id: string;
  grossCommission: number;
  contractDate: string;
  agent: User;
  signatureStatus: string;
  transactions?: Transaction[];
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ContractManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, error, isLoading, mutate } = useSWR<{contracts: Contract[]}>(
    `/api/contracts?search=${encodeURIComponent(debouncedSearch)}`,
    fetcher,
    { suspense: true }
  );

  const contracts = data?.contracts || [];

  const handleDelete = async (id: string) => {
    if (!confirm('해당 계약을 취소/삭제 하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toastError('삭제 처리 중 오류가 발생했습니다.');
        return;
      }
      mutate();
    } catch (e) {
      toastError('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">매출/계약 관리 시스템</h1>
          <p className="text-slate-400 mt-1">월별 사원들의 계약 실적을 등록하고 관리합니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ContractForm onContractAdded={mutate} />
          
          <ContractTable 
            contracts={contracts} 
            loading={isLoading} 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            onDelete={handleDelete} 
          />
        </div>
      </div>
    </div>
  );
}
