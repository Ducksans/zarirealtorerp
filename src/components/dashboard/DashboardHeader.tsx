/**
 * @file src/components/dashboard/DashboardHeader.tsx
 * @description 대시보드의 헤더 영역(타이틀 및 액션 버튼) 컴포넌트
 * @purpose 대시보드 내 최상단 타이틀과 초기화/정산 버튼 렌더링 (SRP 분리)
 */

'use client';

interface DashboardHeaderProps {
  loading: boolean;
  onSeed: () => void;
  onSettle: () => void;
}

export default function DashboardHeader({ loading, onSeed, onSettle }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">부동산 중개법인 ERP</h1>
        <p className="text-slate-400 mt-1">월간 정산 자동화 대시보드 (SSOT 100원 Rule 적용)</p>
      </div>
      <div className="flex gap-4">
        <button 
          onClick={onSeed}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 text-sm font-medium whitespace-nowrap disabled:opacity-50"
        >
          🔄 데이터 초기화 (Seed)
        </button>
        <button 
          onClick={onSettle}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20 whitespace-nowrap disabled:opacity-50"
        >
          ⚡ 월간 마감 및 정산 실행
        </button>
      </div>
    </div>
  );
}
