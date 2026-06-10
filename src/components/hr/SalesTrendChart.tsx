'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function SalesTrendChart({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      month: item.month,
      sales: item.sales / 10000 // 만원 단위로 변환
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-center py-10">데이터가 없습니다.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
            itemStyle={{ color: '#e5e7eb' }}
            formatter={(value: any) => [`${Number(value || 0).toLocaleString()} 만원`, '매출']}
          />
          <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
