'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, ChevronRight, ChevronLeft, Trash2, Phone, User, Home, Wrench } from 'lucide-react';

const STAGES = ['신규접수', '1차콜', '현장투어', '가계약', '최종계약'];

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Not auth');
  return res.json();
});

export default function CRMPage() {
  const { data: leads, error, mutate } = useSWR('/api/crm', fetcher);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Lead Form
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [propertyType, setPropertyType] = useState('아파트');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, contactInfo, propertyType, budget, notes })
    });
    setIsAdding(false);
    setCustomerName(''); setContactInfo(''); setBudget(''); setNotes('');
    mutate();
  };

  const moveLead = async (id: string, currentStage: string, direction: 'next' | 'prev') => {
    const currentIndex = STAGES.indexOf(currentStage);
    let newStage = currentStage;
    
    if (direction === 'next' && currentIndex < STAGES.length - 1) newStage = STAGES[currentIndex + 1];
    if (direction === 'prev' && currentIndex > 0) newStage = STAGES[currentIndex - 1];
    
    if (newStage === currentStage) return;

    // Optimistic update
    const updatedLeads = leads.map((l: any) => l.id === id ? { ...l, stage: newStage } : l);
    mutate(updatedLeads, false);

    await fetch(`/api/crm/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage })
    });
    mutate();
  };

  const deleteLead = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await fetch(`/api/crm/${id}`, { method: 'DELETE' });
    mutate();
  };

  if (error) return <div className="p-8 text-red-400">데이터를 불러오지 못했습니다. 로그인 상태를 확인하세요.</div>;
  if (!leads) return <div className="p-8 text-slate-400">Loading CRM Pipeline...</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">영업 파이프라인 (CRM)</h1>
          <p className="text-slate-400">고객 리드를 단계별로 관리하고 계약 전환율을 극대화하세요.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-5 h-5" /> 리드 추가
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-900/50 border border-indigo-500/30 p-6 rounded-2xl mb-8 shadow-xl backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4">신규 고객 등록</h2>
          <form onSubmit={handleAddLead} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input required placeholder="고객명" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            <input required placeholder="연락처" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white">
              <option>아파트</option>
              <option>상가</option>
              <option>오피스텔</option>
              <option>토지</option>
            </select>
            <input type="number" placeholder="예산(만원)" value={budget} onChange={e => setBudget(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            <input placeholder="특이사항" value={notes} onChange={e => setNotes(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            
            <div className="lg:col-span-5 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">취소</button>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium">등록 완료</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px]">
        {STAGES.map((stage, stageIndex) => {
          const stageLeads = leads.filter((l: any) => l.stage === stage);
          
          return (
            <div key={stage} className="flex-none w-80 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 rounded-t-2xl">
                <h3 className="font-bold text-slate-200">{stage}</h3>
                <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full">{stageLeads.length}</span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {stageLeads.map((lead: any) => (
                  <div key={lead.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-700 shadow-lg group hover:border-indigo-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-white text-lg flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-400" />
                        {lead.customerName}
                      </h4>
                      <button onClick={() => deleteLead(lead.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="w-3.5 h-3.5" /> {lead.contactInfo}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Home className="w-3.5 h-3.5" /> {lead.propertyType} {lead.budget ? `· ${lead.budget}만원` : ''}
                      </div>
                      {lead.notes && (
                        <div className="flex items-start gap-2 text-sm text-amber-500/80 mt-2 bg-amber-500/5 p-2 rounded">
                          <Wrench className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> 
                          <span className="line-clamp-2">{lead.notes}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                      <button 
                        disabled={stageIndex === 0}
                        onClick={() => moveLead(lead.id, lead.stage, 'prev')}
                        className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-slate-500 font-medium tracking-wider">담당: {lead.agent.name}</span>
                      <button 
                        disabled={stageIndex === STAGES.length - 1}
                        onClick={() => moveLead(lead.id, lead.stage, 'next')}
                        className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {stageLeads.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                    <span className="text-sm text-slate-600">리드가 없습니다</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
