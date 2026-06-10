/*---
id: ContractForm.tsx
milestone: M0
why: 기본 구조 파일 (ContractForm.tsx)
backlinks: []
---*/

/**
 * @file src/components/contracts/ContractForm.tsx
 * @description 계약(매출) 관리 - 신규 매출 등록 폼 컴포넌트
 * @purpose 계약 데이터 입력 및 담당 사원 검색, 서버 전송 기능 전담 (SRP 분리)
 */

'use client';

import { useState, useEffect } from 'react';

type User = {
  id: string;
  name: string;
  employeeId: string;
};

interface ContractFormProps {
  onContractAdded: () => void;
}

export default function ContractForm({ onContractAdded }: ContractFormProps) {
  const [formData, setFormData] = useState({ agentId: '', grossCommission: '', contractDate: new Date().toISOString().split('T')[0] });
  const [agentSearch, setAgentSearch] = useState('');
  const [agentOptions, setAgentOptions] = useState<User[]>([]);

  const fetchAgents = async () => {
    if (!agentSearch) {
      setAgentOptions([]);
      return;
    }
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(agentSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setAgentOptions(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAgents();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [agentSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agentId || !formData.grossCommission) return alert('담당 사원과 계약금액을 입력해주세요.');
    
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        alert('매출 등록 중 서버 오류가 발생했습니다.');
        return;
      }
      
      setFormData({ agentId: '', grossCommission: '', contractDate: new Date().toISOString().split('T')[0] });
      setAgentSearch('');
      onContractAdded();
    } catch (e) {
      alert('매출 등록에 실패했습니다.');
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl h-fit">
      <h2 className="text-xl font-semibold text-white mb-4">신규 계약(매출) 등록</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">담당 사원 검색</label>
          <input 
            type="text" 
            value={agentSearch}
            onChange={e => {
              setAgentSearch(e.target.value);
              if (e.target.value === '') setFormData({...formData, agentId: ''});
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            placeholder="담당자 이름이나 사번을 검색..."
          />
          <select 
            value={formData.agentId}
            onChange={e => setFormData({...formData, agentId: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- 사원 선택 --</option>
            {agentOptions.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">총 중개보수 (Gross)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₩</span>
            <input 
              type="number" 
              value={formData.grossCommission}
              onChange={e => setFormData({...formData, grossCommission: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: 5000000"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">계약일자</label>
          <input 
            type="date" 
            value={formData.contractDate}
            onChange={e => setFormData({...formData, contractDate: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-4"
        >
          매출 등록
        </button>
      </form>
    </div>
  );
}
