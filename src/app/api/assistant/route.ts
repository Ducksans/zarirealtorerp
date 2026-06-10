/*---
id: assistant_api
milestone: M10
why: AI 보좌관 질문 엔드포인트 — 자연어 질문을 assistantBrain의 결정론적 분석으로 넘겨 실데이터 기반 한국어 답변(reply + 추천 칩)을 반환한다 (LLM 미사용, 거짓말 불가)
backlinks: [[assistantBrain.ts]], [[home_page]]
---*/

/**
 * @file src/app/api/assistant/route.ts
 * @description AI 보좌관 POST 엔드포인트 (Controller)
 * @dependencies assistantBrain(answerQuestion), errorHandler, zod
 * @purpose 입력 검증과 응답 포맷만 담당 — 분석 로직은 전부 assistantBrain에 위임
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { answerQuestion } from '@/lib/assistantBrain';
import { handleError } from '@/lib/errorHandler';

const AskSchema = z.object({
  userId: z.string().min(1, 'userId가 필요합니다.'),
  message: z.string().min(1, 'message가 필요합니다.').max(500, '질문은 500자 이내로 입력해 주세요.'),
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'yearMonth는 YYYY-MM 형식이어야 합니다.').optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, message, yearMonth } = AskSchema.parse(body);

    const answer = await answerQuestion(userId, message, yearMonth);
    return NextResponse.json(answer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map(e => e.message).join(', ') },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}
