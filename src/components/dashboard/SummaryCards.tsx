/**
 * @file src/components/dashboard/SummaryCards.tsx
 * @description 대시보드 최상단 요약 카드(매출, 수익, 마진율) 컴포넌트
 * @purpose 핵심 재무 지표 데이터 시각화 (SRP 분리)
 */

'use client';

interface SummaryCardsProps {
  totalGross: number;
  companyRevTotal: number;
  margin: string;
}

export default function SummaryCards({ totalGross, companyRevTotal, margin }: SummaryCardsProps) {
  const formatKrw = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-slate-400 text-sm font-medium mb-2">법인 총매출 (Gross)</h3>
        <p className="text-3xl font-bold text-white">{formatKrw(totalGross)}</p>
        <p className="text-xs text-slate-500 mt-2">해당 월 체결된 총 중개보수</p>
      </div>
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-slate-400 text-sm font-medium mb-2">본사 순수익 (Net)</h3>
        <p className="text-3xl font-bold text-emerald-400">{formatKrw(companyRevTotal)}</p>
        <p className="text-xs text-slate-500 mt-2">모든 수당 지급 후 최종 법인 귀속액</p>
      </div>
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-slate-400 text-sm font-medium mb-2">법인 마진율</h3>
        <p className="text-3xl font-bold text-indigo-400">{margin}%</p>
        <p className="text-xs text-slate-500 mt-2">Target Margin: ~30%</p>
      </div>
    </div>
  );
}
