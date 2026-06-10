/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

/**
 * @id RulebookViewer
 * @milestone M7
 * @why 신규 입사자가 사내 규정집을 모바일/PC에서 언제든 열람할 수 있도록 제공
 * @backlinks [[Final_Operation_Rules.md]]
 */
'use client';
import { useState, useEffect } from 'react';

export default function RulebookPage() {
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 자리공인중개사사무소 규정집 AI입니다. 입사, 보상, 승진 등 궁금한 점을 물어보세요.' }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (window.innerWidth < 768) {
      setChatOpen(false);
    }
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: '규정집 제2장 보상 규정에 따르면, 오버라이딩 수당은 본사 순수익의 10% 비율로 팀장에게 자동 지급됩니다. 더 자세한 내용은 좌측 2번 항목을 참고해 주세요.' }]);
    }, 1000);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-bold text-xl tracking-tight">자리공인중개사 <span className="text-emerald-400">Rulebook</span></div>
        <button className="bg-slate-800 hover:bg-slate-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-700">
          <span className="text-lg">📥</span> PDF 원문 다운로드
        </button>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8 border-b pb-6">전사 통합 규정집 (Master Rulebook)</h1>
        
        <div className="prose prose-slate max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><span className="text-indigo-600">1.</span> 입사 및 채용 규정</h2>
            <p className="text-slate-600 leading-relaxed mt-4">본사의 모든 채용은 투명하고 공정한 블라인드 기반 시스템 평가를 거친다. 1차 서류 전형은 AI 기반 5대 핵심 질문 분석으로 이루어지며, 입사 확정 시 즉각 고유 사번(EMP)이 스마트 컨트랙트로 발급된다.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><span className="text-indigo-600">2.</span> 성과 및 보상 (100원 Rule)</h2>
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl mt-4">
              <h3 className="text-indigo-900 font-semibold mb-3 text-lg">제 1항. 수익의 배분 비율</h3>
              <ul className="list-disc pl-5 text-slate-700 space-y-3">
                <li><strong>기본 배분 (50%):</strong> 계약을 창출한 주 담당자에게 조건 없이 50%를 지급한다.</li>
                <li><strong>회사 마진 (27.5%):</strong> 본사 운영 및 시스템 유지보수 비용으로 귀속된다.</li>
                <li><strong>영업지원비 (10%):</strong> 계약 성사에 기여한 서브 담당자(임장 지원 등)에게 지급된다.</li>
                <li><strong>오버라이딩 (10%):</strong> 팀장 및 상위 관리자의 육성 기여도로 지급된다.</li>
                <li><strong>세금 보류 (2.5%):</strong> 소득세 등 필수 제세공과금 예비비로 할당된다.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><span className="text-indigo-600">3.</span> 부당경쟁 방지 및 제재</h2>
            <p className="text-slate-600 leading-relaxed mt-4">회사 내부의 매물 정보나 고객 정보를 외부로 유출하여 사적 이익을 취하거나, 시스템을 우회하여 이면 계약을 체결한 경우 적발 즉시 블록체인 사번이 영구 정지되며 민·형사상 고발 조치된다.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><span className="text-indigo-600">4.</span> 진급 및 퇴사 규정</h2>
            <p className="text-slate-600 leading-relaxed mt-4">일정 누적 매출(예: 1억 원) 달성 시 시스템에 의해 자동으로 직급이 상향되며, 오버라이딩 수당의 자격이 부여된다. 퇴사 시 모든 사내 권한은 소멸되나 기발생된 정산금은 스마트 컨트랙트에 의해 100% 자동 정산 후 지급된다.</p>
          </section>
        </div>
      </main>

      {/* AI Assistant Chatbot */}
      <div className={`fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-200 transition-all duration-300 transform origin-bottom-right ${chatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div className="font-bold flex items-center gap-2">🤖 규정집 AI 어시스턴트</div>
          <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 flex flex-col">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl p-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white rounded-b-2xl flex gap-2">
          <input type="text" value={input} onChange={e=>setInput(e.target.value)} placeholder="규정에 대해 물어보세요..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">전송</button>
        </form>
      </div>

      {/* Chat Toggle Button */}
      <button 
        onClick={() => setChatOpen(!chatOpen)} 
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_5px_20px_rgba(79,70,229,0.5)] flex items-center justify-center text-2xl transition-transform hover:scale-110 z-50"
      >
        {chatOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
