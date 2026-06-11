"use client";

import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

export default function CustomersPage() {
  const { data, mutate } = useSWR('/api/customers', fetcher, { suspense: true });
  const customers = data?.customers || [];

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    customerType: '임대인',
    agentId: 'SYSTEM', // Defaulting for demo
    notes: ''
  });

  const handleSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedCustomer(null);
    setIsEditing(false);
    setFormData({ name: '', phone: '', customerType: '임대인', agentId: 'SYSTEM', notes: '' });
  };

  const handleEdit = () => {
    if (!selectedCustomer) return;
    setIsEditing(true);
    setIsCreating(false);
    setFormData({
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      customerType: selectedCustomer.customerType,
      agentId: selectedCustomer.agentId,
      notes: selectedCustomer.notes || ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } else if (isEditing && selectedCustomer) {
      await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }
    
    setIsCreating(false);
    setIsEditing(false);
    mutate();
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    await fetch(`/api/customers/${selectedCustomer.id}`, {
      method: 'DELETE'
    });
    
    setSelectedCustomer(null);
    mutate();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">고객 원장</h1>
          <p className="text-sm text-gray-500 mt-1">M5 Customer Ledger</p>
        </div>
        <button 
          onClick={handleCreateNew} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow transition-colors"
        >
          + 신규 고객 등록
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* List View */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-y-auto">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {customers.map((c: any) => (
              <li 
                key={c.id} 
                onClick={() => handleSelect(c)}
                className={`p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{c.phone}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {c.customerType}
                  </span>
                </div>
              </li>
            ))}
            {customers.length === 0 && (
              <li className="p-8 text-center text-gray-500">
                등록된 고객이 없습니다.
              </li>
            )}
          </ul>
        </div>

        {/* Detail/Edit View */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6 overflow-y-auto">
          {(isCreating || isEditing) ? (
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-4 mb-4">
                {isCreating ? '신규 고객 등록' : '고객 정보 수정'}
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
                  <input 
                    type="text" required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm px-3 py-2 border"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">연락처</label>
                  <input 
                    type="text" required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm px-3 py-2 border"
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">고객 유형</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm px-3 py-2 border"
                    value={formData.customerType} onChange={(e) => setFormData({...formData, customerType: e.target.value})}
                  >
                    <option value="임대인">임대인</option>
                    <option value="임차인">임차인</option>
                    <option value="매도인">매도인</option>
                    <option value="매수인">매수인</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">담당자 ID</label>
                  <input 
                    type="text" required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm px-3 py-2 border"
                    value={formData.agentId} onChange={(e) => setFormData({...formData, agentId: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">메모</label>
                <textarea 
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm px-3 py-2 border"
                  value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); }} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
                  취소
                </button>
                <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  저장
                </button>
              </div>
            </form>
          ) : selectedCustomer ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedCustomer.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleEdit} className="px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300">수정</button>
                  <button onClick={handleDelete} className="px-3 py-1.5 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300">삭제</button>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">고객 유형</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedCustomer.customerType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">등록일</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">메모</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md whitespace-pre-wrap">
                    {selectedCustomer.notes || '메모 없음'}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 flex-col space-y-4">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>고객을 선택하거나 새 고객을 등록하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
