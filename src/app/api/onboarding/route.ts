import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const onboardingSchema = z.object({
  name: z.string().min(1, '성명을 입력해주세요.'),
  birthDate: z.string().min(1, '생년월일을 입력해주세요.'),
  ssnSuffix: z.string().min(7, '주민등록번호 뒷자리를 입력해주세요.'),
  phone: z.string().min(1, '연락처를 입력해주세요.'),
  address: z.string().min(1, '주소를 입력해주세요.'),
  bankAccount: z.string().min(1, '계좌번호를 입력해주세요.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = onboardingSchema.parse(body);

    // Mock AI Analysis based on inputs
    const aiAnalysis = {
      type: "도전적 성취형 (Achiever)",
      strengths: [
        "목표 지향적 성향으로 빠른 실적 달성 기대",
        "명확한 커뮤니케이션 스킬",
        "문서 작성 능력 및 꼼꼼함"
      ],
      weaknesses: [
        "초기 거절에 대한 심리적 타격 가능성",
        "다소 성급한 업무 처리 경향"
      ],
      mentoringStrategy: "초기 2주간은 실무보다 마인드셋 교육에 집중. 첫 계약 달성 시 즉각적인 보상과 피드백으로 동기 부여. 거절을 극복하는 롤플레이 반복 실시."
    };

    const newRequest = await prisma.onboardingRequest.create({
      data: {
        ...validatedData,
        documents: JSON.stringify([
          { type: "이력서", url: "/mock-url/resume.pdf" },
          { type: "자기소개서", url: "/mock-url/cover-letter.pdf" },
        ]),
        aiAnalysis: JSON.stringify(aiAnalysis),
        atsStage: 'NEW',
        status: 'PENDING_TL',
      }
    });

    return NextResponse.json({ data: newRequest }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
