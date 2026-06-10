/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

/**
 * @id CrmLeadMentoringView
 * @milestone M17
 * @why 신입 사원이 신규 리드를 생성하고, 직속 상관으로부터 코칭(Mentoring)을 받기 위함
 * @backlinks [[plan_crm_mentoring_system.md]]
 */
'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LeadDetailMentoring() {
  const [comments, setComments] = useState([
    {
      id: 1,
      author: '이덕산 본부장 (상관)',
      role: 'manager',
      text: '이 건물주 성향상 첫 베팅을 높게 부르는 거니까, 이번에 들어갈 임차인이 인테리어 공사 싹 해주는 조건으로 월세 동결하자고 역제안 해봐.',
      time: '10분 전',
    },
  ]);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, { id: Date.now(), author: '김신입 주임', role: 'employee', text: newComment, time: '방금 전' }]);
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">강남구 역삼동 150평 사무실 리드</h1>
            <p className="text-sm text-gray-500 mt-1">상태: 협상중 | 담당: 김신입 주임</p>
          </div>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
            🆘 직속 상관 개입 요청 (SOS)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Lead Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold border-b border-gray-100 pb-4 mb-4">고객 니즈 분석 (Needs)</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-500">희망 임대료</span>
                  <span className="font-medium">보증금 1억 / 월세 800만 원 이하</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">주요 요구사항</span>
                  <span className="font-medium">통신/IT 기업으로 서버실 별도 공간 필요</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">건물주 스탠스</span>
                  <span className="font-medium text-red-600">최근 시세 상승을 이유로 월세 950만 원 고집 중</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Mentoring Thread */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-blue-50/50 rounded-t-xl flex justify-between items-center">
                <h2 className="font-semibold text-blue-900">🛡️ 리더십 코칭 스레드</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">사내 전용</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-xs text-center text-gray-400 mb-4">오늘</div>
                {comments.map((c) => (
                  <div key={c.id} className={`flex flex-col ${c.role === 'manager' ? 'items-start' : 'items-end'}`}>
                    <div className="text-xs text-gray-500 mb-1">{c.author} • {c.time}</div>
                    <div className={`p-3 rounded-xl text-sm max-w-[85%] ${
                      c.role === 'manager' 
                        ? 'bg-blue-100 text-blue-900 rounded-tl-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tr-none'
                    }`}>
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="상관에게 조언 구하기..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button onClick={handleAddComment} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
