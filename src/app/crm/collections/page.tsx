/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function CollectionsMockup() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: '회장님, 이번에 요청하신 조건에 맞는 도산대로 이면 빌딩 3건 추려서 컬렉션 보드에 담아두었습니다.', time: '오전 10:30' },
    { id: 2, sender: 'client', text: '수고하셨습니다. 첫 번째 매물은 주차가 몇 대나 됩니까?', time: '오전 10:45' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'agent', text: input, time: '방금 전' }]);
    setInput('');
  };

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/crm" className="text-blue-600 font-bold hover:underline">← CRM 홈</Link>
          <div className="w-px h-6 bg-slate-200"></div>
          <h1 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            🤝 VIP 컬렉션 보드 <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded">정약용 회장님 전용</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-slate-600 font-bold rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-2">
            🔗 고객 초대 링크 복사
          </button>
          <button className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">
            매물 추가하기
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Saved Properties Board (Pinterest style) */}
        <div className="flex-[2] p-8 overflow-y-auto bg-slate-100 border-r border-slate-200">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Property Card 1 */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 group">
              <div className="h-48 bg-slate-300 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">수익률 4.8%</div>
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                  ❤️
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-slate-900 mb-1">논현동 언주역 이면 메디컬 빌딩</h3>
                <div className="text-2xl font-black text-blue-600 mb-4">120억 원</div>
                <div className="flex gap-4 text-sm text-slate-500 mb-4">
                  <div>대지 <span className="font-bold text-slate-700">120평</span></div>
                  <div>연면적 <span className="font-bold text-slate-700">350평</span></div>
                  <div>주차 <span className="font-bold text-slate-700">자주식 8대</span></div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100 mb-4">
                  "코너 건물이라 가시성이 매우 뛰어납니다. 1층에 스타벅스 입점 협의 중입니다." - <span className="font-bold">조률 수석</span>
                </div>
                <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">VR 임장 열기</button>
              </div>
            </div>

            {/* Property Card 2 */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 group">
              <div className="h-48 bg-slate-300 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">사옥용 추천</div>
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                  🤍
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-slate-900 mb-1">도산대로 이면 올근생 신축 빌딩</h3>
                <div className="text-2xl font-black text-blue-600 mb-4">155억 원</div>
                <div className="flex gap-4 text-sm text-slate-500 mb-4">
                  <div>대지 <span className="font-bold text-slate-700">140평</span></div>
                  <div>연면적 <span className="font-bold text-slate-700">420평</span></div>
                  <div>주차 <span className="font-bold text-slate-700">기계식 12대</span></div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100 mb-4">
                  "현재 엔터테인먼트 사옥으로 통임대 중이며, 6개월 뒤 명도 가능합니다." - <span className="font-bold">조률 수석</span>
                </div>
                <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">VR 임장 열기</button>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Live Chat / Collaboration */}
        <div className="flex-1 bg-white flex flex-col relative z-10 shadow-[-5px_0_15px_rgba(0,0,0,0.03)]">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold">정</div>
            <div>
              <div className="font-bold text-slate-900">정약용 회장님</div>
              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 접속 중</div>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="text-center text-xs text-slate-400 my-4">2026년 6월 9일</div>
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[80%]">
                  {msg.sender === 'agent' && <span className="text-[10px] text-slate-400 mb-1">{msg.time}</span>}
                  <div className={`p-4 rounded-2xl ${msg.sender === 'agent' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                  {msg.sender === 'client' && <span className="text-[10px] text-slate-400 mb-1">{msg.time}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={sendMessage} className="flex gap-2 relative">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="고객에게 메시지 전송..." 
                className="flex-1 bg-slate-100 border-none rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              />
              <button type="submit" disabled={!input.trim()} className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-300 transition-colors">
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
