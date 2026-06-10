'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toastError } from '@/lib/toast';

type Notice = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NoticeBoard() {
  const { data: notices, error, isLoading, mutate } = useSWR<Notice[]>('/api/notices', fetcher);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isComposing, setIsComposing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return toastError('제목과 내용을 모두 입력해주세요.');
    
    await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    setFormData({ title: '', content: '' });
    setIsComposing(false);
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    await fetch(`/api/notices?id=${id}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">사내 게시판 (Notice)</h1>
            <p className="text-slate-400 mt-1">중요 공지사항 및 업무 매뉴얼을 공유합니다.</p>
          </div>
          <button 
            onClick={() => setIsComposing(!isComposing)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isComposing ? '취소' : '✍️ 새 글 쓰기'}
          </button>
        </div>

        {/* Compose Form */}
        {isComposing && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">제목</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">내용</label>
                <textarea 
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="공지 내용을 자세히 입력하세요..."
                />
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notice List */}
        <div className="space-y-4">
          {error && <div className="text-red-400">데이터를 불러오는데 실패했습니다.</div>}
          {isLoading && <div className="text-slate-400 animate-pulse">로딩 중...</div>}
          
          {!isLoading && !error && notices?.map((notice) => (
            <div key={notice.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:border-slate-600 transition-colors relative group">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">{notice.title}</h2>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500">{new Date(notice.createdAt).toLocaleString()}</span>
                  <span className="text-xs font-medium text-indigo-400 mt-1">{notice.authorId}</span>
                </div>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{notice.content}</p>
              
              <button 
                onClick={() => handleDelete(notice.id)}
                className="absolute bottom-6 right-6 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium"
              >
                삭제
              </button>
            </div>
          ))}
          {!isLoading && notices?.length === 0 && (
            <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700/50 text-center">
              <p className="text-slate-400">등록된 게시글이 없습니다.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
