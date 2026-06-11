'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { PropertyLedger, User, CustomerLedger } from '@prisma/client';

type PropertyWithRelations = PropertyLedger & {
  agent: Pick<User, 'name' | 'employeeId'>;
  owner: Pick<CustomerLedger, 'name' | 'phone'> | null;
};

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
});

export default function PropertiesPage() {
  const { data: properties, error } = useSWR<PropertyWithRelations[]>('/api/properties', fetcher, { suspense: true });
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');

  if (error) {
    throw error;
  }

  // Kanban groups
  const statusColumns = ['AVAILABLE', 'RESERVED', 'SOLD'];
  const propertiesByStatus = statusColumns.map((status) => ({
    status,
    items: properties?.filter((p) => p.status === status) || [],
  }));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(price * 10000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SOLD': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return '거래가능';
      case 'RESERVED': return '예약/가계약';
      case 'SOLD': return '거래완료';
      default: return status;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">매물 원장 (Property Ledger)</h1>
          <p className="text-gray-500 mt-1">Zari ERP 시스템의 자산 현황을 한눈에 관리하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              그리드 뷰
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              칸반 뷰
            </button>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            신규 매물 등록
          </button>
        </div>
      </header>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties?.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col group cursor-pointer">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(property.status)}`}>
                    {getStatusLabel(property.status)}
                  </span>
                  <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">{property.propertyType}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{property.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{property.address}</p>
                <div className="flex items-end justify-between mt-auto">
                  <div className="text-xl font-bold text-gray-900 tracking-tight">
                    {formatPrice(property.price)}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>{property.agent.name} 담당</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="flex gap-6 overflow-x-auto pb-4 items-start">
          {propertiesByStatus.map((col) => (
            <div key={col.status} className="bg-gray-50 rounded-xl p-4 w-80 flex-shrink-0 border border-gray-200">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.status === 'AVAILABLE' ? 'bg-green-500' : col.status === 'RESERVED' ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
                  {getStatusLabel(col.status)}
                </h2>
                <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full">{col.items.length}</span>
              </div>
              <div className="space-y-3">
                {col.items.map((property) => (
                  <div key={property.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-400 font-medium">{property.propertyType}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{property.title}</h3>
                    <div className="text-blue-600 font-bold text-sm mb-3">
                      {formatPrice(property.price)}
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                        {property.agent.name.charAt(0)}
                      </div>
                      <span>{property.agent.name}</span>
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    매물이 없습니다
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
