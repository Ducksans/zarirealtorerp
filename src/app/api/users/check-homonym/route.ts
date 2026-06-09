import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return NextResponse.json({ users: [] });
    }

    const homonyms = await prisma.user.findMany({
      where: { 
        name: name,
        status: 'ACTIVE' // 재직 중인 사원 중에서만 검증
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        birthDate: true,
        phone: true,
      }
    });

    // 개인정보 마스킹 처리 (클라이언트에 안전하게 전달)
    const maskedUsers = homonyms.map(u => {
      // 전화번호 마스킹 (예: 010-1234-5678 -> 010-****-5678)
      let maskedPhone = u.phone;
      if (maskedPhone && maskedPhone.length > 8) {
        const parts = maskedPhone.split('-');
        if (parts.length === 3) {
          maskedPhone = `${parts[0]}-****-${parts[2]}`;
        } else {
          maskedPhone = maskedPhone.slice(0, 3) + '****' + maskedPhone.slice(-4);
        }
      }

      // 생년월일 마스킹 (예: 1990-01-01 -> 1990-**-**)
      let maskedBirth = u.birthDate;
      if (maskedBirth && maskedBirth.length >= 7) {
        maskedBirth = `${maskedBirth.substring(0, 4)}-**-**`;
      }

      return {
        ...u,
        phone: maskedPhone || '미등록',
        birthDate: maskedBirth || '미등록'
      };
    });

    return NextResponse.json({ users: maskedUsers });
  } catch (error) {
    return handleError(error);
  }
}
