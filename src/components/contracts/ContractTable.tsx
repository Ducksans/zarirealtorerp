/**
 * @file src/components/contracts/ContractTable.tsx
 * @description 계약(매출) 관리 - 매출 내역 리스트 컴포넌트
 * @purpose 서버에서 불러온 전체 매출 현황을 표 형태로 렌더링하고 삭제 기능을 제공합니다 (SRP 분리).
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

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
  const [isScanning, setIsScanning] = useState(false);

  // Fake AI scanning effect
  useEffect(() => {
    if (contracts.length > 0) {
      setIsScanning(true);
      const timer = setTimeout(() => setIsScanning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [contracts]);

  const formatKrw = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-white">전사 매출 현황</h2>
        <div className="w-full sm:w-64 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input 
            type="text" 
            placeholder="담당자명 또는 사번 검색..." 
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        .ai-scan-overlay {
          position: relative;
          overflow: hidden;
        }
        .ai-scan-overlay::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 10px;
          background: linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.8), transparent);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.5);
          animation: scanline 2s linear infinite;
          pointer-events: none;
          z-index: 50;
        }
      `}} />
      <div className={`overflow-x-auto ${isScanning ? 'ai-scan-overlay' : ''}`}>
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
            {contracts.map((c) => {
              const hasRisk = c.transactions && (c.transactions.length > 5 || c.transactions.some(t => t.percentage < 5));
              
              return (
              <React.Fragment key={c.id}>
                <tr className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${hasRisk && !isScanning ? 'bg-red-950/10' : ''}`} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <td className="px-6 py-4 text-slate-400">
                    <div className="flex items-center gap-2">
                      {new Date(c.contractDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    <div className="flex items-center gap-3">
                      <div>
                        {c.agent?.name} <span className="text-xs text-slate-500 block">{c.agent?.employeeId}</span>
                      </div>
                      {isScanning && (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-widest bg-cyan-950/50 text-cyan-400 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)] relative overflow-hidden">
                           <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping"></span>
                           AI SCANNING
                         </span>
                      )}
                      {hasRisk && !isScanning && (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-widest bg-red-950/80 text-red-400 border border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse">
                           <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                           위험주의 (RISK)
                         </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative group/tooltip inline-block">
                      <span className={`px-2 py-1 text-xs rounded-full border cursor-help flex items-center gap-1 ${c.signatureStatus === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {c.signatureStatus === 'SIGNED' ? '결재완료' : '결재대기'}
                        <Info className="w-3 h-3 opacity-70" />
                      </span>
                      {/* Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-max max-w-[200px] bg-slate-800 text-slate-300 text-[11px] px-3 py-2 rounded shadow-lg border border-slate-700 z-50 whitespace-normal text-center">
                        {c.signatureStatus === 'SIGNED' ? '전자결재가 완료되어 익월 정산 대상에 포함되었습니다.' : '본부장 및 대표의 최종 서명이 필요한 기안입니다.'}
                        {/* Tooltip arrow */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400 font-medium tracking-wider">{formatKrw(c.grossCommission)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                      className="text-slate-500 hover:text-red-400 transition-colors text-xs font-medium"
                    >
                      취소
                    </button>
                  </td>
                </tr>
                {expandedId === c.id && c.transactions && c.transactions.length > 0 && (
                  <tr className="bg-slate-900/60 border-t border-slate-700/50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-slate-400 font-medium tracking-wide">정산 내역 (수수료 배분)</div>
                        {hasRisk && !isScanning && (
                           <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                             ⚠️ AI 탐지: {c.transactions.length > 5 ? '수신자 과다 (5명 초과)' : '비정상 배분 비율 (5% 미만) 존재'}
                           </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {c.transactions.map((t) => {
                          const isAnomalous = t.percentage < 5;
                          return (
                            <div key={t.id} className={`flex justify-between items-center p-3 rounded-lg border relative overflow-hidden ${isAnomalous ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-slate-800 border-slate-700'}`}>
                              {isAnomalous && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                              )}
                              <div className="pl-2">
                                <span className={isAnomalous ? "text-red-300 font-medium" : "text-white font-medium"}>{t.recipient.name}</span>
                                <span className="text-slate-500 ml-2 text-xs">({t.role})</span>
                                {isAnomalous && (
                                  <span className="ml-3 text-[9px] text-red-400 uppercase tracking-widest border border-red-500/40 px-1.5 py-0.5 rounded-sm bg-red-500/10">
                                    비정상 배분
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-emerald-400 font-medium tracking-wider">{formatKrw(t.amount)}</div>
                                <div className={`${isAnomalous ? 'text-red-400 font-bold' : 'text-slate-500'} text-[11px]`}>{t.percentage}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
                {expandedId === c.id && (!c.transactions || c.transactions.length === 0) && (
                  <tr className="bg-slate-900/60 border-t border-slate-700/50">
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 tracking-wide">
                      <div className="relative group/tooltip inline-flex items-center justify-center gap-2 cursor-help">
                        <span>정산 내역이 없습니다. (월 마감 전)</span>
                        <Info className="w-4 h-4 text-slate-400" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-max max-w-[250px] bg-slate-800 text-slate-300 text-[11px] px-3 py-2 rounded shadow-lg border border-slate-700 z-50 text-center">
                          수수료 정산 내역은 월말 결산 배치(Batch) 작업 후 일괄 생성됩니다.
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )})}
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
