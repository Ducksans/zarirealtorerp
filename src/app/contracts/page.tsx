/**
 * @file src/app/contracts/page.tsx
 * @description 계약 관리 메인 페이지 컴포넌트
 * @dependencies ContractForm, ContractTable
 * @purpose 서브 컴포넌트 조합 및 계약 리스트 상태 중앙 관리 (1파일 1책임 분리)
 */

'use client';

import { useState, useEffect } from 'react';
import ContractForm from '@/components/contracts/ContractForm';
import ContractTable from '@/components/contracts/ContractTable';

type User = {
  id: string;
  name: string;
  employeeId: string;
};

type Contract = {
  id: string;
  grossCommission: number;
  contractDate: string;
  agent: User;
};

export default function ContractManagement() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts?search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchContracts();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm('해당 계약을 취소/삭제 하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('삭제 처리 중 오류가 발생했습니다.');
        return;
      }
      fetchContracts();
    } catch (e) {
      alert('삭제에 실패했습니다.');
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
          <ContractForm onContractAdded={fetchContracts} />
          
          <ContractTable 
            contracts={contracts} 
            loading={loading} 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            onDelete={handleDelete} 
          />
        </div>
      </div>
    </div>
  );
}
