/**
 * @file src/components/dashboard/SettlementTable.tsx
 * @description 직원별 정산 내역 및 검색 필터 테이블 컴포넌트
 * @purpose 정산 리스트 시각화 및 클라이언트 사이드 검색 기능 담당 (SRP 분리)
 */

'use client';

type Settlement = {
  id: string;
  user: { name: string; role: string; employeeId: string };
  basePay: number;
  bonusPay: number;
  overridePay: number;
  totalPay: number;
};

interface SettlementTableProps {
  settlements: Settlement[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function SettlementTable({ settlements, loading, searchTerm, onSearchChange }: SettlementTableProps) {
  const formatKrw = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-white">직원별 급여 명세서 (2026-06)</h2>
        <div className="w-full sm:w-72">
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
              <th className="px-6 py-4 font-medium">직원명</th>
              <th className="px-6 py-4 font-medium">직급</th>
              <th className="px-6 py-4 font-medium text-right">기본 영업수당</th>
              <th className="px-6 py-4 font-medium text-right">영업지원비</th>
              <th className="px-6 py-4 font-medium text-right text-indigo-300">오버라이딩 수당</th>
              <th className="px-6 py-4 font-medium text-right text-emerald-300">최종 지급액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {settlements.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-white">
                  {s.user.name} <span className="text-xs text-slate-500 block">{s.user.employeeId}</span>
                </td>
                <td className="px-6 py-4 text-slate-400">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    s.user.role === 'BRANCH_MGR' ? 'bg-purple-500/20 text-purple-300' :
                    s.user.role === 'DIV_HEAD' ? 'bg-indigo-500/20 text-indigo-300' :
                    s.user.role === 'TEAM_LEADER' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {s.user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">{formatKrw(s.basePay)}</td>
                <td className="px-6 py-4 text-right">{formatKrw(s.bonusPay)}</td>
                <td className="px-6 py-4 text-right text-indigo-300 font-medium">{formatKrw(s.overridePay)}</td>
                <td className="px-6 py-4 text-right text-emerald-300 font-bold">{formatKrw(s.totalPay)}</td>
              </tr>
            ))}
            {settlements.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  검색 결과가 없거나 정산 데이터가 없습니다. 상단의 '데이터 초기화' 후 '정산 실행' 버튼을 눌러주세요.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
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
