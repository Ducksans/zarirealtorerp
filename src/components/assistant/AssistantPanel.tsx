/*---
id: AssistantPanel.tsx
milestone: M10
why: AI 보좌관 채팅 패널 — 홈 피드 우하단에서 열리는 대화 UI. 답변은 /api/assistant의 결정론적 분석 결과만 렌더하므로 UI 껍데기가 아니라 실데이터 분석의 출구다
backlinks: [[assistant_api]], [[home_page]]
---*/

'use client';

/**
 * @file src/components/assistant/AssistantPanel.tsx
 * @description AI 보좌관 채팅 패널 (Quiet Authority — #11141a / #1f2430 / 인디고 / 에메랄드)
 * @purpose 질문 칩 + 말풍선 대화 UI. \n 줄바꿈 렌더, ₩금액 에메랄드 강조, 모바일은 하단 시트.
 */

import { useEffect, useRef, useState } from 'react';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  suggestions?: string[];
};

const WELCOME_CHIPS = [
  '이번 달 얼마 받아?',
  '지난달보다 왜 달라졌어?',
  '팀원 1명 더 늘면?',
  '영업지원비 다음 구간까지 얼마 남았어?',
];

/** \n → 줄바꿈, ₩1,234 패턴 → 에메랄드 강조 */
function MessageText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <p key={i} className={line === '' ? 'h-2' : undefined}>
          {line.split(/(₩[\d,]+)/g).map((seg, j) =>
            seg.startsWith('₩') ? (
              <span key={j} className="font-semibold text-emerald-400 tabular-nums">{seg}</span>
            ) : (
              <span key={j}>{seg}</span>
            ),
          )}
        </p>
      ))}
    </>
  );
}

export default function AssistantPanel({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 첫 진입 / 직원 변경 시 환영 메시지 + 대표 질문 칩
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: `${userName}님, 안녕하세요. AI 보좌관입니다.\n정산 데이터를 실시간으로 분석해 숫자 근거와 함께 답해 드립니다.`,
        suggestions: WELCOME_CHIPS,
      },
    ]);
  }, [userId, userName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '분석에 실패했습니다.');
      setMessages(prev => [...prev, { role: 'assistant', text: json.reply, suggestions: json.suggestions }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: e instanceof Error && e.message !== 'Failed to fetch'
          ? `분석 중 문제가 발생했습니다.\n${e.message}`
          : '분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const lastIdx = messages.length - 1;

  return (
    <div
      className="fixed z-50 inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-4 w-full sm:max-w-md
                 flex flex-col h-[72vh] sm:h-[560px]
                 rounded-t-2xl sm:rounded-2xl bg-[#11141a] border border-[#1f2430] shadow-2xl
                 text-[#cdd2da] break-keep"
      role="dialog"
      aria-label="AI 보좌관"
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1f2430]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
          <h2 className="text-sm font-semibold text-white">AI 보좌관</h2>
          <span className="text-xs text-zinc-500">실데이터 분석</span>
        </div>
        <button
          onClick={onClose}
          aria-label="보좌관 닫기"
          className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-[#1f2430] hover:text-white"
        >✕</button>
      </header>

      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1f2430] text-white rounded-br-sm'
                  : 'bg-indigo-500/10 border border-indigo-500/20 rounded-bl-sm'
              }`}
            >
              <MessageText text={msg.text} />
            </div>

            {/* 추천 질문 칩 — 마지막 보좌관 메시지에만 */}
            {msg.role === 'assistant' && i === lastIdx && !loading && (msg.suggestions?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.suggestions!.map(chip => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="rounded-full border border-indigo-500/30 bg-indigo-500/5 px-3 py-1.5
                               text-xs text-indigo-300 hover:bg-indigo-500/15"
                  >{chip}</button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="rounded-2xl rounded-bl-sm bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-2.5">
              <span className="text-sm text-indigo-300 animate-pulse">분석 중...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <form
        onSubmit={e => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-[#1f2430] px-3 py-3"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="정산에 대해 물어보세요"
          aria-label="질문 입력"
          className="flex-1 rounded-xl bg-[#0a0c10] border border-[#1f2430] px-3.5 py-2.5 text-sm
                     placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
                     hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >전송</button>
      </form>
    </div>
  );
}
