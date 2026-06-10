/**
 * @file src/components/contracts/ContractTable.tsx
 * @description 계약(매출) 관리 - 매출 내역 리스트 컴포넌트
 * @purpose 서버에서 불러온 전체 매출 현황을 표 형태로 렌더링하고 삭제 기능을 제공합니다 (SRP 분리).
 */

'use client';

import React, { useState } from 'react';

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

interface ContractTableProps {
  contracts: Contract[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDelete: (id: string) => void;
}

export default function ContractTable({ contracts, loading, searchTerm, onSearchChange, onDelete }: ContractTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatKrw = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-white">전사 매출 현황</h2>
        <div className="w-full sm:w-64">
          <input 
            type="text" 
            placeholder="담당자명 또는 사번으로 검색..." 
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
              <th className="px-6 py-4 font-medium">계약일자</th>
              <th className="px-6 py-4 font-medium">담당 사원</th>
              <th className="px-6 py-4 font-medium">결재 상태</th>
              <th className="px-6 py-4 font-medium text-right">총 중개보수</th>
              <th className="px-6 py-4 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {contracts.map((c) => (
              <React.Fragment key={c.id}>
                <tr className="hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <td className="px-6 py-4 text-slate-400">{new Date(c.contractDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-white">
                    {c.agent?.name} <span className="text-xs text-slate-500 block">{c.agent?.employeeId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${c.signatureStatus === 'SIGNED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {c.signatureStatus === 'SIGNED' ? '결재완료' : '결재대기'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400 font-medium">{formatKrw(c.grossCommission)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                      className="text-red-400 hover:text-red-300 transition-colors text-xs font-medium"
                    >
                      취소
                    </button>
                  </td>
                </tr>
                {expandedId === c.id && c.transactions && c.transactions.length > 0 && (
                  <tr className="bg-slate-900/40">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="text-xs text-slate-400 mb-2 font-medium">정산 내역 (수수료 배분)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {c.transactions.map((t) => (
                          <div key={t.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700">
                            <div>
                              <span className="text-white font-medium">{t.recipient.name}</span>
                              <span className="text-slate-500 ml-2">({t.role})</span>
                            </div>
                            <div className="text-emerald-400 font-medium">
                              {formatKrw(t.amount)} <span className="text-slate-500 font-normal text-[10px]">({t.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {expandedId === c.id && (!c.transactions || c.transactions.length === 0) && (
                  <tr className="bg-slate-900/40">
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                      정산 내역이 없습니다. (월 마감 전)
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {contracts.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  등록된 매출 내역이 없거나 검색 결과가 없습니다.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  데이터를 불러오는 중입니다...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
